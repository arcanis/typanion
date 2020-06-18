import {expect}                  from 'chai';
import {string, Validator, literal, object, array} from '../sources';

const validators: {
  validator: () => Validator<unknown, any>;
  tests: [unknown, boolean][];
}[] = [{
  validator: () => string(),
  tests: [
    [42, false],
    [`foo`, true],
    [``, true],
    [null, false],
  ],
}, {
  validator: () => literal(`foo`),
  tests: [
    [42, false],
    [`foo`, true],
    [`bar`, false],
  ],
}, {
  validator: () => literal(42),
  tests: [
    [21, false],
    [42, true],
    [`42`, false],
  ],
}, {
  validator: () => object({foo: string()}),
  tests: [
    [{}, false],
    [{foo: `hello`}, true],
    [{foo: 42}, false],
    [{bar: `test`}, false],
  ],
}, {
  validator: () => array(string()),
  tests: [
    [{}, false],
    [[], true],
    [[`foo`], true],
    [[42], false],
  ],
}];

for (const {validator, tests} of validators) {
  describe(`${validator.toString()}`, () => {
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
