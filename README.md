# Forminator
## The only form library you need for React

## ⚠ WIP

## Installation
Surprisingly:  
`npm i react-forminator`

## Usage
Forminator does its best to be unopinionated about how should one handle forms, thus keeps its core API as low-level as possible.  
But of course there are lot of common scenarios and Forminator also gives higher-order helpers to achieve them easily.   

### Step one
The core concept of Forminator is the **form description**.  
It looks like this

```ts
import { FormDescriptor } from 'react-forminator';

const formDescriptor: FormDescriptor = {
    fields: {
        requiredField:{
            value: '',
            validate: [
                required('This field is required.')
            ]
        }, 
        optionalField: '',
    },
    onSubmit(fieldValues) {
        sendThemSomeWhere(fieldValues);
    }
};
```

### Step two
Next, `form` object needs to be created given the descriptor.  
In plain JS, you would do:  
```ts
import { Forminator } from 'react-forminator';

const form = new Forminator(descriptor);
```

You can also use `useForm` hook to construct the form instance in the component itself so you can have more control what happens when the form is submitted (e.g. change a local state)

```tsx
import { useForm, FormDescriptor, SubmitFn } from 'react-forminator';

const formDescriptor: FormDescriptor = {...};

const CoolestForm: FunctionComponent = () => {
    const [submitted, setSubmitted] = useState(false);

    const onSubmit = useCallback<SubmitFn>(async values => {
        await sendThemSomeWhere(fieldValues);
        setSubmitted(true);
    }, []);

    const form = useForm(formDescriptor, onSubmit);

    return (
        // ... Read further to see what should go here
    );
}
```

### Step three
Forminator forms should use the `Form` component, and pass the form object (`Forminator` instance) as a prop. 
```tsx
import { Forminator, FormDescriptor, Form } from 'react-forminator';

const formDescriptor: FormDescriptor = {...};
const form = new Forminator(formDescriptor);

const CoolestForm: FunctionComponent = () => {
    return (
        <Form form={form}>
            {/* Fields come next */}
        </Form>
    );
}
```

### Step four
The final step to have a working form is to use `Field` for each field in the form

It has two low-level APIs.  
First one is to give a child function which will receive `value, setValue, onBlur, error` as params, and should return a `ReactNode`.  

And the second one is to use the `FieldContext` and extract those params from there.

```tsx
<Form form={form}>
    <Field name="fieldNameAsInDescriptor">
        {(value, setValue, onBlur, error) =>
            <label>
                <input
                    type="text"
                    value={value}
                    onChange={evt => setValue(evt.target.value)}
                    onBlur={onBlur}
                />
                <span>{error?.message}</span>
            </label>
        }
    </Field>
</Form>
```

Generally you would wrap your inputs into a component which will "look better".

`form-field.tsx`
```tsx
export const FormField: FunctionComponent<Props> = props => {
    const { name, label, children } = props;

    return (
        <div className={classes('form-field', [!!error, 'has-error'])}>
            <Field name={name}>
                <label>
                    {label}
                    {children}
                </label>
                <FieldContext.Consumer>
                    {({error}) => <div className="error">{error?.message}</div> }
                </FieldContext.Consumer>
            </Field>
        </div>
    );
};
```

```tsx
interface Props extends InputHTMLAttributes<HTMLInputElement> {
    someProp: string;
}

export const Input: FunctionComponent<Props> = props => {
    const { someProp, ...rest } = props;
    const fieldContext = useContext(FieldContext);
    const { value, setValue, onBlur } = fieldContext;

    const onChange = (evt: ChangeEvent<HTMLInputElement) => {
        setValue(evt.target.value);
    };

    return (
        <input
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            {...rest}
        />
    );
}
```

And use them like this:  

```tsx
export const CoolestForm: FunctionComponent = () => {
    return (
        <Form form={form}>
            <FormField name="email" label="Email">
                <Input placeholder="email@email.com" />
            </FormField>
            <FormField name="firstName" label="First name">
                <Input placeholder="John" />
            </FormField>
        </Form>
    );
};
```