---
id: examples
title: Examples
---

#### Validate that an unknown value is a port protocol:

```ts
const isPort = t.applyCascade(t.isNumber(), [
    t.isInteger(),
    t.isInInclusiveRange(1, 65535),
]);

isPort(42000);
```

#### Validate that an unknown value is a record with specific fields, regardless of the others:

```ts
const isDiv = t.isObject({
    tagName: t.isLiteral(`DIV`),
}, {
    extra: t.isUnknown(),
});

isDiv({tagName: `div`, appendChild: () => {}});
```

#### Validate that a specific field is a specific value, and that others are all numbers:

```ts
const isModel = t.isObject({
    uid: t.isString(),
}, {
    extra: t.isDict(t.isNumber()),
});

isModel({uid: `foo`, valA: 12, valB: 24});
```
