import React, { FunctionComponent, createContext, FormEvent } from 'react';
import { Forminator } from '../forminator';
import { FieldStates, useFieldStates } from '../hooks/use-field-states';

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
    const fieldStates = useFieldStates(form);

    const onSubmit = (evt: FormEvent) => {
        evt.preventDefault();
        form.submit();
    };

    return (
        <FormContext.Provider value={{ fieldStates, form }}>
            <form onSubmit={onSubmit} id={form.id}>
                {children}
            </form>
        </FormContext.Provider>
    );
};