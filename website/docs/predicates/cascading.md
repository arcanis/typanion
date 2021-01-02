---
id: cascading
title: Cascading predicates
---

Cascading predicate don't contribute to refining the value type, but are handful to assert that the value itself follows a particular pattern. You would compose them using `applyCascade` (cf the [Examples](#Examples) section).

## `hasExactLength`

```ts
const validate = t.hasExactLength(length);
```

Ensure that the values all have a `length` property exactly equal to the specified value.

## `hasForbiddenKeys`

```ts
const validate = t.hasForbiddenKeys([forbiddenKey1, forbiddenKey2, ...]);
```

Ensure that the objects don't contain any of the specified keys.

## `hasKeyRelationship`

```ts
const validate = t.hasKeyRelationship(subjectKey, relationship, otherKeys);
```

Ensure that when the subject key is found, the specified relationship (one of `t.KeyRelationship.Forbids` or `t.KeyRelationship.Requires`) is true.

## `hasMaxLength`

```ts
const validate = t.hasMaxLength(length);
```

Ensure that the values all have a `length` property at most equal to the specified value.

## `hasMinLength`

```ts
const validate = t.hasMinLength(length);
```

Ensure that the values all have a `length` property at least equal to the specified value.

## `hasMutuallyExclusiveKeys`

```ts
const validate = t.hasMutuallyExclusiveKeys(keys);
```

Ensure that the objects don't contain more than one of the specified keys.

## `hasRequiredKeys`

```ts
const validate = t.hasRequiredKeys(keys);
```

Ensure that the objects contain all of the specified keys.

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

Ensure that the values are valid JSON, and optionally match them against a nested schema.

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
