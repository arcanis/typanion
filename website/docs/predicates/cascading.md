---
id: cascading
title: Cascading predicates
---

Cascading predicate don't contribute to refining the value type, but are handful to assert that the value itself follows a particular pattern. You would compose them using `cascade` (cf the [Examples](#Examples) section).

## `hasExactLength`

```ts twoslash
import * as t from 'typanion';
declare const length: number;
// ---cut---
const validate = t.hasExactLength(length);
```

Ensure that the values all have a `length` property exactly equal to the specified value.

## `hasForbiddenKeys`

```ts twoslash
import * as t from 'typanion';
declare const forbiddenKey1: string;
declare const forbiddenKey2: string;
declare const forbiddenKeyN: Array<string>;
declare const options: {missingIf: t.MissingType};
// ---cut---
const validate = t.hasForbiddenKeys([forbiddenKey1, forbiddenKey2, ...forbiddenKeyN], options);
```

Ensure that the objects don't contain any of the specified keys. (cf [`hasMutuallyExclusiveKeys`](#hasMutuallyExclusiveKeys) for the `options` parameter)

## `hasKeyRelationship`

```ts twoslash
import * as t from 'typanion';
declare const subjectKey: string;
declare const relationship: t.KeyRelationship;
declare const otherKeys: Array<string>;
declare const ignore: Array<string> | undefined;
// ---cut---
const validate = t.hasKeyRelationship(subjectKey, relationship, otherKeys, {ignore});
```

Ensure that when the subject key is found, the specified relationship (one of `t.KeyRelationship.Forbids` or `t.KeyRelationship.Requires`) is true. Values listed in `ignore` will lead their properties to be considered missing for the purpose of this check.

## `hasMaxLength`

```ts twoslash
import * as t from 'typanion';
declare const length: number;
// ---cut---
const validate = t.hasMaxLength(length);
```

Ensure that the values all have a `length` property at most equal to the specified value.

## `hasMinLength`

```ts twoslash
import * as t from 'typanion';
declare const length: number;
// ---cut---
const validate = t.hasMinLength(length);
```

Ensure that the values all have a `length` property at least equal to the specified value.

## `hasMutuallyExclusiveKeys`

```ts twoslash
import * as t from 'typanion';
declare const keys: Array<string>;
declare const options: {missingIf: t.MissingType};
// ---cut---
const validate = t.hasMutuallyExclusiveKeys(keys, options);
```

Ensure that the objects don't contain more than one of the specified keys. Keys will be considered missing based on `options.missingIf`.

Options:
- `missingIf`:
  - `missing` (default): the key isn't present.
  - `undefined`: the key is `undefined`.
  - `nil`: the key is either `undefined` or `null`.
  - `falsy`: the key has a falsy value (ex: `0`, `false`, `undefined`, `null`)

## `hasRequiredKeys`

```ts twoslash
import * as t from 'typanion';
declare const keys: Array<string>;
declare const options: {missingIf: t.MissingType};
// ---cut---
const validate = t.hasRequiredKeys(keys, options);
```

Ensure that the objects contain all of the specified keys. (cf [`hasMutuallyExclusiveKeys`](#hasMutuallyExclusiveKeys) for the `options` parameter)

## `hasAtLeastOneKey`

```ts twoslash
import * as t from 'typanion';
declare const keys: Array<string>;
declare const options: {missingIf: t.MissingType};
// ---cut---
const validate = t.hasAtLeastOneKey(keys, options);
```

Ensure that the objects contain at least one of the specified keys. (cf [`hasMutuallyExclusiveKeys`](#hasMutuallyExclusiveKeys) for the `options` parameter)

## `hasUniqueItems`

```ts
const validate = t.hasUniqueItems({map?});
```

Ensure that the values only have unique items (`map` will transform before comparing).

## `isAtLeast`

```ts
const validate = t.isAtLeast(n);
```

Ensure that the values compare positively with the specified value.

## `isAtMost`

```ts
const validate = t.isAtMost(n);
```

Ensure that the values compare positively with the specified value.

## `isBase64`

```ts
const validate = t.isBase64();
```

Ensure that the values are valid base 64 data.

## `isHexColor`

```ts
const validate = t.isHexColor({alpha?});
```

Ensure that the values are hexadecimal colors (enabling `alpha` will allow an additional channel).

## `isInExclusiveRange`

```ts
const validate = t.isInExclusiveRange(a, b);
```

Ensure that the values compare positively with the specified value.

## `isInInclusiveRange`

```ts
const validate = t.isInInclusiveRange(a, b);
```

Ensure that the values compare positively with the specified value.

## `isInteger`

```ts
const validate = t.isInteger(n, {unsafe?});
```

Ensure that the values are round safe integers (enabling `unsafe` will allow [unsafe ones](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger)).

## `isJSON`

```ts
const validate = t.isJSON(schema?);
```

Ensure that the values are valid JSON, and optionally match them against a nested schema. Because it's a cascading predicate, it has no bearing on the type inference, and as a result doesn't support coercion. For a JSON predicate that supports coercion, check [`isPayload`](types.md#isPayload).

## `isLowerCase`

```ts
const validate = t.isLowerCase();
```

Ensure that the values only contain lowercase characters.

## `isNegative`

```ts
const validate = t.isNegative();
```

Ensure that the values are at most 0.

## `isPositive`

```ts
const validate = t.isPositive();
```

Ensure that the values are at least 0.

## `isISO8601`

```ts
const validate = t.isISO8601();
```

Ensure that the values are dates following the ISO 8601 standard.

## `isUpperCase`

```ts
const validate = t.isUpperCase();
```

Ensure that the values only contain uppercase characters.

## `isUUID4`

```ts
const validate = t.isUUID4();
```

Ensure that the values are valid UUID 4 strings.

## `matchesRegExp`

```ts
const validate = t.matchesRegExp();
```

Ensure that the values all match the given regular expression.
