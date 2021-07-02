import { useState, useEffect, useContext } from 'react';

import { Forminator, UpdateListenerOptions } from '../forminator';
import { ValidationError } from '../validation';
import { FormContext } from '../components/form';

export const useField = <K extends T[keyof T], T extends object>(
    field: keyof T, options?: UpdateListenerOptions,
    form?: Forminator<T>
): [K, ValidationError] => {
    const formFromContext = useContext(FormContext);
    const frm = form || (formFromContext.form as Forminator<T>);
    const [value, setValue] = useState<K>(frm.descriptor.fields[field].value as K);
    const [error, setError] = useState<ValidationError>(null);

    useEffect(() => {
        frm.onFieldUpdate(field, setValue, options);
        frm.onFieldError(field, setError);
    }, [frm]);
    
    return [value, error];
};