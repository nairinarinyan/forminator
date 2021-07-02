import { useState, useEffect, useContext } from 'react';
import { FormContext } from '../components/form';
import { Forminator, FormErrors } from '../forminator';

export const useFormErrors = <T extends object, E extends object = {}>(form?: Forminator<T, any, E>): FormErrors<T, E> => {
    const formFromContext = useContext(FormContext);
    const frm = form || (formFromContext.form as Forminator<T>);
    const [errors, setErrors] = useState<FormErrors<T, E>>(frm.formErrors);

    useEffect(() => {
        setErrors(frm.formErrors);

        frm.onFormError(err => {
            setErrors(err);
        });
    }, [frm])

    return errors;
};