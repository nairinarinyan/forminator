import React, { FunctionComponent, createContext, FormEvent, useEffect } from 'react';
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

// const fieldStatesToValues = (fieldStates: FieldStates) => {
//     return Object.entries(fieldStates)
//         .map(([key, [value]]) => ({ [key]: value }))
//         .reduce((acc, curr) => Object.assign(acc, curr));
// };

export const Form: FunctionComponent<Props> = props => {
    const { form, children } = props;
    const fieldStates = useForm(form);

    const onSubmit = (evt: FormEvent) => {
        evt.preventDefault();
        // const values = fieldStatesToValues(fieldStates);
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