import {expect} from 'chai';
import * as t   from '../sources';

const VALIDATION_TESTS: {
  validator: () => t.StrictValidator<unknown, any>;
  tests: [unknown, boolean][];
}[] = [{
  validator: () => t.isString(),
  tests: [
    [42, false],
    [`foo`, true],
    [``, true],
    [null, false],
  ],
}, {
  validator: () => t.isLiteral(`foo`),
  tests: [
    [42, false],
    [`foo`, true],
    [`bar`, false],
  ],
}, {
  validator: () => t.isLiteral(42),
  tests: [
    [21, false],
    [42, true],
    [`42`, false],
  ],
}, {
  validator: () => t.isNumber(),
  tests: [
    [false, false],
    [21, true],
    [42, true],
    [`42`, false],
    [null, false],
    [undefined, false],
  ],
}, {
  validator: () => t.isBoolean(),
  tests: [
    [true, true],
    [false, true],
    [0, false],
    [1, false],
    [null, false],
    [undefined, false],
  ],
}, {
  validator: () => t.isObject({foo: t.isString()}),
  tests: [
    [{}, false],
    [{foo: `hello`}, true],
    [{foo: 42}, false],
    [{foo: `hello`, bar: `test`}, false],
    [{bar: `test`}, false],
  ],
}, {
  validator: () => t.isArray(t.isString()),
  tests: [
    [{}, false],
    [[], true],
    [[`foo`], true],
    [[42], false],
  ],
}, {
  validator: () => t.isObject({}, {extra: t.isUnknown()}),
  tests: [
    [{}, true],
    [{foo: 42}, true],
    [42, false],
    [undefined, false],
    [null, false],
  ],
}, {
  validator: () => t.isOneOf([t.isObject({foo: t.isString()}, {extra: t.isUnknown()}), t.isObject({bar: t.isString()}, {extra: t.isUnknown()})]),
  tests: [
    [{foo: `foo`}, true],
    [{bar: `bar`}, true],
    [{baz: `baz`}, false],
    [{foo: `foo`, bar: `bar`}, true],
  ],
}, {
  validator: () => t.isOneOf([t.isObject({foo: t.isString()}, {extra: t.isUnknown()}), t.isObject({bar: t.isString()}, {extra: t.isUnknown()})], {exclusive: true}),
  tests: [
    [{foo: `foo`}, true],
    [{bar: `bar`}, true],
    [{baz: `baz`}, false],
    [{foo: `foo`, bar: `bar`}, false],
  ],
}, {
  validator: () => t.isDict(t.isUnknown()),
  tests: [
    [{}, true],
    [{foo: 42}, true],
    [42, false],
    [undefined, false],
    [null, false],
  ],
}, {
  validator: () => t.isDict(t.isNumber()),
  tests: [
    [{}, true],
    [{foo: 42}, true],
    [{foo: `foo`}, false],
    [42, false],
  ],
}, {
  validator: () => t.isDict(t.isNumber(), {keys: t.applyCascade(t.isString(), [t.isUUID4()])}),
  tests: [
    [{}, true],
    [{[`806af6da-bd31-4a8a-b3dc-a0fafdc3757a`]: 42}, true],
    [{[`806af6da-bd31-4a8a-b3dc-a0fafdc3757a`]: `foo`}, false],
    [{foo: 42}, false],
  ],
}, {
  validator: () => t.isOptional(t.isString()),
  tests: [
    [`foo`, true],
    [undefined, true],
    [42, false],
    [null, false],
  ],
}, {
  validator: () => t.isNullable(t.isString()),
  tests: [
    [`foo`, true],
    [undefined, false],
    [42, false],
    [null, true],
  ],
}, {
  validator: () => t.isOptional(t.isNullable(t.isString())),
  tests: [
    [`foo`, true],
    [undefined, true],
    [42, false],
    [null, true],
  ],
}, {
  validator: () => t.isInstanceOf(Error),
  tests: [
    [new Error(), true],
    [Error, false],
    [`foo`, false],
    [new (class CustomError extends Error {})(), true],
  ],
}];

