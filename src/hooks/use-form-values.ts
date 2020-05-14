import { Forminator } from '../forminator';
import { useState, useEffect } from 'react';

export const useFormValues = <T extends object>(
    form: Forminator<T>,
): T => {
    const [values, setValues] = useState<T>(form.fieldValues);

    useEffect(() => {
        form.onFormUpdate(setValues);
    }, [form]);
    
    return values;
};