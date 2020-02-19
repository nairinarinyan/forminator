import React, { FunctionComponent, createContext, FormEvent } from 'react';
import { Forminator } from '../forminator';
import { FieldStates, useForm } from '../use-form';

interface Props {
    form: Forminator;
}

interface FormContext {
    fieldStates: FieldStates;
    form: Forminator;
}

export const FormContext = createContext<FormContext>(null);

export const Form: FunctionComponent<Props> = props => {
    const { form, children } = props;
    const fieldStates = useForm(form);

    const onSubmit = (evt: FormEvent) => {
        evt.preventDefault();
        form.submit();
    };

    return (
        <FormContext.Provider value={{ fieldStates, form }}>
            <form onSubmit={onSubmit}> 
                {children}
            </form>
        </FormContext.Provider>
    );
};