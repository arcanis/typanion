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
    [21, false],
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
  validator: () => t.isOneOf([t.isObject({foo: t.isString()}, {allowUnknownKeys: true}), t.isObject({bar: t.isString()}, {allowUnknownKeys: true})]),
  tests: [
    [{foo: `foo`}, true],
    [{bar: `bar`}, true],
    [{baz: `baz`}, false],
    [{foo: `foo`, bar: `bar`}, true],
  ],
}, {
  validator: () => t.isOneOf([t.isObject({foo: t.isString()}, {allowUnknownKeys: true}), t.isObject({bar: t.isString()}, {allowUnknownKeys: true})], {exclusive: true}),
  tests: [
    [{foo: `foo`}, true],
    [{bar: `bar`}, true],
    [{baz: `baz`}, false],
    [{foo: `foo`, bar: `bar`}, false],
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
  validator: () => t.isOneOf([t.isString(), t.isBoolean()]),
  tests: [
    [42, [`.#1: Expected a string (got 42)`, `.#2: Expected a boolean (got 42)`]],
    [true, []],
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

        expect(schema(value, errors)).to.equal(expectations.length === 0);
        expect(errors).to.deep.equal(expectations);
      });
    }
  });
}
