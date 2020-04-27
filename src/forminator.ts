import { Validator, ValidationError, FormValidator } from './validation';

export type SubmitFn<T, A extends object> = (values: T, args: A) => void;

export type ErrorFn = (errors: ValidationError[]) => void;

type Descriptor<T extends object, A extends object> = {
    onSubmit?: SubmitFn<T, A>;
    onError?: ErrorFn;
    validate?: FormValidator<T> | FormValidator<T>[];
    validateOnSubmit?: boolean;
    validateOnFieldsChange?: (keyof T)[],
    error?: ValidationError;
};

type ExternalFieldDescriptor<T extends object, K> = K | FieldDescriptor<K, T>;

type ExternalFieldsDescriptors<T extends object> = {
    [key in keyof T]: ExternalFieldDescriptor<T, any>
}

export interface FormDescriptor<T extends object, A extends object = any> extends Descriptor<T, A> {
    fields: ExternalFieldsDescriptors<T>;
}

export type FieldsDescriptors<T extends object> = {
    [key in keyof T]: FieldDescriptor<any, T>;
}

interface InternalDescriptor<T extends object, A extends object> extends FormDescriptor<T, A> {
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
    listener: (args: T) => void;
    options: A;
}

const defaultFormDescriptor: InternalDescriptor<any, any> = {
    fields: {},
    onError: console.error,

    validate: () => true,
    validateOnSubmit: true,
    validateOnFieldsChange: [],
    error: null
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

const identity = (input: any[]) => input;

export class Forminator<T extends object, A extends object = any> {
    public descriptor: InternalDescriptor<T, A>;
    private _listeners: FormListener[] = [];

    id: string;

    constructor(descriptor: FormDescriptor<T, A>) {
        this.id = `form-${Math.random() * (10000 - 100) + 100 << 0}`;
        this.initDescriptor(descriptor);
    }

    private initDescriptor(descriptor: FormDescriptor<T, A>) {
        this.descriptor = this.normalizeFields(descriptor);
    }

    private normalizeFields(descriptor: FormDescriptor<T, A>): InternalDescriptor<T, A> {
        const normalizedFields = Object.entries<ExternalFieldDescriptor<T, any>>(descriptor.fields)
            .map(entry => {
                const [key, value] = entry;
                const isDescriptorLike = typeof value === 'object' && value !== null && 'value' in value;
                const valueAsDescriptor = value as FieldDescriptor<any, T>;
                const isArray = Array.isArray(isDescriptorLike ? valueAsDescriptor.value : value);

                const field: FieldDescriptor<any, T> = isDescriptorLike ?
                    { ...defaultFieldDescriptor, ...valueAsDescriptor, value: isArray ? valueAsDescriptor.value.slice() : valueAsDescriptor.value } :
                    { ...defaultFieldDescriptor, value: isArray ? value.slice() : value };

                return { [key]: field };
            })
            .reduce<FieldsDescriptors<T>>((acc, curr) => ({ ...acc, ...curr }), {} as FieldsDescriptors<T>);

        return {
            ...defaultFormDescriptor,
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

    get fields() {
        return Object.entries(this.descriptor.fields) as [keyof T, FieldDescriptor<unknown, T>][];
    }

    get error() {
        return this.descriptor.error;
    }

    removeFieldFromArray(name: keyof T, idx: number) {
        const field = this.descriptor.fields[name];
        const currentValue = (<unknown>field.value as any[]).slice();
        currentValue.splice(idx, 1);

        (<unknown>field.value as any[]) = currentValue;
        this.informUpdate(name, field);
    }

    addFieldToArray(name: keyof T, value?: any) {
        const field = this.descriptor.fields[name];
        const currentValue = (<unknown>field.value as any[]);

        const valueToSet = typeof value === 'undefined' ? '' : value;
        (<unknown>field.value as any[]) = currentValue.concat(valueToSet);

        this.informUpdate(name, field);
    }

    setFieldArrayValue(name: keyof T, index: number, value: any) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = fields[name];
        (<unknown>field.value as any[])[index] = value;
        this.informUpdate(name, field);

        if (field.resetErrorOnChange) {
            field.error = null;
            this.informListeners(FormEvent.FIELD_ERROR, null, name)
        }

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, fields);
            this.validateForm();
        }

        if (validateOnFieldsChange.includes(name)) {
            this.validateForm();
        }
    }

    setFieldValue(name: keyof T, value: any) {
        const { fields, validateOnFieldsChange } = this.descriptor;
        const field = fields[name];
        const { onChange } = field;

        field.value = onChange ? onChange(value) : value;
        this.informUpdate(name, field);

        if (field.resetErrorOnChange) {
            field.error = null;
            this.informListeners(FormEvent.FIELD_ERROR, null, name)
        }

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, this.descriptor.fields);
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

    setFieldValidators<K>(fieldName: keyof T, validate: Validator<K, T> | Validator<K, T>[]) {
        this.descriptor.fields[fieldName].validate = validate;
    }

    getFieldValue(fieldName: keyof T) {
        return this.descriptor.fields[fieldName].value;
    }

    submit(args?: A): T {
        try {
            this.validateFields();

            const submitData = this.fields
                .map(([key, value]) => {
                    return { [key]: value.value};
                })
                .reduce<T>((acc, curr) => ({ ...acc, ...curr }), {} as T);

            this.descriptor.onSubmit && this.descriptor.onSubmit(submitData, args);
            return submitData;
        } catch (err) {
            this.descriptor.onError && this.descriptor.onError(err);
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

            field.error = null;
            this.informListeners(FormEvent.FIELD_ERROR, null, name)
        } catch (err) {
            field.error = err;
            this.informListeners(FormEvent.FIELD_ERROR, err, name)
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
        const validateFns = Array.isArray(validate) ? validate : [validate];

        try {
            for (const validateFn of validateFns) {
                validateFn(fields);
            }

            this.descriptor.error = null;
            this.informListeners(FormEvent.FORM_ERROR, null)
        } catch (err) {
            this.descriptor.error = err;
            this.informListeners(FormEvent.FORM_ERROR, err)
            return err;
        }
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

    onFormError(listenerFn: (error: ValidationError) => void, options?: ErrorListenerOptions) {
        const listener: FormListener<T> = {
            event: FormEvent.FORM_ERROR,
            listener: listenerFn,
            options: options || {}
        };

        this._listeners.push(listener);
    }
}
