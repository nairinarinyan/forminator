import { Validator, ValidationError, FormValidator } from './validation';
import { clone } from './helpers';

// T - type of descriptor fields
// A - type of submit arguments
// E - type of form-level validation fields

export type SubmitFn<T, A extends object> = (values: T, args: A) => void;

export type ErrorFn = (errors: ValidationError[]) => void;

export type FormErrors<T extends object, E extends object = {}> = {
    [key in (keyof T | keyof E)]?: ValidationError;
};

export type FormValidators<T extends object, E extends object> = {
    [key in keyof E]: FormValidator<T> | FormValidator<T>[];
};

type Descriptor<T extends object, A extends object, E extends Object> = {
    onSubmit?: SubmitFn<T, A>;
    onError?: ErrorFn;
    validate?: FormValidators<T, E>;
    validateOnSubmit?: boolean;
    validateOnFieldsChange?: (keyof T)[],
};

type ExternalFieldDescriptor<T extends object, K> = K | FieldDescriptor<K, T>;

type ExternalFieldsDescriptors<T extends object> = {
    [key in keyof T]: ExternalFieldDescriptor<T, T[key]>
}

export interface FormDescriptor<T extends object, A extends object = any, E extends object = {}> extends Descriptor<T, A, E> {
    fields: ExternalFieldsDescriptors<T>;
    errors?: FormErrors<T, E>;
}

export type FieldsDescriptors<T extends object> = {
    [key in keyof T]: FieldDescriptor<T[key], T>;
}

interface InternalDescriptor<T extends object, A extends object, E extends object = {}> extends FormDescriptor<T, A, E> {
    fields: FieldsDescriptors<T>;
}

export interface FieldDescriptor<K, T extends object = {}> {
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
    validateOnChange?: boolean,
    validate?: Validator<K, T> | Validator<K, T>[];
    resetErrorOnChange?: boolean;
    value?: K;
    error?: ValidationError;
    isFieldArray?: boolean;

    onChange?: (input: any) => K;
    onRender?: (value: K) => any;
}

export enum FormEvent {
    FIELD_UPDATE,
    FIELD_ERROR,
    FIELD_ERRORS,
    FORM_ERROR,
    FORM_SUBMIT,
}

export type UpdateListenerOptions = {
    ignoreOnRender: boolean;
};

export type ErrorListenerOptions = {
    ignoreOnRender: boolean;
};

export type FormListener<T = any, A extends (UpdateListenerOptions | ErrorListenerOptions) = any> = {
    event: FormEvent,
    fieldName?: keyof T,
    listener: (args: any) => void;
    options: A;
}

const defaultFormDescriptor: InternalDescriptor<any, any, {}> = {
    fields: {},
    onError: console.error,

    validate: {},
    validateOnSubmit: true,
    validateOnFieldsChange: [],
    errors: {}
};

const defaultFieldDescriptor: FieldDescriptor<string> = {
    validate: () => true,
    validateOnBlur: true,
    validateOnSubmit: true,
    validateOnChange: false,

    resetErrorOnChange: true,
    isFieldArray: false,
    value: '',
    error: null
};

export class Forminator<T extends object, A extends object = any, E extends object = any> {
    public descriptor: InternalDescriptor<T, A, E>;
    private _externalDescriptor: FormDescriptor<T, A, E>;
    private _listeners: FormListener[] = [];

    id: string;

    constructor(descriptor: FormDescriptor<T, A, E>) {
        this.id = `form-${Math.random() * (10000 - 100) + 100 << 0}`;
        this._externalDescriptor = descriptor;
        this.initDescriptor(descriptor);
    }

    private initDescriptor(descriptor: FormDescriptor<T, A, E>) {
        this.descriptor = this.normalizeFields(descriptor);
    }

    private normalizeFields(descriptor: FormDescriptor<T, A, E>): InternalDescriptor<T, A, E> {
        const normalizedFields = Object.entries<ExternalFieldDescriptor<T, any>>(descriptor.fields)
            .map(entry => {
                const [key, value] = entry;
                const isDescriptorLike = typeof value === 'object' && value !== null && 'value' in value;
                const valueAsDescriptor = value as FieldDescriptor<any, T>;

                const field: FieldDescriptor<any, T> = isDescriptorLike ?
                    { ...defaultFieldDescriptor, ...valueAsDescriptor, value: clone(valueAsDescriptor.value) } :
                    { ...defaultFieldDescriptor, value: clone(value) };

                return { [key]: field };
            })
            .reduce<FieldsDescriptors<T>>((acc, curr) => ({ ...acc, ...curr }), {} as FieldsDescriptors<T>);

        return {
            ...(defaultFormDescriptor as InternalDescriptor<T, A, E>),
            ...descriptor,
            validateOnFieldsChange: descriptor.validateOnFieldsChange || defaultFormDescriptor.validateOnFieldsChange as (keyof T)[],
            fields: normalizedFields
        };
    }

