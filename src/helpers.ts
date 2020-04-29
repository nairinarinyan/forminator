const isObject = (obj: any) => typeof obj === 'object' && obj !== null;
const isList = (obj: any) => isObject(obj) && ('map' in obj && 'length' in obj) || Array.isArray(obj);
const isDate = (obj: any) => obj instanceof Date;

export const clone = (v: any) => {
    if (isList(v)) {
        return cloneList(v);
    } else if (isDate(v)) {
        return cloneDate(v);
    } else if (isObject(v)) {
        return cloneObject(v);
    } else {
        return v;
    }
};

const cloneList = (list: any[]): any[] => {
    return list.map(entry => {
        return clone(entry);
    });
};

const cloneObject = (obj: object): object => {
    return Object
        .entries(obj)
        .map(([key, value]) => {
            return { [key]: clone(value) };
        })
        .reduce((acc, curr) => {
            return Object.assign(acc, curr)
        }, {})
};

const cloneDate = (d: Date) => {
    return new Date(d);
}