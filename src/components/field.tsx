import React, { createContext, FunctionComponent, ReactNode, useContext, FormEvent, useEffect, useState } from 'react';
import { FormContext } from './form';
import { FieldDescriptor } from '../forminator';
import { ValidationError } from '../validation';
import { ValuePair } from '../hooks/use-field-states';

type FieldCtx = {
    name: string;
    value: string;
    setValue: (value: string) => void;
    onBlur: (evt: FormEvent) => void;
    error?: ValidationError;
};

type CallableChildProps = {
    value: string,
    setValue: (val: string) => void,
    onBlur?: (evt: FormEvent) => void,
    error?: ValidationError
}

type CallableChild = (props: CallableChildProps) => ReactNode;

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
    const valuePair = fieldStates[name] as ValuePair<string>;

    if (!valuePair) {
        console.error(`${name} is not a valid field name`);
        return null;
    }

    const [value, _setValue] = valuePair;

    useEffect(() => {
        form.onFieldError(name, error => {
            setHasError(error);
        });

        form.onFieldUpdate(name, value => {
            _setValue(value);
        });
    }, [name]);

    const setValue = (value: string) => {
        form.setFieldValue(name, value);

        if (field.resetErrorOnChange) {
            setHasError(null);
        }
    };

    const onBlur = (evt: FormEvent) => {
        if (field.validateOnBlur) {
            form.validateField(name, field as FieldDescriptor<any>, form.descriptor.fields);
        }
    };

    return (
        <FieldContext.Provider value={{ name, value, setValue, onBlur, error }}>
            {childIsFunction ?
                (children as CallableChild)({ value, setValue, onBlur, error }) :
                children
            }
        </FieldContext.Provider>
    );
};
