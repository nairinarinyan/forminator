import { useState, useEffect, useContext } from 'react';

import { Forminator, UpdateListenerOptions } from '../forminator';
import { ValidationError } from '../validation';
import { FormContext } from '../components/form';

export const useField = <T extends object, K extends T[keyof T], >(
    field: keyof T,
    form?: Forminator<T>,
    options?: UpdateListenerOptions,
): [K, ValidationError] => {
    const formFromContext = useContext(FormContext);
    const frm = form || (formFromContext.form as Forminator<T>);
    const [value, setValue] = useState<K>(frm.descriptor.fields[field].value as K);
    const [error, setError] = useState<ValidationError>(frm.descriptor.fields[field].error);

    useEffect(() => {
        frm.onFieldUpdate(field, setValue, options);
        frm.onFieldError(field, setError);
    }, [frm]);

    return [value, error];
};