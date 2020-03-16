import { FormDescriptor, Forminator, SubmitFn } from '../forminator';
import { useMemo } from 'react';

export const useForm = (descriptor: FormDescriptor, onSubmit: SubmitFn): Forminator => {
    const form = useMemo(() => {
        return new Forminator({ ...descriptor, onSubmit });
    }, [descriptor]);

    return form;
};