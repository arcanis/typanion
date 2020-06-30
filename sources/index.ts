export type Trait<Type> = {__trait: Type};
export type InferType<U> = U extends Trait<infer V> ? V : never;

export type LooseTest<U> = (value: U, errors?: string[] | null, p?: string) => boolean;
export type StrictTest<U, V extends U> = (value: U, errors?: string[] | null, p?: string) => value is V;

export type LooseValidator<U, V> = LooseTest<U> & Trait<V>;
export type StrictValidator<U, V extends U> = StrictTest<U, V> & Trait<V>;

export type AnyStrictValidator = StrictValidator<any, any>;

export const simpleKeyRegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const colorStringRegExp = /^#[0-9a-f]{6}$/i;
export const colorStringAlphaRegExp = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

// https://stackoverflow.com/a/475217/880703
export const base64RegExp = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// https://stackoverflow.com/a/14166194/880703
export const uuid4RegExp = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/i;

// https://stackoverflow.com/a/28022901/880703 + https://www.debuggex.com/r/bl8J35wMKk48a7u_
export const iso8601RegExp = /^(?:[1-9]\d{3}(-?)(?:(?:0[1-9]|1[0-2])\1(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])\1(?:29|30)|(?:0[13578]|1[02])(?:\1)31|00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[0-5]))|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)(?:(-?)02(?:\2)29|-?366))T(?:[01]\d|2[0-3])(:?)[0-5]\d(?:\3[0-5]\d)?(?:Z|[+-][01]\d(?:\3[0-5]\d)?)$/;

export const makeTrait = <U>(value: U) => <V>() => {
  return value as U & Trait<V>;
};

export function makeValidator<U, V extends U>({test}: {test: StrictTest<U, V>}): StrictValidator<U, V>;
export function makeValidator<U, V extends U = U>({test}: {test: LooseTest<U>}): LooseValidator<U, V>;
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
    if (value !== expected)
      return pushError(errors, p, `Expected a literal (got ${getPrintable(expected)})`);

    return true;
  },
});

export const isString = () => makeValidator<unknown, string>({
  test: (value, errors, p): value is string => {
    if (typeof value !== `string`)
      return pushError(errors, p, `Expected a string (got ${getPrintable(value)})`);

    return true;
  },
});

export const isBoolean = () => makeValidator<unknown, boolean>({
  test: (value, errors, p): value is boolean => {
    if (typeof value !== `boolean`)
      return pushError(errors, p, `Expected a boolean (got ${getPrintable(value)})`);

    return true;
  },
});

export const isNumber = () => makeValidator<unknown, number>({
  test: (value, errors, p): value is number => {
    if (typeof value !== `number`)
      return pushError(errors, p, `Expected a number (got ${getPrintable(value)})`);

    return true;
  },
});

export const isArray = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, Array<InferType<T>>>({
  test: (value, errors, p): value is Array<InferType<T>> => {
    if (!Array.isArray(value))
      return pushError(errors, p, `Expected an array (got ${getPrintable(value)})`);

    let valid = true;

    for (let t = 0, T = value.length; t < T; ++t) {
      valid = spec(value[t], errors, addKey(p, t)) && valid;

      if (!valid && errors == null) {
        break;
      }
    }

    return valid;
  },
});

type DeriveIndexUnlessNull<T extends AnyStrictValidator | null> = T extends null ? {} : InferType<T>;

export const isDict = <T extends AnyStrictValidator>(spec: T, {
  keys: keySpec = null,
}: {
  keys?: StrictValidator<unknown, string> | null,
} = {}) => makeValidator<unknown, {[k: string]: InferType<T>}>({
  test: (value, errors, p): value is {[k: string]: InferType<T>} => {
    if (typeof value !== `object` || value === null)
      return pushError(errors, p, `Expected an object (got ${getPrintable(value)})`);

    const keys = Object.keys(value);

    let valid = true;
    for (let t = 0, T = keys.length && (valid || errors != null); t < T; ++t) {
      const key = keys[t];
      const sub = (value as {[key: string]: unknown})[key];

      if (keySpec !== null && !keySpec(key, errors, p)) {
        valid = false;
        continue;
      }

      if (!spec(sub, errors, addKey(p, key))) {
        valid = false;
        continue;
      }
    }

    return valid;
  },
});

export const isObject = <T extends {[P in keyof T]: AnyStrictValidator}, UnknownValidator extends AnyStrictValidator | null = null>(props: T, {
  extra: extraSpec = null,
}: {
  extra?: UnknownValidator,
} = {}) => {
  const specKeys = Object.keys(props);

  return makeValidator<unknown, {[P in keyof T]: InferType<(typeof props)[P]>} & DeriveIndexUnlessNull<UnknownValidator>>({
    test: (value, errors, p): value is {[P in keyof T]: InferType<(typeof props)[P]>} & DeriveIndexUnlessNull<UnknownValidator> => {
      if (typeof value !== `object` || value === null)
        return pushError(errors, p, `Expected an object (got ${getPrintable(value)})`);

      const keys = new Set([...specKeys, ...Object.keys(value)]);
      const extra: {[key: string]: unknown} = {};

      let valid = true;
      for (const key of keys) {
        const spec = Object.prototype.hasOwnProperty.call(props, key)
          ? (props as any)[key] as AnyStrictValidator | undefined
          : undefined;

        const sub = Object.prototype.hasOwnProperty.call(value, key)
          ? (value as any)[key] as unknown
          : undefined;

        if (typeof spec !== `undefined`) {
          valid = spec(sub, errors, addKey(p, key)) && valid;
        } else if (extraSpec === null) {
          valid = pushError(errors, addKey(p, key), `Extraneous property (got ${getPrintable(sub)})`);
        } else {
          extra[key] = sub;
        }

        if (!valid && errors == null) {
          break;
        }
      }

      if (extraSpec !== null && (valid || errors != null))
        valid = extraSpec(extra, errors, p) && valid;

      return valid;
    },
  });
};

