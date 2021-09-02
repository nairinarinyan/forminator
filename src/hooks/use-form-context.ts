import { useContext } from 'react';
import { FormContext } from '../components/form';
import { Forminator } from '../forminator';

export const useFormContext = <T extends object>(): Forminator<T> => {
  const { form } = useContext(FormContext);
  return form;
};