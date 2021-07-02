import { useState, useEffect, useContext } from 'react';
import { Forminator } from '../forminator';
import { FormContext } from '../components/form';

export const useFormValues = <T extends object>(
    form?: Forminator<T>,
): T => {
    const formFromContext = useContext(FormContext);
    const frm = form || (formFromContext.form as Forminator<T>);
    const [values, setValues] = useState<T>(frm.fieldValues);

    useEffect(() => {
        frm.onFormUpdate(setValues);
    }, [frm]);
    
    return values;
};