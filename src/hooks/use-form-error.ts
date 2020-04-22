import { ValidationError } from '../validation';
import { useState, useEffect } from 'react';
import { Forminator } from '../forminator';

export const useFormError = <T extends object>(form: Forminator<T>): ValidationError => {
    const [error, setError] = useState<ValidationError>(form.error);

    useEffect(() => {
        form.onFormError(err => {
            setError(err);
        });
    }, [])

    return error;
};