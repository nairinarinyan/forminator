import { Forminator } from './forminator';
import { useState } from 'react';

export interface FieldStates {
    [key: string]: [string, (value: string) => void];
}

export const useForm = (form: Forminator): FieldStates => {
    const fieldStates = Object.entries(form.descriptor.fields).map(entry => {
        const [fieldName, descriptor] = entry;

        return {
            [fieldName]: useState(descriptor.value)
        };
    }).reduce((acc, curr) => {
        return { ...acc, ...curr };
    }, {});

    return fieldStates;
};