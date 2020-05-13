import { Forminator, UpdateListenerOptions } from '../forminator';
import { useState, useEffect } from 'react';
import { ValidationError } from '../validation';

export const useField = <K extends T[keyof T], T extends object>(
    form: Forminator<T>,
    field: keyof T, options?: UpdateListenerOptions
): [K, ValidationError] => {
    const [value, setValue] = useState<K>(form.descriptor.fields[field].value as K);
    const [error, setError] = useState<ValidationError>(null);

    useEffect(() => {
        form.onFieldUpdate(field, setValue, options);
        form.onFieldError(field, setError);
    }, [form]);
    
    return [value, error];
};