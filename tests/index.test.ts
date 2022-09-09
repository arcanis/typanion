import {expect} from 'chai';
// @ts-ignore
import util     from 'util';
import * as t   from '../sources';

enum TestEnum{
  foo = `foo`,
  bar = `bar`,
}
const testSymbol1 = Symbol()
const testSymbol2 = Symbol()
const otherSymbol = Symbol()

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
  validator: () => t.isEnum([`foo`, `bar`]),
  tests: [
    [`foo`, true],
    [`bar`, true],
    [`baz`, false],
  ],
}, {
  validator: () => t.isEnum({FOO: `foo`, BAR: `bar`}),
  tests: [
    [`foo`, true],
    [`bar`, true],
    [`baz`, false],
  ],
}, {
  validator: () => t.isEnum([testSymbol1, testSymbol2]),
  tests: [
    [testSymbol1, true],
    [testSymbol2, true],
    [otherSymbol, false],
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
  validator: () => t.isSet(t.isString()),
  tests: [
    [new Set([]), true],
    [new Set([`foo`]), true],
    [new Set([42]), false],
    [new Set([`foo`, 42]), false],
  ],
}, {
  validator: () => t.isMap(t.isNumber(), t.isString()),
  tests: [
    [new Map([]), true],
    [new Map([[42, `foo`]]), true],
    [new Map([[`foo`, `bar`]]), false],
    [new Map([[42, 42]]), false],
  ],
}, {
  validator: () => t.isTuple([t.isString(), t.isNumber(), t.isBoolean()]),
  tests: [
    [{}, false],
    [[], false],
    [[`foo`], false],
    [[`foo`, 42], false],
    [[`foo`, 42, true], true],
    [[`foo`, 42, true, false], false],
    [[`foo`, true, 42], false],
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
  validator: () => t.isRecord(t.isUnknown()),
  tests: [
    [{}, true],
    [{foo: 42}, true],
    [42, false],
    [undefined, false],
    [null, false],
  ],
}, {
  validator: () => t.isRecord(t.isNumber()),
  tests: [
    [{}, true],
    [{foo: 42}, true],
    [{foo: `foo`}, false],
    [{foo: 42, bar: 42}, true],
    [{foo: 42, bar: `bar`}, false],
    [{foo: `foo`, bar: 42}, false],
    [42, false],
  ],
}, {
  validator: () => t.isRecord(t.isNumber(), {keys: t.cascade(t.isString(), [t.isUUID4()])}),
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

describe(`Validation Tests`, () => {
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
})

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
  validator: () => t.isRecord(t.isString()),
  tests: [
    [JSON.parse(`{"constructor": "foo"}`), [`.constructor: Unsafe property name`]],
    [JSON.parse(`{"__proto__": "foo"}`), [`.__proto__: Unsafe property name`]],
  ],
}, {
  validator: () => t.isEnum([`foo`, `bar`]),
  tests: [
    [`baz`, [`.: Expected one of "foo" or "bar" (got "baz")`]],
  ],
}, {
  validator: () => t.isEnum([5,10,15]),
  tests: [
    [42, [`.: Expected one of 5, 10, or 15 (got 42)`]],
  ],
}, {
  validator: () => t.isEnum({FOO: `foo`, BAR: `bar`}),
  tests: [
    [`baz`, [`.: Expected one of "foo" or "bar" (got "baz")`]],
  ],
}, {
  validator: () => t.isEnum(TestEnum),
  tests: [
    [`baz`, [`.: Expected one of "foo" or "bar" (got "baz")`]],
  ],
}, {
  validator: () => t.isEnum([testSymbol1, testSymbol2]),
  tests: [
    [otherSymbol, [`.: Expected a valid enumeration value (got <Symbol()>)`]],
  ],
}, {
  validator: () => t.isOneOf([t.isString(), t.isBoolean()]),
  tests: [
    [42, [`.#1: Expected a string (got 42)`, `.#2: Expected a boolean (got 42)`]],
    [true, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasForbiddenKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, [`.: Forbidden property "foo"`]],
    [{foo: 42, bar: 42}, [`.: Forbidden properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasRequiredKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, [`.: Missing required property "bar"`]],
    [{foo: 42, bar: 42}, []],
    [{baz: 42}, [`.: Missing required properties "foo" and "bar"`]],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasAtLeastOneKey([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, []],
    [{foo: 42, bar: 42}, []],
    [{baz: 42}, [`.: Missing at least one property from "foo" or "bar"`]],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`])]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: undefined, bar: null}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: false, bar: null}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`], { missingIf: 'missing' })]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: undefined, bar: null}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: false, bar: null}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: false, bar: 0}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`], { missingIf: 'undefined' })]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: undefined, bar: null}, []],
    [{foo: false, bar: null}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: false, bar: 0}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`], { missingIf: 'nil' })]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: undefined, bar: null}, []],
    [{foo: false, bar: null}, []],
    [{foo: false, bar: 0}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasMutuallyExclusiveKeys([`foo`, `bar`], { missingIf: 'falsy' })]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: undefined, bar: null}, []],
    [{foo: false, bar: null}, []],
    [{foo: false, bar: 0}, []],
    [{foo: 42, bar: 42, baz: 42}, [`.: Mutually exclusive properties "foo" and "bar"`]],
    [{baz: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasKeyRelationship(`foo`, t.KeyRelationship.Forbids, [`bar`, `baz`])]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: 42, bar: 42}, [`.: Property "foo" forbids using property "bar"`]],
    [{foo: 42, bar: 42, baz: 42}, [`.: Property "foo" forbids using properties "bar" or "baz"`]],
    [{foo: 42, qux: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasKeyRelationship(`foo`, t.KeyRelationship.Forbids, [`bar`, `baz`], {ignore: [false]})]),
  tests: [
    [{foo: 42}, []],
    [{bar: 42}, []],
    [{foo: false, bar: 42}, []],
    [{foo: 42, bar: false}, []],
    [{foo: 42, bar: false, baz: false}, []],
    [{foo: 42, bar: false, baz: 42}, [`.: Property "foo" forbids using property "baz"`]],
    [{foo: 42, qux: 42}, []],
  ],
}, {
  validator: () => t.cascade(t.isRecord(t.isUnknown()), [t.hasKeyRelationship(`foo`, t.KeyRelationship.Requires, [`bar`, `baz`])]),
  tests: [
    [{foo: 42}, [`.: Property "foo" requires using properties "bar" and "baz"`]],
    [{bar: 42}, []],
    [{foo: 42, bar: 42}, [`.: Property "foo" requires using property "baz"`]],
    [{foo: 42, bar: 42, baz: 42}, []],
    [{foo: 42, qux: 42}, [`.: Property "foo" requires using properties "bar" and "baz"`]],
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
  validator: () => t.isObject({foo: t.isSet(t.isBoolean())}),
  tests: [
    [{foo: []}, [], {foo: new Set([])}],
    [{foo: [`true`, `false`]}, [], {foo: new Set([true, false])}],
    [{foo: [true, false]}, [], {foo: new Set([true, false])}],
    [{foo: new Set([true, false])}, [], {foo: new Set([true, false])}],
    [{foo: new Set([`true`, false])}, [], {foo: new Set([true, false])}],
  ],
}, {
  validator: () => t.isObject({foo: t.isSet(t.isBoolean(), {delimiter: /,/})}),
  tests: [
    [{foo: `true,false`}, [], {foo: new Set([true, false])}],
    [{foo: `true,foo`}, [`.foo[1]: Expected a boolean (got "foo")`]],
  ],
}, {
  validator: () => t.isObject({foo: t.isMap(t.isNumber(), t.isBoolean())}),
  tests: [
    [{foo: []}, [], {foo: new Map([])}],
    [{foo: [[`42`, `false`]]}, [], {foo: new Map([[42, false]])}],
    [{foo: [[42, false]]}, [], {foo: new Map([[42, false]])}],
    [{foo: new Map([[42, false]])}, [], {foo: new Map([[42, false]])}],
    [{foo: new Map([[`42`, `false`]])}, [], {foo: new Map([[42, false]])}],
  ],
}, {
  validator: () => t.isTuple([t.isString(), t.isNumber(), t.isBoolean()]),
  tests: [
    [[`hello`, `42`, `true`], [], [`hello`, 42, true]],
  ],
}, {
  validator: () => t.isObject({foo: t.isTuple([t.isString(), t.isNumber(), t.isBoolean()], {delimiter: /,/})}),
  tests: [
    [{foo: `hello,42,true`}, [], {foo: [`hello`, 42, true]}],
  ],
}, {
  validator: () => t.isRecord(t.isBoolean()),
  tests: [
    [{foo: `true`}, [], {foo: true}],
  ],
}, {
  validator: () => t.isRecord(t.isOneOf([t.isBoolean()])),
  tests: [
    [{foo: `true`}, [], {foo: true}],
  ],
}, {
  validator: () => t.isRecord(t.isOneOf([t.isObject({foo: t.isBoolean(), bar: t.isLiteral(`hello`)}), t.isObject({foo: t.isString(), bar: t.isLiteral(`world`)})])),
  tests: [
    [{val: {foo: `true`, bar: `hello`}}, [], {val: {foo: true, bar: `hello`}}],
    [{val: {foo: `true`, bar: `world`}}, [], {val: {foo: `true`, bar: `world`}}],
  ],
}, {
  validator: () => t.isRecord(t.cascade(t.isNumber(), t.isInteger())),
  tests: [
    [{val: 42}, [], {val: 42}],
    [{val: `42`}, [], {val: 42}],
    [{val: `42.21`}, [`.val: Expected to be an integer (got 42.21)`]],
  ],
}, {
  validator: () => t.isRecord(t.isNumber()),
  tests: [
    [[[`val`, 42]], [], {val: 42}],
    [[[`val`, 42, 12]], [`.[0]: Expected to have a length of exactly 2 elements (got 3)`]],
  ]
}];

describe(`Coercion Tests`, () => {
  for (const {validator, tests} of COERCION_TESTS) {
    describe(`Coercions for ${validator.toString()}`, () => {
      const schema = validator();

      for (const [value, errorExpectations, coercionExpectation] of tests) {
        const what = errorExpectations.length > 0
          ? `Doesn't coerce`
          : `Coerces`;

        it(`${what} ${util.format(value)}, as expected`, () => {
          const res = t.as(value, schema, {coerce: true, errors: true});
          expect(res.errors ?? []).to.deep.equal(errorExpectations);

          if (!res.errors) {
            try {
              expect(res.value).to.deep.equal(coercionExpectation);
            } catch (err) {
              // @ts-ignore
              console.log({value, coercionExpectation});
              throw err;
            }
          }
        });
      }
    });
  }

  it(`Doesn't apply coercion if a cascading predicates fail`, () => {
    const schema = t.isRecord(t.cascade(t.isNumber(), [t.isInteger()]));
    const val = {val: `42.21`};

    const coercions: t.Coercion[] = [];
    expect(schema(val)).to.equal(false);

    expect(val).to.deep.equal({val: `42.21`});
  });
});

