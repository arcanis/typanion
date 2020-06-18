import {array, string} from '../sources';

const schema = array(string());

declare const foo: unknown;

if (true) {
    // @ts-expect-error
    foo.slice();
}

if (schema(foo))
    foo.slice();