    private informListeners<A extends (UpdateListenerOptions | ErrorListenerOptions) = any>(
        evt: FormEvent,
        args: any,
        fieldName?: keyof T,
        applyOptions?: (listender: FormListener<T, A>, args: any) => any
    ) {
        this._listeners
            .filter(l => {
                return l.event === evt && (l.fieldName ? l.fieldName === fieldName : true);
            })
            .forEach(l => {
                l.listener(applyOptions ? applyOptions(l, args) : args)
            })
    }

    private informUpdate<K>(name: keyof T, field: FieldDescriptor<K, T>) {
        const { value, onRender } = field;

        this.informListeners<UpdateListenerOptions>(
            FormEvent.FIELD_UPDATE,
            value,
            name,
            (listener) => {
                const { ignoreOnRender } = listener.options;
                return (ignoreOnRender || !onRender) ? value : onRender(value);
            }
        );
    }

    private setFieldError(fieldName: keyof T, error: ValidationError) {
        const { errors, fields } = this.descriptor;

        if (fields[fieldName].error !== error) {
            fields[fieldName].error = error;
            this.informListeners(FormEvent.FIELD_ERROR, error, fieldName);
        }

        if (!error) {
            if (!errors[fieldName]) return;
            delete errors[fieldName];
            this.informListeners(FormEvent.FORM_ERROR, { ...this.descriptor.errors });
        } else {
            const isSame = errors[fieldName] && (errors[fieldName].message === error.message);
            errors[fieldName] = error;

            if (isSame) {
                this.informListeners(FormEvent.FORM_ERROR, this.descriptor.errors);
            } else {
                this.informListeners(FormEvent.FORM_ERROR, { ...this.descriptor.errors });
            }
        }
    }

    get fields() {
        return Object.entries(this.descriptor.fields) as [keyof T, FieldDescriptor<unknown, T>][];
    }

    get formErrors() {
        return this.descriptor.errors;
    }

    setFieldValue(name: keyof T, value: any) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = fields[name];
        const { onChange } = field;

        field.value = onChange ? onChange(value) : value;
        this.informUpdate(name, field);

