---
id: types
title: Type predicates
---

## `isArray`

```ts
const validate = t.isArray(values, {delimiter?}):
```

Ensure that the values are arrays whose values all match the specified schema. The `delimiter` option only matters when coercion is enabled, and will allow string inputs where each item is separated by the given delimiter.

## `isBoolean`

```ts
const validate = t.isBoolean();
```

Ensure that the values are all booleans. Prefer `isLiteral` if you wish to specifically check for one of `true` or `false`. This predicate supports coercion.

## `isDate`

```ts
const validate = t.isDate();
```

Ensure that the values are proper `Date` instances. This predicate supports coercion via either ISO8601, or raw numbers (in which case they're interpreted as the number of *seconds* since epoch, not milliseconds).

## `isDict`

```ts
const validate = t.isDict(values, {keys?});
```

Ensure that the values are all a standard JavaScript objects containing an arbitrary number of fields whose values all match the given schema. The `keys` option can be used to apply a schema on the keys as well (this will always have to be strings, so you'll likely want to use `cascade(isString(), [...])` to define the pattern).

## `isEnum`

```ts
const validate = t.isEnum(values);
```

Ensure that the values are all amongst the allowed set of values. This predicate accepts either an array of literals as parameter, or a record. Since the classic TS enums also happen to be records, you can use them as well:

```ts
enum MyEnum { /* ... */ };

const validate = t.isEnum(MyEnum);
```

## `isLiteral`

```ts
const validate = t.isLiteral(value);
```

Ensure that the values are strictly equal to the specified expected value. It's an handy tool that you can combine with `isOneOf` and `isObject` to parse structures similar to Redux actions, etc.

## `isMap`

```ts
const validate = t.isMap(keySpec, valueSpec);
```

Ensure that the values are a `Map` instance. This predicate supports coercion under the form of arrays of tuples (like what standard maps spread into).

## `isNumber`

```ts
const validate = t.isNumber();
```

Ensure that the values are all numbers. This predicate supports coercion.

## `isObject`

```ts
const validate = t.isObject(props, {extra?});
```

Ensure that the values are plain old objects whose properties match the given shape. Extraneous properties will be aggregated and validated against the optional `extra` schema. If you need to validate against an object that may have any number of extraneous properties, either use `isPartial` instead or set `extra` to `isDict(isUnknown())`.

## `isPartial`

```ts
const validate = t.isPartial(props);
```

Same as `isObject`, but allows any number of extraneous properties.

## `isPayload`

```ts
const validate = t.isPayload(spec);
```

Ensure that the values are JSON string whose parsed representation match the given validator. Unlike [`isJSON`](cascading.md#isJSON), `isPayload` will coerce the original value to match the nested spec. The drawback, however, is that it can only be used if the coercion is enabled, as it will otherwise always fail (that's because if it were to pass, then the resulting type refinement would be incorrect).

## `isSet`

```ts
const validate = t.isSet(values, {delimiter?});
```

Ensure that the values are a `Set` instance. This predicate supports coercion as either regular arrays or, if configured, delimiter-separated strings.

## `isString`

```ts
const validate = t.isString();
```

Ensure that the values are all regular strings.

## `isTuple`

```ts
const validate = t.isTuple(values, {delimiter?});
```

Ensure that the values are tuples whose items match the specified schemas. The `delimiter` option only matters when coercion is enabled, and will allow string inputs where each item is separated by the given delimiter.

## `isUnknown`

```ts
const validate = t.isUnknown();
```

Accept whatever is the input without validating it, but without refining the type inference either. Note that by default `isUnknown` will forbid `undefined` and `null`, but this can be switched off by explicitly allowing them via `isOptional` and `isNullable`.

## `isInstanceOf`

```ts
const validate = t.isInstanceOf(constructor);
```

Ensure that the values are instances of a given constructor.
