import React, { FunctionComponent, createContext, FormEvent, HtmlHTMLAttributes, FormHTMLAttributes } from 'react';
import { Forminator } from '../forminator';
import { FieldStates, useFieldStates } from '../hooks/use-field-states';

type Props = FormHTMLAttributes<HTMLFormElement> & {
    form: Forminator<any, any>;
};

interface FormContext<T extends object, A extends object> {
    fieldStates: FieldStates<T>;
    form: Forminator<T, A>;
}

export const FormContext = createContext<FormContext<any, any>>(null);

export const Form: FunctionComponent<Props> = ({ form, children, ...props }) => {
    const fieldStates = useFieldStates(form);

    const onSubmit = (evt: FormEvent) => {
        evt.preventDefault();
        form.submit();
    };

    return (
        <FormContext.Provider value={{ fieldStates, form }}>
            <form onSubmit={onSubmit} id={form.id} {...props}>
                {children}
            </form>
        </FormContext.Provider>
    );
};