import {FieldDescriptor, FieldsDescriptors} from "./forminator";

export class ValidationError {
    constructor(public message?: string, public errors?: ValidationError[]) {
    }
}

export type Validator = (field: FieldDescriptor, fields: FieldsDescriptors) => boolean | ValidationError;

export const minLength = (message: string, length: number) => (field: FieldDescriptor) => {
    if (field.value.length < length) {
        throw new ValidationError(message);
    }

    return true;
}

export const maxLength = (message: string, length: number) => (field: FieldDescriptor) => {
    if (field.value.length > length) {
        throw new ValidationError(message);
    }

    return true;
}

export const required = (message: string) => (field: FieldDescriptor) => {
    if (field.value === '' || field.value === undefined) {
        throw new ValidationError(message);
    }

    return true;
};

export const same = (message: string, comparisonField: string) => (field: FieldDescriptor, fields: FieldsDescriptors) => {
    if (fields[comparisonField].value !== field.value) {
        throw new ValidationError(message);
    }

    return true;
};
