import * as t from '../sources';

declare const unknown: unknown;

type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : false;

function assertEqual<U>() {
  return <V>(val: V, expected: AssertEqual<U, V>) => {};
}

{
  const schema = t.isArray(t.isString());
  type MyType = t.InferType<typeof schema>;
  
  // @ts-expect-error
  const foo: MyType = 42;
  
  // @ts-expect-error
  const bar: MyType = [42];
  
  const baz: MyType = [`foo`];
}

{
  const schema = t.isObject({foo: t.isOptional(t.isNumber())});
  type MyType = t.InferType<typeof schema>;
  
  // ts-expect-error: cannot work until https://github.com/microsoft/TypeScript/issues/29063 is fixed
  // const foo: MyType = 42;
  
  // ts-expect-error: cannot work until https://github.com/microsoft/TypeScript/issues/29063 is fixed
  // const bar: MyType = [42];
  
  const baz: MyType = {};
  
  const qux: MyType = {foo: 42};
  
  // @ts-expect-error
  const quux: MyType = {foo: `foo`};
  
  const quuz: MyType = {foo: undefined};
}

{
  const schema = t.isEnum([`a`, `b`]);
  type MyType = t.InferType<typeof schema>;
  
  // @ts-expect-error
  const foo: MyType = `c`;
}

{
  const schema = t.isEnum([`a`, `b`] as const);
  type MyType = t.InferType<typeof schema>;
  
  // @ts-expect-error
  const foo: MyType = `c`;
}

{
  const schema = t.isObject({
    enum: t.isEnum([`a`, `b`] as const)
  });
  type MyType = t.InferType<typeof schema>;
  
  // @ts-expect-error
  const foo: MyType = {enum: `c`};
}

{
  const schema = t.isObject({
    map: t.isMap(t.isNumber(), t.isString())
  });
  type MyType = t.InferType<typeof schema>;
  
  // @ts-expect-error
  const foo: MyType = {map: new Map([[`42`, `foo`]])};
  
  const bar: MyType = {map: new Map([[42, `foo`]])};
}

{
  const schema = t.isPartial({
    foo: t.isString()
  });
  type MyType = t.InferType<typeof schema>;
  
  const foo: MyType = {foo: `c`};
  const bar: MyType = {foo: `c`, test: 42};
}

// Does not currently work, see #9
// {
//     const schema = t.isObject({
//         enum: t.isEnum([`a`, `b`])
//     } as const);
//     type MyType = t.InferType<typeof schema>;
//
//     // @ts-expect-error
//     const foo: MyType = {enum: `c`};
// }

{
  t.isOneOf([] as const);
}

{
  t.fn([t.isNumber(), t.isString()], (val1, val2) => {
    assertEqual<number>()(val1, true);
    assertEqual<string>()(val2, true);
  });
  
  const fn = t.fn([t.isNumber()], val => {
    return val.toString();
  });
  
  let check: [number] = null as any;
  assertEqual<Parameters<typeof fn>>()(check, true);
}
