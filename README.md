# Typanion

> Static and runtime type assertion library with no dependencies

[![](https://img.shields.io/npm/v/typanion.svg)]() [![](https://img.shields.io/npm/l/typanion.svg)]() [![](https://img.shields.io/badge/developed%20with-Yarn%202-blue)](https://github.com/yarnpkg/berry)

## Installation

```
yarn add typanion
```

## Why

- Typanion can validate nested arbitrary data structures
- Typanion is type-safe; it uses [type predicates](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
- Typanion allows you to derive types from your schemas
- Typanion can report detailed error reports

Compared to [yup](https://github.com/jquense/yup), Typanion has a better inference support for TypeScript + supports `isOneOf`. Its functional API makes it very easy to tree shake, which is another bonus (although the library isn't very large in itself).

## Usage

First define a schema using the builtin operators:

```ts
import * as t from 'typanion';

const isMovie = t.isObject({
    title: t.isString(),
    description: t.isString(),
});
```

Then just call the schema to validate any `unknown` value:

```ts
const userData = JSON.parse(input);

if (isMovie(userData)) {
    console.log(userData.title);
}
```

Passing a second parameter allows you to retrieve detailed errors:

```ts
const userData = JSON.parse(input);
const errors: string[] = [];

if (!isMovie(userData, {errors})) {
    console.log(errors);
}
```

You can also apply coercion over the user input:

```ts
const userData = JSON.parse(input);
const coercions: Coercion[] = [];

if (isMovie(userData, {coercions})) {
    // Coercions aren't flushed by default
    for (const [p, op] of coercions) op();

    // All relevant fields have now been coerced
    // ...
}
```

You can derive the type from the schema and use it in other functions:

```ts
import * as t from 'typanion';

const isMovie = t.isObject({
    title: t.isString(),
    description: t.isString(),
});

type Movie = t.InferType<typeof isMovie>;

// Then just use your alias:
const printMovie = (movie: Movie) => {
    // ...
};
```

Schemas can be stored in multiple variables if needed:

```ts
import * as t from 'typanion';

const isActor = t.isObject({
    name: t.isString();
});

const isMovie = t.isObject({
    title: t.isString(),
    description: t.isString(),
    actors: t.isArray(isActor),
});
```

## API

### Type predicates

- `isArray(values)` will ensure that the values are arrays whose values all match the specified schema.

- `isTuple(values)` will ensure that the values are tuples whose items match the specified schemas.

- `isBoolean()` will ensure that the values are all booleans. Prefer `isLiteral` if you wish to specifically check for one of `true` or `false`. This predicate supports coercion.

- `isDate()` will ensure that the values are proper `Date` instances. This predicate supports coercion via either ISO8601, or raw numbers (in which case they're interpreted as the number of *seconds* since epoch, not milliseconds).

- `isDict(values, {keys?})` will ensure that the values are all a standard JavaScript objects containing an arbitrary number of fields whose values all match the given schema. The `keys` option can be used to apply a schema on the keys as well (this will always have to be strings, so you'll likely want to use `applyCascade(isString(), [...])` to define the pattern).

- `isLiteral(value)` will ensure that the values are strictly equal to the specified expected value. It's an handy tool that you can combine with `oneOf` and `object` to parse structures similar to Redux actions, etc.

- `isNumber()` will ensure that the values are all numbers. This predicate supports coercion.

- `isObject(props, {extra?})` will ensure that the values are plain old objects whose properties match the given shape. Extraneous properties will be aggregated and validated against the optional `extra` schema.

- `isString()` will ensure that the values are all regular strings.

- `isUnknown()` will accept whatever is the input without validating it, but without refining the type inference either. Note that by default `isUnknown` will forbid `undefined` and `null`, but this can be switched off by explicitly allowing them via `isOptional` and `isNullable`.

- `isInstanceOf(constructor)` will ensure that the values are instances of a given constructor.

### Helper predicates

- `applyCascade(spec, [specA, specB, ...])` will ensure that the values all match `spec` and, if they do, run the followup validations as well. Since those followups will not contribute to the inference (only the lead schema will), you'll typically want to put here anything that's a logical validation, rather than a typed one (cf the [Cascading Predicates](#Cascading-predicate) section).

- `isOneOf([specA, specB])` will ensure that the values all match any of the provided schema. As a result, the inferred type is the union of all candidates. The predicate supports an option, `exclusive`, which ensures that only one variant matches.

- `isOptional(spec)` will add `undefined` as an allowed value for the given specification.

- `isNullable(spec)` will add `null` as an allowed value for the given specification.

### Cascading predicates

Cascading predicate don't contribute to refining the value type, but are handful to assert that the value itself follows a particular pattern. You would compose them using `applyCascade` (cf the [Examples](#Examples) section).

- `hasExactLength` will ensure that the values all have a `length` property exactly equal to the specified value.

- `hasForbiddenKeys` will ensure that the objects don't contain any of the specified keys.

- `hasKeyRelationship` will ensure that when the specified key is found, the specified relationship is true.

- `hasMaxLength` will ensure that the values all have a `length` property at most equal to the specified value.

- `hasMinLength` will ensure that the values all have a `length` property at least equal to the specified value.

- `hasMutuallyExclusiveKeys` will ensure that the objects don't contain more than one of the specified keys.

- `hasRequiredKeys` will ensure that the objects contain all of the specified keys.

- `hasUniqueItems` will ensure that the values only have unique items (`map` will transform before comparing).

- `isAtLeast` will ensure that the values compare positively with the specified value.

- `isAtMost` will ensure that the values compare positively with the specified value.

- `isBase64` will ensure that the values are valid base 64 data.

- `isHexColor` will ensure that the values are hexadecimal colors (`alpha` will allow an additional channel).

- `isInExclusiveRange` will ensure that the values compare positively with the specified value.

- `isInInclusiveRange` will ensure that the values compare positively with the specified value.

- `isInteger` will ensure that the values are round safe integers (`unsafe` will allow [unsafe ones](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger)).

- `isJSON` will ensure that the values are valid JSON, and optionally match them against a nested schema.

- `isLowerCase` will ensure that the values only contain lowercase characters.

- `isNegative` will ensure that the values are at most 0.

- `isPositive` will ensure that the values are at least 0.

- `isISO8601` will ensure that the values are dates following the ISO 8601 standard.

- `isUpperCase` will ensure that the values only contain uppercase characters.

- `isUUID4` will ensure that the values are valid UUID 4 strings.

- `matchesRegExp` will ensure that the values all match the given regular expression.

## Examples

Validate that an unknown value is a port protocol:

```ts
const isPort = t.applyCascade(t.isNumber(), [
    t.isInteger(),
    t.isInInclusiveRange(1, 65535),
]);

isPort(42000);
```

Validate that a value contains a specific few fields, regardless of the others:

```ts
const isDiv = t.isObject({
    tagName: t.literal(`DIV`),
}, {
    extra: t.isUnknown(),
});

isDiv({tagName: `div`, appendChild: () => {}});
```

Validate that a specific field is a specific value, and that others are all numbers:

```ts
const isModel = t.isObject({
    uid: t.String(),
}, {
    extra: t.isDict(t.isNumber()),
});

isModel({uid: `foo`, valA: 12, valB: 24});
```

## License (MIT)

> **Copyright © 2020 Mael Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
