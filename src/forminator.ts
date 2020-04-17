import { Validator, ValidationError } from './validation';

export type SubmitFn<T, A extends object> = (values: T, args: A) => void;

export type ErrorFn = (errors: ValidationError[]) => void;

type Descriptor<T extends object, A extends object> = {
    onSubmit?: SubmitFn<T, A>;
    onError?: ErrorFn;
};

type ExternalFieldDescriptor<T extends object, K> = K | FieldDescriptor<K, T>;

type ExternalFieldsDescriptors<T extends object> = {
    [key in keyof T]: ExternalFieldDescriptor<T, T[key]>
}

export interface FormDescriptor<T extends object, A extends object = any> extends Descriptor<T, A> {
    fields: ExternalFieldsDescriptors<T>;
}

export type FieldsDescriptors<T extends object> = {
    [key in keyof T]: FieldDescriptor<T[key], T>;
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
    onChange?: (input: any) => K;
    onRender?: (value: K) => any;
}

export enum FormEvent {
    FIELD_UPDATE,
    FIELD_ERROR,
    FORM_ERROR,
    FORM_SUBMIT,
}

export type FormListener<T = any> = {
    event: FormEvent,
    fieldName?: keyof T,
    listener: (args: T) => void;
}

const defaultFormDescriptor: InternalDescriptor<any, any> = {
    fields: {},
    onError: console.error,
    onSubmit: console.log,
};

const defaultFieldDescriptor: FieldDescriptor<string> = {
    validateOnBlur: true,
    validateOnSubmit: true,
    validateOnChange: false,
    validate: () => true,
    resetErrorOnChange: true,
    value: '',
    error: null
};

export class Forminator<T extends object, A extends object> {
    public descriptor: InternalDescriptor<T, A>;
    private _listeners: FormListener[] = [];

    id: string;

    constructor(descriptor: FormDescriptor<T, A>) {
        this.id = `form-${Math.random() * (1000 - 100) + 100 << 0}`;
        this.initDescriptor(descriptor);
    }

    private initDescriptor(descriptor: FormDescriptor<T, A>) {
        this.descriptor = this.normalizeFields(descriptor);
    }

    private normalizeFields(descriptor: FormDescriptor<T, A>): InternalDescriptor<T, A> {
        const normalizedFields = Object.entries<ExternalFieldDescriptor<T, any>>(descriptor.fields)
            .map(entry => {
                const [key, value] = entry;
                const isString = typeof value === 'string';
                const isArray = Array.isArray(value);

                const field: FieldDescriptor<any, T> = (isString || isArray) ?
                    { ...defaultFieldDescriptor, value } :
                    { ...defaultFieldDescriptor, ...(value as FieldDescriptor<any, T>) };

                return { [key]: field };
            })
            .reduce<FieldsDescriptors<T>>((acc, curr) => ({ ...acc, ...curr }), {} as FieldsDescriptors<T>);

        return {
            ...defaultFormDescriptor,
            ...descriptor,
            fields: normalizedFields
        };
    }

    private informListeners(evt: FormEvent, args: any, fieldName?: keyof T) {
        this._listeners
            .filter(l => {
                return l.event === evt && (l.fieldName ? l.fieldName === fieldName : true);
            })
            .forEach(l => l.listener(args))
    }

    private informUpdate<K>(name: keyof T, field: FieldDescriptor<K, T>) {
        const { value, onRender } = field;

        this.informListeners(
            FormEvent.FIELD_UPDATE,
            onRender ? onRender(value) : value,
            name
        );
    }

    get fields() {
        return Object.entries(this.descriptor.fields) as [keyof T, FieldDescriptor<unknown, T>][];
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
        const field = this.descriptor.fields[name];
        (<unknown>field.value as any[])[index] = value;
        this.informUpdate(name, field);

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, this.descriptor.fields);
        }
    }

    setFieldValue(name: keyof T, value: any) {
        const field = this.descriptor.fields[name];
        const { onChange } = field;

        field.value = onChange ? onChange(value) : value;
        this.informUpdate(name, field);

        if (field.validateOnChange) {
            this.validateField(name, field as FieldDescriptor<unknown, T>, this.descriptor.fields);
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

    getFieldValue(fieldName: keyof T) {
        return this.descriptor.fields[fieldName].value;
    }

    submit(args?: A) {
        try {
            this.validateForm();

            const submitData = this.fields
                .map(([key, value]) => {
                    return { [key]: value.value};
                })
                .reduce<T>((acc, curr) => ({ ...acc, ...curr }), {} as T);

            this.descriptor.onSubmit && this.descriptor.onSubmit(submitData, args);
        } catch (err) {
            this.descriptor.onError && this.descriptor.onError(err);
        }
    }

    validateField(name: keyof T, field: FieldDescriptor<unknown, T>, fields: FieldsDescriptors<T>): ValidationError {
        const validateFns = Array.isArray(field.validate) ? field.validate : [field.validate];
        const isArray = Array.isArray(field.value);

        try {
            for (const validateFn of validateFns) {
                if (isArray) {
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

    validateForm() {
        const errors = this.fields
            .map(([name, field]) => {
                return this.validateField(name as keyof T, field, this.descriptor.fields);
            })
            .filter(Boolean);

        if (!!errors.length) {
            throw new ValidationError('Invalid form', errors);
        }
    }

    // hooks
    onFieldUpdate(name: keyof T, listenerFn: (value: any) => void) {
        const listener: FormListener = {
            event: FormEvent.FIELD_UPDATE,
            fieldName: name,
            listener: listenerFn
        };

        this._listeners.push(listener);
    }

    onFieldError(name: keyof T, listenerFn: (error: ValidationError) => void) {
        const listener: FormListener = {
            event: FormEvent.FIELD_ERROR,
            fieldName: name,
            listener: listenerFn
        };

        this._listeners.push(listener);
    }
}
