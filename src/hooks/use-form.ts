import { FormDescriptor, Forminator, SubmitFn, ErrorFn } from '../forminator';
import { useMemo } from 'react';

export const useForm = <T extends object, A extends object>(descriptor: FormDescriptor<T, A>, onSubmit?: SubmitFn<T, A>, onError?: ErrorFn): Forminator<T, A> => {
    const form = useMemo(() => {
        return new Forminator({ ...descriptor, onSubmit, onError });
    }, [descriptor]);

    return form;
};