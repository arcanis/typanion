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
    throw new Error(`Validation errors:\n${errors.join(`\n`)}`);
}
```

Various helpers can be used to remove boilerplate:

```ts
import * as t from 'typanion';

// Will throw if userData isn't a blogPost
t.assert(userData, isBlogPost);

// Same, but will also return the value (optionally coerced, see below)
const val = t.as(userData, isBlogPost, {throw: true});
```

You can use the `as` helper along with its `coerce` option to optionally tell Typanion that mutating the value is fine:

```ts
import * as t from 'typanion';

const validatedData = t.as(userData, isBlogPost, {coerce: true, throw: true}))

// Will have turned "true" and "false" strings into the proper boolean values
console.log(validatedData.published);
```

Note that coercion may mutate the data received in input. If you do not wish this to happen, consider using [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) to obtain a clone you can pass to the validators.