for (const {validator, tests} of VALIDATION_TESTS) {
  describe(`Validation for ${validator.toString()}`, () => {
    const schema = validator();

    for (const [value, expectation] of tests) {
      const what = expectation
        ? `allow`
        : `disallow`;

      it(`it should ${what} ${JSON.stringify(value)}`, () => {
        expect(schema(value)).to.equal(expectation);
      });
    }
  });
}

const ERROR_TESTS: {
  validator: () => t.StrictValidator<unknown, any>;
  tests: [unknown, string[]][];
}[] = [{
  validator: () => t.isString(),
  tests: [
    [42, [`.: Expected a string (got 42)`]],
  ],
}, {
  validator: () => t.isObject({foo: t.isString()}),
  tests: [
    [{}, [`.foo: Expected a string (got undefined)`]],
    [{foo: ``, bar: ``}, [`.bar: Extraneous property (got an empty string)`]],
    [{foo: ``, [`foo bar`]: ``}, [`.["foo bar"]: Extraneous property (got an empty string)`]],
  ],
}, {
  validator: () => t.isObject({}),
  tests: [
    [JSON.parse(`{"constructor": "foo"}`), [`.constructor: Unsafe property name`]],
    [JSON.parse(`{"__proto__": "foo"}`), [`.__proto__: Unsafe property name`]],
  ],
}, {
  validator: () => t.isDict(t.isString()),
  tests: [
    [JSON.parse(`{"constructor": "foo"}`), [`.constructor: Unsafe property name`]],
    [JSON.parse(`{"__proto__": "foo"}`), [`.__proto__: Unsafe property name`]],
  ],
}, {
  validator: () => t.isOneOf([t.isString(), t.isBoolean()]),
  tests: [
    [42, [`.#1: Expected a string (got 42)`, `.#2: Expected a boolean (got 42)`]],
    [true, []],
  ],
}, {
  validator: () => t.applyCascade(t.isDict(t.isUnknown()), [t.hasForbiddenKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, [`.: Forbidden property "foo"`]],
    [{foo: 42, bar: 42}, [`.: Forbidden properties "foo", "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.applyCascade(t.isDict(t.isUnknown()), [t.hasRequiredKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, [`.: Missing required property "bar"`]],
    [{foo: 42, bar: 42}, []],
    [{baz: 42}, [`.: Missing required properties "foo", "bar"`]],
  ],
}, {
  validator: () => t.applyCascade(t.isDict(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo", "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.applyCascade(t.isDict(t.isUnknown()), [t.hasKeyRelationship(`foo`, t.KeyRelationship.Forbids, [`bar`, `baz`])]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: 42, bar: 42}, [`.: Property "foo" forbids using property "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Property "foo" forbids using properties "bar", "baz"`]],
    [{foo: 42, qux: 42}, []],
  ],
}, {
  validator: () => t.applyCascade(t.isDict(t.isUnknown()), [t.hasKeyRelationship(`foo`, t.KeyRelationship.Requires, [`bar`, `baz`])]),
  tests: [
    [{foo: 42}, [`.: Property "foo" requires using properties "bar", "baz"`]],
    [{bar: 42}, []],
    [{foo: 42, bar: 42}, [`.: Property "foo" requires using property "baz"`]],
    [{foo: 42, bar: 42, baz: 42}, []],
    [{foo: 42, qux: 42}, [`.: Property "foo" requires using properties "bar", "baz"`]],
  ],
}];

for (const {validator, tests} of ERROR_TESTS) {
  describe(`Errors for ${validator.toString()}`, () => {
    const schema = validator();

    for (const [value, expectations] of tests) {
      const what = expectations.length !== 1
        ? `errors`
        : `error`;

      it(`Report the right ${what} for ${JSON.stringify(value)}`, () => {
        const errors: string[] = [];

        expect(schema(value, {errors})).to.equal(expectations.length === 0);
        expect(errors).to.deep.equal(expectations);
      });
    }
  });
}

const COERCION_TESTS: {
  validator: () => t.StrictValidator<unknown, any>;
  tests: ([unknown, [], any] | [unknown, string[]])[],
}[] = [{
  validator: () => t.isObject({foo: t.isBoolean()}),
  tests: [
    [{foo: `true`}, [], {foo: true}],
    [{foo: `True`}, [], {foo: true}],
    [{foo: `1`}, [], {foo: true}],
    [{foo: 1}, [], {foo: true}],

    [{foo: `false`}, [], {foo: false}],
    [{foo: `False`}, [], {foo: false}],
    [{foo: `0`}, [], {foo: false}],
    [{foo: 0}, [], {foo: false}],

    [{foo: `truE`}, [`.foo: Expected a boolean (got \"truE\")`]],
    [{foo: `fAlse`}, [`.foo: Expected a boolean (got \"fAlse\")`]],
    [{foo: `42`}, [`.foo: Expected a boolean (got \"42\")`]],
    [{foo: 42}, [`.foo: Expected a boolean (got 42)`]],
  ],
}, {
  validator: () => t.isObject({foo: t.isNumber()}),
  tests: [
    [{foo: `4242`}, [], {foo: 4242}],
    [{foo: `42.42`}, [], {foo: 42.42}],
    [{foo: `0`}, [], {foo: 0}],

    [{foo: `-4242`}, [], {foo: -4242}],
    [{foo: `-42.42`}, [], {foo: -42.42}],

    [{foo: `123456789`.repeat(5)}, [`.foo: Received a number that can't be safely represented by the runtime (${`123456789`.repeat(5)})`]],
    [{foo: `0.123456789123456789123456789`}, [`.foo: Received a number that can't be safely represented by the runtime (0.123456789123456789123456789)`]],
  ],
}, {
  validator: () => t.isObject({foo: t.isDate()}),
  tests: [
    [{foo: `0`}, [], {foo: new Date(`1970-01-01T00:00:00.000Z`)}],
    [{foo: 0}, [], {foo: new Date(`1970-01-01T00:00:00.000Z`)}],

    [{foo: `679881600`}, [], {foo: new Date(`1991-07-19T00:00:00.000Z`)}],
    [{foo: 679881600}, [], {foo: new Date(`1991-07-19T00:00:00.000Z`)}],

    [{foo: `42.42`}, [`.foo: Received a timestamp that can't be safely represented by the runtime (42.42)`]],
    [{foo: `hello`}, [`.foo: Expected a date (got \"hello\")`]],
  ],
}, {
  validator: () => t.isArray(t.isBoolean()),
  tests: [
    [[`true`], [], [true]],
  ],
}, {
  validator: () => t.isObject({foo: t.isArray(t.isBoolean(), {delimiter: /,/})}),
  tests: [
    [{foo: `true`}, [], {foo: [true]}],
  ],
}, {
validator: () => t.isObject({foo: t.isArray(t.isBoolean(), {delimiter: /,/})}),
  tests: [
    [{foo: `true,false`}, [], {foo: [true, false]}],
  ],
}, {
  validator: () => t.isDict(t.isBoolean()),
  tests: [
    [{foo: `true`}, [], {foo: true}],
  ],
}, {
  validator: () => t.isDict(t.isOneOf([t.isBoolean()])),
  tests: [
    [{foo: `true`}, [], {foo: true}],
  ],
}, {
  validator: () => t.isDict(t.isOneOf([t.isObject({foo: t.isBoolean(), bar: t.isLiteral(`hello`)}), t.isObject({foo: t.isString(), bar: t.isLiteral(`world`)})])),
  tests: [
    [{val: {foo: `true`, bar: `hello`}}, [], {val: {foo: true, bar: `hello`}}],
    [{val: {foo: `true`, bar: `world`}}, [], {val: {foo: `true`, bar: `world`}}],
  ],
}];

for (const {validator, tests} of COERCION_TESTS) {
  describe(`Coercions for ${validator.toString()}`, () => {
    const schema = validator();

    for (const [value, errorExpectations, coercionExpectation] of tests) {
      const what = errorExpectations.length > 0
        ? `Doesn't coerce`
        : `Coerces`;

      it(`${what} ${JSON.stringify(value)}, as expected`, () => {
        const errors: string[] = [];
        const coercions: t.Coercion[] = [];

        const check = schema(value, {errors, coercions});
        expect(errors).to.deep.equal(errorExpectations);
        expect(check).to.equal(errorExpectations.length === 0);

        if (check) {
          for (const [, op] of coercions) op();
          expect(value).to.deep.equal(coercionExpectation);
        }
      });
    }
  });
}
