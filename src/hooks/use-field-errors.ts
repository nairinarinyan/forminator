// import { ValidationError } from '../validation';
// import { useState, useEffect } from 'react';
// import { Forminator } from '../forminator';

// export const _useFieldErrors = <T extends object>(form: Forminator<T>): ValidationError[] => {
//     const [errors, setErrors] = useState<ValidationError[]>(form.fieldErrors);

//     useEffect(() => {
//         form.onFieldErrors(err => {
//             setErrors(err);
//         });
//     }, [])

//     return errors;
// };