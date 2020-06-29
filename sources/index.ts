export type Trait<Type> = {__trait: Type};
export type InferType<U> = U extends Trait<infer V> ? V : never;

export type LooseTest<U> = (value: U, errors?: string[] | null, p?: string) => boolean;
export type StrictTest<U, V extends U> = (value: U, errors?: string[] | null, p?: string) => value is V;

export type LooseValidator<U, V> = LooseTest<U> & Trait<V>;
export type StrictValidator<U, V extends U> = StrictTest<U, V> & Trait<V>;

export type AnyStrictValidator = StrictValidator<any, any>;

export const simpleKeyRegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export const uuid4RegExp = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/i;

export const makeTrait = <U>(value: U) => <V>() => {
  return value as U & Trait<V>;
};

export function makeValidator<U, V extends U>({test}: {test: StrictTest<U, V>}): StrictValidator<U, V>;
export function makeValidator<U, V extends U>({test}: {test: LooseTest<U>}): LooseValidator<U, V>;
export function makeValidator<U, V extends U>({test}: {test: StrictTest<U, V> | LooseTest<U>}) {
  return makeTrait(test)<V>();
}

export function getPrintable(value: unknown) {
  if (value === null)
    return `null`;
  if (value === undefined)
    return `undefined`;
  if (value === ``)
    return `an empty string`;

  return JSON.stringify(value);
}

export function addKey(p: string | undefined, key: string | number) {
  if (typeof key === `number`) {
    return `${p ?? `.`}[${key}]`
  } else if (simpleKeyRegExp.test(key)) {
    return `${p ?? ``}.${key}`;
  } else {
    return `${p ?? `.`}[${JSON.stringify(key)}]`;
  }
}

export function pushError(errors: string[] | null | undefined, p: string | undefined, message: string) {
  errors?.push(`${p ?? `.`}: ${message}`);
  return false;
}

export const isUnknown = () => makeValidator<unknown, unknown>({
  test: (value, errors, p): value is unknown => {
    return true;
  },
});

export const isLiteral = <T>(expected: T) => makeValidator<unknown, T>({
  test: (value, errors, p): value is T => {
    const res = value === expected;

    if (!res)
      pushError(errors, p, `Expected a literal (got ${getPrintable(expected)})`);

    return res;
  },
});

export const isString = () => makeValidator<unknown, string>({
  test: (value, errors, p): value is string => {
    const res = typeof value === `string`;

    if (!res)
      pushError(errors, p, `Expected a string (got ${getPrintable(value)})`);

    return res;
  },
});

export const isBoolean = () => makeValidator<unknown, boolean>({
  test: (value, errors, p): value is boolean => {
    const res = typeof value === `boolean`;

    if (!res)
      pushError(errors, p, `Expected a boolean (got ${getPrintable(value)})`);

    return res;
  },
});

export const isNumber = () => makeValidator<unknown, number>({
  test: (value, errors, p): value is number => {
    const res = typeof value === `number`;

    if (!res)
      pushError(errors, p, `Expected a number (got ${getPrintable(value)})`);

    return res;
  },
});

export const isArray = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, Array<InferType<T>>>({
  test: (value, errors, p): value is Array<InferType<T>> => {
    if (!Array.isArray(value))
      return pushError(errors, p, `Expected an array (got ${getPrintable(value)})`);

    let valid = true;
    for (let t = 0, T = value.length; t < T; ++t)
      valid = spec(value[t], errors, addKey(p, t)) && valid;

    return valid;
  },
});

type DeriveIndexUnlessNull<T> = T extends null ? {} : {[key: string]: T};

export const isObject = <T extends {[P in keyof T]: AnyStrictValidator}, UnknownValidator extends AnyStrictValidator | null = null>(props: T, {
  allowUnknownKeys = null,
}: {
  allowUnknownKeys?: UnknownValidator,
} = {}) => {
  const specKeys = Object.keys(props);

  return makeValidator<unknown, {[P in keyof T]: InferType<(typeof props)[P]>} & DeriveIndexUnlessNull<UnknownValidator>>({
    test: (value, errors, p): value is {[P in keyof T]: InferType<(typeof props)[P]>} & DeriveIndexUnlessNull<UnknownValidator> => {
      if (typeof value !== `object` || value === null)
        return pushError(errors, p, `Expected an object (got ${getPrintable(value)})`);

      const keys = new Set([
        ...specKeys,
        ...Object.keys(value),
      ]);

      let valid = true;
      for (const key of keys) {
        const spec = (props as any)[key] as AnyStrictValidator | undefined;
        const sub = (value as any)[key] as unknown;

        if (typeof spec !== `undefined`) {
          valid = spec(sub, errors, addKey(p, key)) && valid;
        } else if (allowUnknownKeys === null || !allowUnknownKeys(sub)) {
          valid = pushError(errors, addKey(p, key), `Extraneous property (got ${getPrintable(sub)})`);
        }
      }

      return valid;
    },
  });
};