export const isInstanceOf = <T extends new (...args: any) => InstanceType<T>>(constructor: T) => makeValidator<unknown, InstanceType<T>>({
  test: (value, errors, p): value is InstanceType<T> => {
    if (!(value instanceof constructor))
      return pushError(errors, p, `Expected an instance of ${constructor.name} (got ${getPrintable(value)})`);

    return true;
  },
});

export const isOneOf = <T extends AnyStrictValidator>(specs: Array<T>, {
  exclusive = false,
}: {
  exclusive?: boolean,
} = {}) => makeValidator<unknown, InferType<T>>({
  test: (value, errors, p): value is InferType<T> => {
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

export const hasMinLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, errors, p) => {
    if (!(value.length >= length))
      return pushError(errors, p, `Expected to have a length of at least ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasMaxLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, errors, p) => {
    if (!(value.length <= length))
      return pushError(errors, p, `Expected to have a length of at most ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasExactLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, errors, p) => {
    if (!(value.length <= length))
      return pushError(errors, p, `Expected to have a length of exactly ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasUniqueItems = <T>({
  map,
}: {
  map?: (value: T) => unknown,
} = {}) => makeValidator<T[]>({
  test: (value, errors, p) => {
    const set = new Set<unknown>();
    const dup = new Set<unknown>();

    for (let t = 0, T = value.length; t < T; ++t) {
      const sub = value[t];

      const key = typeof map !== `undefined`
        ? map(sub)
        : sub;

      if (set.has(key)) {
        if (dup.has(key))
          continue;

        pushError(errors, p, `Expected to contain unique elements; got a duplicate with ${getPrintable(value)}`);
        dup.add(key);
      } else {
        set.add(key);
      }
    }

    return dup.size === 0;
  },
});

export const isNegative = () => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value <= 0))
      return pushError(errors, p, `Expected to be negative (got ${value})`);

    return true;
  },
});

export const isPositive = () => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value >= 0))
      return pushError(errors, p, `Expected to be positive (got ${value})`);

    return true;
  },
});

export const isAtLeast = (n: number) => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value >= n))
      return pushError(errors, p, `Expected to be at least ${n} (got ${value})`);

    return true;
  },
});

export const isAtMost = (n: number) => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value <= n))
      return pushError(errors, p, `Expected to be at most ${n} (got ${value})`);

    return true;
  },
});

export const isInInclusiveRange = (a: number, b: number) => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value >= a && value <= b))
      return pushError(errors, p, `Expected to be in the [${a}; ${b}] range (got ${value})`);

    return true;
  },
});

export const isInExclusiveRange = (a: number, b: number) => makeValidator<number>({
  test: (value, errors, p) => {
    if (!(value >= a && value < b))
      return pushError(errors, p, `Expected to be in the [${a}; ${b}[ range (got ${value})`);

    return true;
  },
});

export const isInteger = ({
  unsafe = false,
}: {
  unsafe?: boolean,
} = {}) => makeValidator<number>({
  test: (value, errors, p) => {
    if (value !== Math.round(value))
      return pushError(errors, p, `Expected to be an integer (got ${value})`);

    if (!Number.isSafeInteger(value))
      return pushError(errors, p, `Expected to be a safe integer (got ${value})`);

    return true;
  },
});

export const matchesRegExp = (regExp: RegExp) => makeValidator<string>({
  test: (value, errors, p) => {
    if (!regExp.test(value))
      return pushError(errors, p, `Expected to match the pattern ${regExp.toString()} (got ${getPrintable(value)})`);

    return true;
  },
});

export const isLowerCase = () => makeValidator<string>({
  test: (value, errors, p) => {
    if (value !== value.toLowerCase())
      return pushError(errors, p, `Expected to be all-lowercase (got ${value})`);

    return true;
  },
});

export const isUpperCase = () => makeValidator<string>({
  test: (value, errors, p) => {
    if (value !== value.toUpperCase())
      return pushError(errors, p, `Expected to be all-uppercase (got ${value})`);

    return true;
  },
});

export const isUUID4 = () => makeValidator<string>({
  test: (value, errors, p) => {
    if (!uuid4RegExp.test(value))
      return pushError(errors, p, `Expected to be a valid UUID v4 (got ${getPrintable(value)})`);

    return true;
  },
});

export const isISO8601 = () => makeValidator<string>({
  test: (value, errors, p) => {
    if (!iso8601RegExp.test(value))
      return pushError(errors, p, `Expected to be a valid ISO 8601 date string (got ${getPrintable(value)})`);

    return false;
  },
});

export const isHexColor = ({
  alpha = false,
}: {
  alpha?: boolean,
}) => makeValidator<string>({
  test: (value, errors, p) => {
    const res = alpha
      ? colorStringRegExp.test(value)
      : colorStringAlphaRegExp.test(value);

    if (!res)
      return pushError(errors, p, `Expected to be a valid hexadecimal color string (got ${getPrintable(value)})`);

    return true;
  },
});

export const isBase64 = () => makeValidator<string>({
  test: (value, errors, p) => {
    if (!base64RegExp.test(value))
      return pushError(errors, p, `Expected to be a valid base 64 string (got ${getPrintable(value)})`);

    return true;
  },
});

export const isJSON = (spec: AnyStrictValidator = isUnknown()) => makeValidator<string>({
  test: (value, errors, p) => {
    let data;
    try {
      data = JSON.parse(value);
    } catch {
      return pushError(errors, p, `Expected to be a valid JSON string (got ${getPrintable(value)})`);
    }

    return spec(data, errors, p);
  },
});
