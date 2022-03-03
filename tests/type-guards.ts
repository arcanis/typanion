import * as t from '../sources';

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: unknown[] = foo;
  }
  
  if (t.isLiteral(null)(foo)) {
    const bar: null = foo;
  }
  
  if (t.isLiteral(`foo`)(foo)) {
    const bar: `foo` = foo;
  }
  
  if (t.isLiteral(true)(foo)) {
    const bar: true = foo;
  }
  
  if (t.isLiteral(false)(foo)) {
    const bar: false = foo;
  }
  
  if (t.isLiteral(42)(foo)) {
    const bar: 42 = foo;
  }
}

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: unknown[] = foo;
  }
  
  if (t.isArray(t.isUnknown())(foo)) {
    const bar: unknown[] = foo;
  }
};


(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: 'foo' | 'bar' = foo;
  }
  
  if (t.isEnum(['foo', 'bar'])(foo)) {
    const bar: 'foo' | 'bar' = foo;
  }
  
  enum Enum {
    FOO = 'foo',
    BAR = 'bar',
  };
  
  if (t.isEnum(Enum)(foo)) {
    const bar: 'foo' | 'bar' = foo;
  }
};

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: [string, number, boolean] = foo;
  }
  
  if (t.isTuple([t.isString(), t.isNumber(), t.isBoolean()])(foo)) {
    const bar: [string, number, boolean] = foo;
  }
};

{
  const foo = [1, 2];
  
  if (t.hasMinLength(8)(foo)) {
    const bar: unknown[] = foo;
  } else {
    const bar: unknown[] = foo;
  }
}

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: number = foo;
  }
  
  if (t.isNumber()(foo)) {
    const bar: number = foo;
  }
};

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: boolean = foo;
  }
  
  if (t.isBoolean()(foo)) {
    const bar: boolean = foo;
  }
};

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: number = foo.bar;
  }
  
  if (t.isObject({bar: t.isString()})(foo)) {
    // @ts-expect-error
    const bar: number = foo.bar;
  }
  
  if (t.isObject({bar: t.isString()})(foo)) {
    const bar: string = foo.bar;
  }
};

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: number = foo;
  }
  
  if (t.isObject({}, {extra: t.isDict(t.isString())})(foo)) {
    // @ts-expect-error
    const bar: number = foo['bar'];
  }
  
  if (t.isObject({}, {extra: t.isDict(t.isString())})(foo)) {
    const bar: string = foo['bar'];
  }
};

(foo: unknown) => {
  if (true) {
    // @ts-expect-error
    const bar: Error = foo;
  }
  
  if (t.isInstanceOf(Error)(foo)) {
    const bar: Error = foo;
  }
};
