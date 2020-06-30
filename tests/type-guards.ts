import * as t from '../sources';

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        const bar: unknown[] = foo;
    }
    
    if (t.isArray(t.isUnknown())(foo)) {
        const bar: unknown[] = foo;
    }
};

{
    const foo = [1, 2];

    if (t.hasMinLength(8)(foo)) {
        const bar: unknown[] = foo;
    } else {
        const bar: unknown[] = foo;
    }
}

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        const bar: number = foo;
    }
    
    if (t.isNumber()(foo)) {
        const bar: number = foo;
    }
};

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        const bar: boolean = foo;
    }
    
    if (t.isBoolean()(foo)) {
        const bar: boolean = foo;
    }
};

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        const bar: number = foo.bar;
    }
    
    if (t.isObject({bar: t.isString()})(foo)) {
        // @ts-expect-error
        const bar: number = foo.bar;
    }
    
    if (t.isObject({bar: t.isString()})(foo)) {
        const bar: string = foo.bar;
    }
};

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        const bar: number = foo;
    }
    
    if (t.isObject({}, {extra: t.isDict(t.isString())})(foo)) {
        // @ts-expect-error
        const bar: number = foo['bar'];
    }
    
    if (t.isObject({}, {extra: t.isDict(t.isString())})(foo)) {
        const bar: string = foo['bar'];
    }
};
