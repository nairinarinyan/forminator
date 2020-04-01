import { Forminator, FieldDescriptor } from '../forminator';
import { useState } from 'react';

export interface FieldStates {
    [key: string]: [string, (value: string) => void];
}

export const useFieldStates = <T extends object, A extends object>(form: Forminator<T, A>): FieldStates => {
    const fieldStates = Object.entries(form.descriptor.fields).map((entry: [string, FieldDescriptor<any>]) => {
        const [fieldName, descriptor] = entry;

        return {
            [fieldName]: useState<typeof descriptor.value>(descriptor.value)
        };
    }).reduce((acc, curr) => {
        return { ...acc, ...curr };
    }, {});

    return fieldStates;
};