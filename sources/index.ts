export type Trait<Type> = {__trait: Type};
export type InferType<U> = U extends Trait<infer V> ? V : never;

export type Test<U, V extends U> = (value: U) => value is V;
export type Validator<U, V extends U> = Test<U, V> & Trait<V>;
export type AnyValidator = Validator<any, any>;

export const makeTrait = <U>(value: U) => <V>() => {
  return value as U & Trait<V>;
};

export function makeValidator<U, V extends U>({test}: {test: Test<U, V>}) {
  return makeTrait(test)<V>();
}

export const literal = <T>(expected: T) => makeValidator<unknown, T>({
  test: (value): value is T => {
    return value === expected;
  },
});

export const string = () => makeValidator<unknown, string>({
  test: (value): value is string => {
    return typeof value === `string`;
  },
});

export const array = <T extends AnyValidator>(spec: T) => makeValidator<unknown, Array<InferType<T>>>({
  test: (value): value is Array<InferType<T>> => {
    if (!Array.isArray(value))
      return false;

    return value.every(value => spec(value));
  },
});

export const object = <T extends {[P in keyof T]: AnyValidator}>(spec: T, {
  allowUnknownKeys = false,
}: {
  allowUnknownKeys?: boolean,
} = {}) => {
  const specKeys = Object.keys(spec);

  return makeValidator<unknown, {[P in keyof T]: InferType<(typeof spec)[P]>}>({
    test: (value): value is {[P in keyof T]: InferType<(typeof spec)[P]>} => {
      if (typeof value !== `object` || value === null)
        return false;

      if (!allowUnknownKeys) {
        const valueKeys = Object.keys(value);
        if (valueKeys.length !== specKeys.length) {
          return false;
        }
      }

      return specKeys.every(name => {
        const propertyName = name as any as keyof T;

        const subSpec = spec[propertyName];
        const subValue = (value as {[key: string]: unknown})[name];

        return subSpec(subValue);
      });
    },
  });
};

export const oneOf = <T extends AnyValidator>(specs: Array<T>) => makeValidator<unknown, InferType<T>>({
  test: (value): value is InferType<T> => {
    return specs.some(spec => spec(value));
  },
});

export const cascade = <T extends AnyValidator>(spec: T, followups: Array<Test<InferType<T>, InferType<T>>>) => makeValidator<unknown, InferType<T>>({
  test: (value): value is InferType<T> => {
    if (!spec(value))
      return false;

    return followups.every(spec => {
      return spec(value as InferType<T>);
    });
  },
});

export const minLength = <T extends {length: number}>(length: number) => makeValidator<T, T>({
  test: (value): value is T => {
    return value.length >= length;
  },
});

export const maxLength = <T extends {length: number}>(length: number) => makeValidator<T, T>({
  test: (value): value is T => {
    return value.length <= length;
  },
});
