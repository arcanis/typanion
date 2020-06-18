import {array, string, InferType} from '../sources';

const schema = array(string());
type MyType = InferType<typeof schema>;

// @ts-expect-error
const foo: MyType = 42;

// @ts-expect-error
const bar: MyType = [42];

const baz: MyType = [`foo`];
