---
id: helpers
title: Helper predicates
---

## `applyCascade`

```ts
const validate = t.applyCascade(spec, [specA, specB, ...]);
```

Ensure that the values all match `spec` and, if they do, run the followup validations as well. Since those followups will not contribute to the inference (only the lead schema will), you'll typically want to put here anything that's a logical validation, rather than a typed one (cf the [Cascading Predicates](#Cascading-predicate) section).

## `isNullable`

```ts
const validate = t.isNullable(spec);
```

Add `null` as an allowed value for the given specification.

## `isOneOf`

```ts
const validate = t.isOneOf([specA, specB], {exclusive?});
```

Ensure that the values all match any of the provided schema. As a result, the inferred type is the union of all candidates. If `exclusive` is set, only one variant is allowed to match.

## `isOptional`

```ts
const validate = t.isOptional(spec);
```

Add `undefined` as an allowed value for the given specification.
