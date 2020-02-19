import {FieldDescriptor, FieldsDescriptors} from "./forminator";

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export class ValidationError {
    constructor(public message?: string, public errors?: ValidationError[]) {
    }
}

// throw ValidationError if invalid
export type Validator = (field: FieldDescriptor, fields: FieldsDescriptors) => void;

export const minLength = (message: string, length: number): Validator => (field: FieldDescriptor) => {
    if (field.value.length < length) {
        throw new ValidationError(message);
    }
}

export const maxLength = (message: string, length: number): Validator => (field: FieldDescriptor) => {
    if (field.value.length > length) {
        throw new ValidationError(message);
    }
}

export const required = (message: string): Validator => (field: FieldDescriptor) => {
    if (field.value === '' || field.value === undefined) {
        throw new ValidationError(message);
    }
};

export const same = (message: string, comparisonField: string): Validator => (field, fields) => {
    if (fields[comparisonField].value !== field.value) {
        throw new ValidationError(message);
    }
};

export const email = (message: string): Validator => field => {
    if (!emailRegex.test(field.value)) {
        throw new ValidationError(message);
    }
};