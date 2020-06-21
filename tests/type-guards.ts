import * as t from '../sources';

const schema = t.isArray(t.isString());

declare const foo: unknown;

if (true) {
    // @ts-expect-error
    foo.slice();
}

if (schema(foo))
    foo.slice();

const bar = [1, 2];

if (t.hasMinLength(8)(bar))
    bar.slice();
else
    bar.slice();
