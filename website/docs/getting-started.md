---
id: getting-started
title: Getting Started
---

## Installation

Add Typanion to your project using Yarn:

```bash
yarn add typanion
```

## Overview

You can mix and match the prebuilt Typanion operators to describe the data structure you need:

```ts
import * as t from 'typanion';

const isBlogPost = t.isObject({
    title: t.isString(),
    description: t.isString(),
    published: t.isBoolean(),
});
```

Then use this validator to validate any `unknown` type you have to work with. If they match, Typanion will provide the refinement to the correct type:

```ts
declare const userData: unknown;

if (isBlogPost(userData)) {
    console.log(userData.title);
}
```

If you need to use the derived type into other parts of your application, just use the provided helper to infer it without any risk of them becoming outdated:

```ts
import * as t from 'typanion';

type BlogPost = t.InferType<typeof isBlogPost>;
```

Typanion can also list provide detailed errors if you provide an error array:

```ts
const errors: string[] = [];

if (!isBlogPost(userData, {errors})) {
    throw new Error(`Validation errors:\n${errors.join(`\n)}`);
}
```

Finally, you can instruct Clipanion to coerce values into the expected types if possible:

```ts
const coercions: t.Coercion[] = [];

if (isBlogPost(userData, {coercions})) {
    // Don't forget to apply the changes first
    for (const coercion of coercions)
        coercion();

    // Will have turned "true" and "false" strings into the proper boolean values
    console.log(userData.published);
}
```
