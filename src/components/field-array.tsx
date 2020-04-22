import React, { createContext, FunctionComponent, ReactNode, useContext, FormEvent, useEffect, useState, useLayoutEffect } from 'react';
import { FormContext } from './form';
import { FieldDescriptor } from '../forminator';
import { ValidationError } from '../validation';
import { ValuePair } from '../hooks/use-field-states';

type FieldArrayCtx = {
    name: string;
    values: string[];
    setValue: (idx: number, value: string) => void;
    onBlur: (evt: FormEvent) => void;
    errors?: ValidationError[];
};

type CallableChildProps = {
    values: string[],
    setValue: (idx: number, val: string) => void,
    onBlur?: (evt: FormEvent) => void,
    errors?: ValidationError[];
};

type CallableChild = (props: CallableChildProps) => ReactNode;


type Props = {
    name: string;
    children?: ReactNode | CallableChild;
}

export const FieldArrayContext = createContext<FieldArrayCtx>(null);

export const FieldArray: FunctionComponent<Props> = props => {
    const { name, children } = props;
    const { fieldStates, form } = useContext(FormContext);
    const [errors, setErrors] = useState<ValidationError[]>([]);

    const field = form.descriptor.fields[name];

    const childIsFunction = typeof children === 'function';
    const valuePair = fieldStates[name] as ValuePair<string[]>;

    if (!valuePair) {
        console.error(`${name} is not a valid field name`);
        return null;
    }

    const [values, setValues] = valuePair;

    useLayoutEffect(() => {
        form.onFieldUpdate(name, values => {
            setValues(values);
        });

        form.onFieldError(name, error => {
            setErrors(error ? error.errors : []);
        });
    }, []);

    const setValue = (idx: number, value: string) => {
        form.setFieldArrayValue(name, idx, value);
    };

    const onBlur = (evt: FormEvent) => {
        if (field.validateOnBlur) {
            form.validateField(name, field as FieldDescriptor<any>, form.descriptor.fields);
        }
    };

    return (
        <FieldArrayContext.Provider value={{ name, values, setValue, onBlur, errors }}>
            {childIsFunction ?
                (children as CallableChild)({ values, setValue, onBlur, errors }) :
                children
            }
        </FieldArrayContext.Provider>
    );
};
