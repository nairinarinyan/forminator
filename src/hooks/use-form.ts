import { FormDescriptor, Forminator, SubmitFn, ErrorFn } from '../forminator';
import { useMemo, useRef, useEffect } from 'react';

export const useForm = <T extends object, A extends object = any>(
    descriptor: FormDescriptor<T, A>,
    onSubmit?: SubmitFn<T, A>,
    onError?: ErrorFn
): Forminator<T, A> => {
    const onSubmitRef = useRef<SubmitFn<T, A>>(onSubmit);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    const form = useMemo(() => {
        return new Forminator({ ...descriptor, onSubmit: (v, args: A) => onSubmitRef.current(v, args), onError });
    }, [descriptor]);

    return form;
};