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

if (!isMovie(userData, errors)) {
    console.log(errors);
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

- `isArray(spec)` will ensure that the values are arrays whose values all match the specified schema.

- `isBoolean()` will ensure that the values are all booleans. Note that to specifically check for either `true` or `false`, you can look for `isLiteral`.

- `isLiteral(value)` will ensure that the values are strictly equal to the specified expected value. It's an handy tool that you can combine with `oneOf` and `object` to parse structures similar to Redux actions, etc. Note that you'll need to annotate your value with `as const` in order to let TypeScript know that the exact value matters (otherwise it'll cast it to `string` instead).

- `isNumber()` will ensure that the values are all numbers.

- `isObject(props)` will ensure that the values are plain old objects whose properties match the given shape.

- `isString()` will ensure that the values are all regular strings.

- `isUnknown()` will accept whatever is the input without validating it, but without refining the type inference either. Note that by default `isUnknown` will forbid `undefined` and `null`, but this can be switched off by explicitly allowing them via `isOptional` and `isNullable`.

### Helper predicates

- `applyCascade(spec, [specA, specB, ...])` will ensure that the values all match `spec` and, if they do, run the followup validations as well. Since those followups will not contribute to the inference (only the lead schema will), you'll typically want to put here anything that's a logical validation, rather than a typed one (cf the [Cascading Predicates](#Cascading-predicate) section).

- `isOneOf([specA, specB])` will ensure that the values all match any of the provided schema. As a result, the inferred type is the union of all candidates. The predicate supports an option, `exclusive`, which ensures that only one variant matches.

- `isOptional(spec)` will add `undefined` as an allowed value for the given specification.

- `isNullable(spec)` will add `null` as an allowed value for the given specification.

### Cascading predicates

- `hasExactLength` will ensure that the values all have a `length` property exactly equal to the specified value.

- `hasMaxLength` will ensure that the values all have a `length` property at most equal to the specified value.

- `hasMinLength` will ensure that the values all have a `length` property at least equal to the specified value.

- `isAtLeast` will ensure that the values compare positively with the specified value.

- `isAtMost` will ensure that the values compare positively with the specified value.

- `isInExclusiveRange` will ensure that the values compare positively with the specified value.

- `isInInclusiveRange` will ensure that the values compare positively with the specified value.

- `isInteger` will ensure that the values are round integers.

- `isLowerCase` will ensure that the values only contain lowercase characters.

- `isNegative` will ensure that the values are at most 0.

- `isPositive` will ensure that the values are at least 0.

- `isUpperCase` will ensure that the values only contain uppercase characters.

- `isUUID4` will ensure that the values are valid UUID 4 strings.

- `matchesRegExp` will ensure that the values all match the given regular expression.

## License (MIT)

> **Copyright © 2020 Mael Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
