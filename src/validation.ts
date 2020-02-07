export class ValidationError {
    constructor(private message?: string) {
    }
}

export type Validator = (value: string) => boolean | ValidationError;

export const minLength = (message: string, length: number) => (value: string) => {
    if (value.length < length) {
        throw new ValidationError(message);
    }

    return true;
}

export const maxLength = (message: string, length: number) => (value: string) => {
    if (value.length > length) {
        throw new ValidationError(message);
    }

    return true;
}

export const required = (message: string) => (value: string) => {
    if (value === '' || value === undefined) {
        throw new ValidationError(message);
    }

    return true;
};