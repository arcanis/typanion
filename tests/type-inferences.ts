import * as t from '../sources';

{
    const schema = t.isArray(t.isString());
    type MyType = t.InferType<typeof schema>;

    // @ts-expect-error
    const foo: MyType = 42;

    // @ts-expect-error
    const bar: MyType = [42];

    const baz: MyType = [`foo`];
}

{
    const schema = t.isObject({foo: t.isOptional(t.isNumber())});
    type MyType = t.InferType<typeof schema>;

    // ts-expect-error: cannot work until https://github.com/microsoft/TypeScript/issues/29063 is fixed
    // const foo: MyType = 42;

    // ts-expect-error: cannot work until https://github.com/microsoft/TypeScript/issues/29063 is fixed
    // const bar: MyType = [42];

    const baz: MyType = {};

    const qux: MyType = {foo: 42};

    // @ts-expect-error
    const quux: MyType = {foo: `foo`};

    const quuz: MyType = {foo: undefined};
}