describe(`t.fn()`, () => {
  it(`should reject a function call with invalid arguments`, () => {
    const fn = t.fn([t.isNumber()], val => {
      return val * 42;
    });

    expect(() => fn(`foo` as any)).to.throw();
  });

  it(`should accept a function call with valid arguments`, () => {
    const fn = t.fn([t.isNumber()], val => {
      return val * 42;
    });

    expect(fn(2)).to.equal(84);
  });
});

describe(`t.as()`, () => {
  it(`should return a value with "errors" set to "true" if the "errors" option is disabled`, () => {
    const res = t.as(null, t.isString());
    expect(res.errors).to.deep.equal(true);
  });

  it(`should return a value with "errors" set to an array if the "errors" option is enabled`, () => {
    const res = t.as(null, t.isString(), {errors: true});
    expect(res.errors).to.deep.equal([`.: Expected a string (got null)`]);
  });

  it(`should throw an error if the "throw" option is enabled ("errors" disabled)`, () => {
    expect(() => {
      t.as(null, t.isString(), {throw: true});
    }).to.throw(/^Type mismatch$/);
  });

  it(`should throw an error if the "throw" option is enabled ("errors" enabled)`, () => {
    expect(() => {
      t.as(null, t.isString(), {throw: true, errors: true});
    }).to.throw(/^Type mismatch\n\n- \.: Expected a string \(got null\)$/);
  });

  it(`should return an object with "errors" set to undefined when the value is valid ("errors" disabled)`, () => {
    const res = t.as(``, t.isString());
    expect(res.errors).to.deep.equal(undefined);
  });

  it(`should return an object with "errors" set to undefined when the value is valid ("errors" enabled)`, () => {
    const res = t.as(``, t.isString(), {errors: true});
    expect(res.errors).to.deep.equal(undefined);
  });

  it(`should return an object with "value" set to the input when the value is valid ("errors" disabled)`, () => {
    const res = t.as(``, t.isString());
    expect(res.value).to.deep.equal(``);
  });

  it(`should return an object with "value" set to the input when the value is valid ("errors" enabled)`, () => {
    const res = t.as(``, t.isString(), {errors: true});
    expect(res.value).to.deep.equal(``);
  });

  it(`should return the input when the value is valid and the "throw" option is enabled`, () => {
    const res = t.as(``, t.isString(), {throw: true});
    expect(res).to.deep.equal(``);
  });

  it(`should return an object with "value" set to the casted input when the value is valid after coercion`, () => {
    const res = t.as(`42`, t.isNumber(), {coerce: true});
    expect(res.value).to.deep.equal(42);
  });

  it(`should cast the input when the value is valid after coercion and the "throw" option is enabled`, () => {
    const res = t.as(`42`, t.isNumber(), {throw: true, coerce: true});
    expect(res).to.deep.equal(42);
  });
});
