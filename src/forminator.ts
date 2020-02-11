import { Validator, ValidationError } from './validation';

interface Descriptor {
    onSubmit?: (values: any) => void;
}

export interface FormDescriptor extends Descriptor {
    fields:  {
        [key: string]: string | FieldDescriptor;
    }
}

interface InternalDescriptor extends FormDescriptor {
    fields: FieldsDescriptors
}

export interface FieldsDescriptors {
    [key: string]: FieldDescriptor;
}

export interface FieldDescriptor {
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
    validate?: Validator | Validator[];
    resetErrorOnChange?: boolean;
    value?: string;
    error?: ValidationError;
}

export enum FormEvent {
    FIELD_UPDATE,
    FIELD_ERROR,
    FORM_ERROR,
    FORM_SUBMIT,
}

export type FormListener<T = any> = {
    event: FormEvent,
    fieldName?: string,
    listener: (args: T) => void;
}

const defaultFieldDescriptor: FieldDescriptor = {
    validateOnBlur: true,
    validateOnSubmit: true,
    validate: () => true,
    resetErrorOnChange: true,
    value: '',
    error: null
};

export class Forminator {
    public descriptor: InternalDescriptor;
    private _listeners: FormListener[] = [];

    constructor(descriptor: FormDescriptor) {
        const normalizedFields = Object.entries(descriptor.fields)
            .map(entry => {
                const [key, value] = entry;

                const field: FieldDescriptor = typeof value === 'string' ?
                    { ...defaultFieldDescriptor, value } :
                    { ...defaultFieldDescriptor, ...value };

                return { [key]: field };
            })
            .reduce((acc, curr) => ({ ...acc, ...curr }));

        const normalizedDescriptor: InternalDescriptor = {
            ...descriptor,
            fields: normalizedFields
        }

        this.descriptor = normalizedDescriptor;
    }

    submit() {
        try {
            this.validateForm();

            const submitData = Object.entries(this.descriptor.fields)
                .map(([key, value]) => {
                    return { [key]: value.value};
                })
                .reduce((acc, curr) => ({ ...acc, ...curr }));

            this.descriptor.onSubmit(submitData);
        } catch (err) {
            console.error(err);
        }
    }

    validateField(name: string, field: FieldDescriptor, fields: FieldsDescriptors): ValidationError {
        const validateFns = Array.isArray(field.validate) ? field.validate : [field.validate];

        for (const validateFn of validateFns) {
            try {
                validateFn(field, fields);
                field.error = null;
                this.informListeners(FormEvent.FIELD_ERROR, null, name)
            } catch (err) {
                field.error = err;
                this.informListeners(FormEvent.FIELD_ERROR, err, name)
                return err;
            }
        }

        return null;
    }

    setFieldValue(name: string, value: string) {
        this.descriptor.fields[name].value = value;
    }

    onFieldError(name: string, listenerFn: (error: ValidationError) => void) {
        const listener: FormListener = {
            event: FormEvent.FIELD_ERROR,
            fieldName: name,
            listener: listenerFn
        };

        this._listeners.push(listener);
    }

    validateForm() {
        const errors = Object.entries(this.descriptor.fields)
            .map(([name, field]) => {
                return this.validateField(name, field, this.descriptor.fields);
            })
            .filter(Boolean);

        if (!!errors.length) {
            throw new ValidationError('Invalid form', errors);
        }
    }

    onFormError() {

    }

    private informListeners(evt: FormEvent, args: any, fieldName?: string) {
        this._listeners
            .filter(l => {
                return l.event === evt && (l.fieldName ? l.fieldName === fieldName : true);
            })
            .forEach(l => l.listener(args))
    }
}