export const isOneOf = <T extends AnyStrictValidator>(specs: Array<T>, {
  exclusive = false,
}: {
  exclusive?: boolean,
} = {}) => makeValidator<unknown, InferType<T>>({
  test: (value, errors, p): value is InferType<T> => {
    let valid = true;

    const matches: string[] = [];
    const errorBuffer = typeof errors !== `undefined`
      ? [] : undefined;

    for (let t = 0, T = specs.length; t < T; ++t) {
      const subErrors = typeof errors !== `undefined`
        ? [] : undefined;

      if (specs[t](value, subErrors, `${p ?? `.`}#${t + 1}`)) {
        matches.push(`#${t + 1}`);
        if (!exclusive) {
          break;
        }
      } else {
        errorBuffer?.push(subErrors![0]);
      }
    }

    if (matches.length === 1)
      return true;

    if (matches.length > 1)
      pushError(errors, p, `Expected to match exactly a single predicate (matched ${matches.join(`, `)})`);
    else
      errors?.push(...errorBuffer!);

    return false;
  },
});

export const applyCascade = <T extends AnyStrictValidator>(spec: T, followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>) => makeValidator<unknown, InferType<T>>({
  test: (value, errors, p): value is InferType<T> => {
    if (!spec(value, errors, p))
      return false;

    return followups.every(spec => {
      return spec(value as InferType<T>, errors, p);
    });
  },
});

export const isOptional = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, InferType<T> | undefined>({
  test: (value, errors, p): value is InferType<T> | undefined => {
    if (typeof value === `undefined`)
      return true;

    return spec(value, errors, p);
  },
});

export const isNullable = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, InferType<T> | null>({
  test: (value, errors, p): value is InferType<T> | null => {
    if (value === null)
      return true;

    return spec(value, errors, p);
  },
});

export const hasMinLength = <T extends {length: number}>(length: number) => makeValidator<T, T>({
  test: (value, errors, p) => {
    const res = value.length >= length;

    if (!res)
      pushError(errors, p, `Expected to have a length of at least ${length} elements (got ${value.length})`);

    return res;
  },
});

export const hasMaxLength = <T extends {length: number}>(length: number) => makeValidator<T, T>({
  test: (value, errors, p) => {
    const res = value.length <= length;

    if (!res)
      pushError(errors, p, `Expected to have a length of at most ${length} elements (got ${value.length})`);

    return res;
  },
});

export const hasExactLength = <T extends {length: number}>(length: number) => makeValidator<T, T>({
  test: (value, errors, p) => {
    const res = value.length <= length;

    if (!res)
      pushError(errors, p, `Expected to have a length of exactly ${length} elements (got ${value.length})`);

    return res;
  },
});

export const isNegative = () => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value <= 0;

    if (!res)
      pushError(errors, p, `Expected to be negative (got ${value})`);

    return res;
  },
});

export const isPositive = () => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value >= 0;

    if (!res)
      pushError(errors, p, `Expected to be positive (got ${value})`);

    return res;
  },
});

export const isAtLeast = (n: number) => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value >= n;

    if (!res)
      pushError(errors, p, `Expected to be at least ${n} (got ${value})`);

    return res;
  },
});

export const isAtMost = (n: number) => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value <= n;

    if (!res)
      pushError(errors, p, `Expected to be at most ${n} (got ${value})`);

    return res;
  },
});

export const isInInclusiveRange = (a: number, b: number) => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value >= a && value <= b;

    if (!res)
      pushError(errors, p, `Expected to be in the [${a}; ${b}] range (got ${value})`);

    return res;
  },
});

export const isInExclusiveRange = (a: number, b: number) => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value >= a && value < b;

    if (!res)
      pushError(errors, p, `Expected to be in the [${a}; ${b}[ range (got ${value})`);

    return res;
  },
});

export const isInteger = () => makeValidator<number, number>({
  test: (value, errors, p) => {
    const res = value === Math.round(value);

    if (!res)
      pushError(errors, p, `Expected to be an integer (got ${value})`);

    return res;
  },
});

export const matchesRegExp = (regExp: RegExp) => makeValidator<string, string>({
  test: (value, errors, p) => {
    const res = regExp.test(value);

    if (!res)
      pushError(errors, p, `Expected to match the pattern ${regExp.toString()} (got ${getPrintable(value)})`);

    return res;
  },
});

export const isLowerCase = () => makeValidator<string, string>({
  test: (value, errors, p) => {
    const res = value === value.toLowerCase();

    if (!res)
      pushError(errors, p, `Expected to be all-lowercase (got ${value})`);

    return res;
  },
});

export const isUpperCase = () => makeValidator<string, string>({
  test: (value, errors, p) => {
    const res = value === value.toLowerCase();

    if (!res)
      pushError(errors, p, `Expected to be all-uppercase (got ${value})`);

    return res;
  },
});

export const isUUID4 = () => makeValidator<string, string>({
  test: (value, errors, p) => {
    const res = uuid4RegExp.test(value);

    if (!res)
      pushError(errors, p, `Expected to be a valid UUID v4 (got ${getPrintable(value)})`);

    return res;
  },
});
