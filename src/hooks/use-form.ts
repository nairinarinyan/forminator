import { FormDescriptor, Forminator, SubmitFn, ErrorFn } from '../forminator';
import { useMemo } from 'react';

export const useForm = <T extends object>(descriptor: FormDescriptor<T>, onSubmit?: SubmitFn<T>, onError?: ErrorFn): Forminator<T> => {
    const form = useMemo(() => {
        return new Forminator({ ...descriptor, onSubmit, onError });
    }, [descriptor]);

    return form;
};