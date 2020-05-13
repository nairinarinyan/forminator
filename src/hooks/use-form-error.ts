import { useState, useEffect } from 'react';
import { Forminator, FormErrors } from '../forminator';

export const useFormErrors = <T extends object, E extends object>(form: Forminator<T, any, E>): FormErrors<T, E> => {
    const [errors, setErrors] = useState<FormErrors<T, E>>(form.formErrors);

    useEffect(() => {
        setErrors(form.formErrors);

        form.onFormError(err => {
            setErrors(err);
        });
    }, [form])

    return errors;
};