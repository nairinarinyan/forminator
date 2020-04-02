import React, { createContext, FunctionComponent, ReactNode, useContext, FormEvent, useEffect, useState } from 'react';
import { FormContext } from './form';
import { FieldDescriptor } from '../forminator';
import { ValidationError } from '../validation';

type FieldCtx = {
    name: string;
    value: string;
    setValue: (value: string) => void;
    onBlur: (evt: FormEvent) => void;
    error?: ValidationError;
};

type CallableChild = (
    value: string,
    setValue: (val: string) => void,
    onBlur?: (evt: FormEvent) => void,
    error?: ValidationError
) => ReactNode;


type Props = {
    name: string;
    children?: ReactNode | CallableChild;
}

export const FieldContext = createContext<FieldCtx>(null);

export const Field: FunctionComponent<Props> = props => {
    const { fieldStates, form } = useContext(FormContext);
    const { name, children } = props;
    const [error, setHasError] = useState<ValidationError>(null);

    const field = form.descriptor.fields[name];

    const childIsFunction = typeof children === 'function';
    const validField = fieldStates.hasOwnProperty(name);
    const [value, _setValue] = fieldStates[name] || ['', () => {}];

    useEffect(() => {
        if (!validField) {
            return console.error(`${name} is not a valid field name`);
        }

        form.onFieldError(name, error => {
            setHasError(error);
        });

        form.onFieldUpdate(name, value => {
            _setValue(value);
        });
    }, [name, validField]);

    if (!validField) return null;

    const setValue = (value: string) => {
        form.setFieldValue(name, value);

        if (field.resetErrorOnChange) {
            setHasError(null);
        }

        _setValue(value);
    };

    const onBlur = (evt: FormEvent) => {
        if (field.validateOnBlur) {
            form.validateField(name, field as FieldDescriptor<any>, form.descriptor.fields);
        }
    };

    return (
        <FieldContext.Provider value={{ name, value, setValue, onBlur, error }}>
            {childIsFunction ?
                (children as CallableChild)(value, setValue, onBlur, error) :
                children
            }
        </FieldContext.Provider>
    );
};