        if (field.resetErrorOnChange) {
            this.setFieldError(name, null);
        }

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, this.descriptor.fields);
        }

        if (validateOnFieldsChange.includes(name)) {
            this.validateForm();
        }
    }

    setFieldArrayValue(name: keyof T, index: number, value: any) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = fields[name];
        (<unknown>field.value as any[])[index] = value;
        this.informUpdate(name, field);

        if (field.resetErrorOnChange) {
            this.setFieldError(name, null);
        }

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, fields);
        }

        if (validateOnFieldsChange.includes(name)) {
            this.validateForm();
        }
    }

    addFieldToArray(name: keyof T, value?: any) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = this.descriptor.fields[name];
        const currentValue = (<unknown>field.value as any[]);

        const valueToSet = typeof value === 'undefined' ? '' : value;
        (<unknown>field.value as any[]) = currentValue.concat(valueToSet);

        this.informUpdate(name, field);

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, fields);
        }

        if (validateOnFieldsChange.includes(name)) {
            this.validateForm();
        }
    }

    removeFieldFromArray(name: keyof T, idx: number) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = this.descriptor.fields[name];
        const currentValue = (<unknown>field.value as any[]).slice();
        currentValue.splice(idx, 1);

        (<unknown>field.value as any[]) = currentValue;
        this.informUpdate(name, field);

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, fields);
        }

        if (validateOnFieldsChange.includes(name)) {
            this.validateForm();
        }
    }

    setFieldValues(values: Partial<T>, merge?: boolean) {
        this.fields.forEach(([key]) => {
            if (!values.hasOwnProperty(key)) {
                if (merge) return;

                this.setFieldValue(key, undefined);
            }

            this.setFieldValue(key, values[key]);
        });
    }

    setFieldValidators<K>(fieldName: keyof T, validate: Validator<T[keyof T], T> | Validator<T[keyof T], T>[]) {
        this.descriptor.fields[fieldName].validate = validate;
    }

    getFieldValue(fieldName: keyof T) {
        return this.descriptor.fields[fieldName].value;
    }

    submit(args?: A): T {
        try {
            this.validateFields();
            const errors = this.validateForm();

            if (!!Object.keys(errors).length) {
                throw new ValidationError('Invalid form', Object.values(errors));
            }

            const submitData = this.fields
                .map(([key, value]) => {
                    return { [key]: value.value};
                })
                .reduce<T>((acc, curr) => ({ ...acc, ...curr }), {} as T);

            this.descriptor.onSubmit && this.descriptor.onSubmit(submitData, args);
            this.informListeners(FormEvent.FIELD_ERRORS, null);
            return submitData;
        } catch (err) {
            this.descriptor.onError && this.descriptor.onError(err);
            this.informListeners(FormEvent.FIELD_ERRORS, err)
        }
    }

    validateField(name: keyof T, field: FieldDescriptor<unknown, T>, fields: FieldsDescriptors<T>): ValidationError {
        const validateFns = Array.isArray(field.validate) ? field.validate : [field.validate];

        try {
            for (const validateFn of validateFns) {
                if (field.isFieldArray) {
                    const errors = (field.value as unknown[]).map(value => {
                        try {
                            validateFn({ ...field, value }, fields);
                            return null;
                        } catch (err) {
                            return err as ValidationError;
                        }
                    });

                    if (errors.filter(Boolean).length) {
                        throw new ValidationError('', errors);
                    }
                } else {
                    validateFn(field, fields);
                }
            }

            this.setFieldError(name, null);
        } catch (err) {
            this.setFieldError(name, err);
            return err;
        }

        return null;
    }

    validateFields() {
        const errors = this.fields
            .map(([name, field]) => {
                return this.validateField(name as keyof T, field, this.descriptor.fields);
            })
            .filter(Boolean);

        if (!!errors.length) {
            throw new ValidationError('Invalid form', errors);
        }
    }

    validateForm() {
        const { validate, fields } = this.descriptor;

        // validate
        const errors = Object
            .entries<FormValidator<T> | FormValidator<T>[]>(validate)
            .map(([key, validate]): { [key in keyof (T | E)]?: FormErrors<T, E> } => {
                const validateFns = Array.isArray(validate) ? validate : [validate];

                try {
                    for (const validateFn of validateFns) {
                        validateFn(fields);
                    }

                    return {};
                } catch (err) {
                    return { [key as any]: err as FormErrors<T, E> };
                }
            })
            .reduce((acc, curr) => Object.assign(acc, curr), {} as FormErrors<T, E>);

        const validateKeys = Object.keys(validate) as (keyof T | keyof E)[];

        const otherErrors = (Object
            .keys(this.descriptor.errors) as (keyof T | keyof E)[])
            .reduce((acc, key) => {
                if (!validateKeys.includes(key)) {
                    acc[key] = this.descriptor.errors[key];
                }
                return acc;
            }, {} as FormErrors<T, E>);

        this.descriptor.errors = {...otherErrors, ...errors };
        this.informListeners(FormEvent.FORM_ERROR, this.descriptor.errors);

        return errors;
    }

    // hooks
    onFieldUpdate(name: keyof T, listenerFn: (value: any) => void, options?: UpdateListenerOptions) {
        const listener: FormListener<T> = {
            event: FormEvent.FIELD_UPDATE,
            fieldName: name,
            listener: listenerFn,
            options: options || {}
        };

        this._listeners.push(listener);
    }

    onFieldError(name: keyof T, listenerFn: (error: ValidationError) => void, options?: ErrorListenerOptions) {
        const listener: FormListener<T> = {
            event: FormEvent.FIELD_ERROR,
            fieldName: name,
            listener: listenerFn,
            options: options || {}
        };

        this._listeners.push(listener);
    }

    onFormError(listenerFn: (errors: FormErrors<T, E>) => void, options?: ErrorListenerOptions) {
        const listener: FormListener<T> = {
            event: FormEvent.FORM_ERROR,
            listener: listenerFn,
            options: options || {}
        };

        this._listeners.push(listener);
    }

    onFieldErrors(listenerFn: (errors: ValidationError[]) => void, options?: ErrorListenerOptions) {
        const listener: FormListener<T> = {
            event: FormEvent.FIELD_ERRORS,
            listener: listenerFn,
            options: options || {}
        };

        this._listeners.push(listener);
    }

    reset() {
        this.initDescriptor(this._externalDescriptor);
        this.fields.forEach(([name, field]) => this.informUpdate(name, field));
    }
}
