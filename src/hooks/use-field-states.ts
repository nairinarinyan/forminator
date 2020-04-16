import { Forminator } from '../forminator';
import { useState } from 'react';

export type ValuePair<T> = [T, (value: T) => void];

export type FieldStates<T> = {
    [key in keyof T]: ValuePair<T[key]>;
}

export const useFieldStates = <T extends object, A extends object>(form: Forminator<T, A>): FieldStates<T> => {
    return form.fields
        .map(([fieldName, field]) => {
            return {
                [fieldName]: useState<typeof field.value>(field.value)
            }
        })
        .reduce((acc, curr) => {
            return { ...acc, ...curr };
        }, {} as FieldStates<T>);
};