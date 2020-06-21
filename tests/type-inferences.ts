import * as t from '../sources';

const schema = t.isArray(t.isString());
type MyType = t.InferType<typeof schema>;

// @ts-expect-error
const foo: MyType = 42;

// @ts-expect-error
const bar: MyType = [42];

const baz: MyType = [`foo`];
