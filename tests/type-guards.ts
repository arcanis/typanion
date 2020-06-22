import * as t from '../sources';

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        foo.slice();
    }
    
    if (t.isArray(t.isUnknown())(foo)) {
        foo.slice();
    }
};

{
    const bar = [1, 2];

    if (t.hasMinLength(8)(bar)) {
        bar.slice();
    } else {
        bar.slice();
    }
}

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        foo.slice();
    }
    
    if (t.isArray(t.isUnknown())(foo)) {
        foo.slice();
    }
};

(foo: unknown) => {
    if (true) {
        // @ts-expect-error
        foo + 42;
    }
    
    if (t.isNumber()(foo)) {
        foo + 42;
    }
};
