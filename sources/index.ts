export type BoundCoercionFn = () => BoundCoercionFn;
export type CoercionFn = (v: any) => BoundCoercionFn;

export type Coercion = [string, BoundCoercionFn];

export type ValidationState = {
  p?: string,
  errors?: string[],
  coercions?: Coercion[],
  coercion?: CoercionFn,
};

export type Trait<Type> = {__trait: Type};
export type InferType<U> = U extends Trait<infer V> ? V : never;

export type LooseTest<U> = (value: U, test?: ValidationState) => boolean;
export type StrictTest<U, V extends U> = (value: U, test?: ValidationState) => value is V;

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

export function computeKey(state: ValidationState | undefined, key: string | number) {
  if (typeof key === `number`) {
    return `${state?.p ?? `.`}[${key}]`;
  } else if (simpleKeyRegExp.test(key)) {
    return `${state?.p ?? ``}.${key}`;
  } else {
    return `${state?.p ?? `.`}[${JSON.stringify(key)}]`;
  }
}

export function makeCoercionFn(target: any, key: any): CoercionFn {
  return (v: any) => {
    const previous = target[key];
    target[key] = v;
    return makeCoercionFn(target, key).bind(null, previous);
  };
}

export function makeSetter(target: any, key: any) {
  return (v: any) => {
    target[key] = v;
  };
}

export function plural(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

export function pushError({errors, p}: ValidationState = {}, message: string) {
  errors?.push(`${p ?? `.`}: ${message}`);
  return false;
}

export const isUnknown = () => makeValidator<unknown, unknown>({
  test: (value, state): value is unknown => {
    return true;
  },
});

export function isLiteral(expected: null): StrictValidator<unknown, null>;
export function isLiteral(expected: true): StrictValidator<unknown, true>;
export function isLiteral(expected: false): StrictValidator<unknown, false>;
export function isLiteral<T extends number>(expected: T): StrictValidator<unknown, T>;
export function isLiteral<T extends string>(expected: T): StrictValidator<unknown, T>;
export function isLiteral<T>(expected: T): StrictValidator<unknown, T>;
export function isLiteral<T>(expected: T) {
  return makeValidator<unknown, T>({
    test: (value, state): value is T => {
      if (value !== expected)
        return pushError(state, `Expected a literal (got ${getPrintable(expected)})`);

      return true;
    },
  });
};

export const isString = () => makeValidator<unknown, string>({
  test: (value, state): value is string => {
    if (typeof value !== `string`)
      return pushError(state, `Expected a string (got ${getPrintable(value)})`);

    return true;
  },
});

export function isEnum<T extends boolean | string | number | null>(values: T[]): StrictValidator<unknown, T>;
export function isEnum<T>(enumSpec: Record<string, T>): StrictValidator<unknown, T>;
export function isEnum<T>(enumSpec: T): StrictValidator<unknown, T> {
  const valuesArray = Array.isArray(enumSpec) ? enumSpec : Object.values(enumSpec);
  const values = new Set(valuesArray);

  return makeValidator<unknown, T>({
    test: (value, state): value is T => {
      if (!values.has(value))
        return pushError(state, `Expected a valid enumeration value (got ${getPrintable(value)})`);

      return true;
    },
  });
}

const BOOLEAN_COERCIONS = new Map<unknown, boolean>([
  [`true`, true],
  [`True`, true],
  [`1`, true],
  [1, true],

  [`false`, false],
  [`False`, false],
  [`0`, false],
  [0, false],
]);

export const isBoolean = () => makeValidator<unknown, boolean>({
  test: (value, state): value is boolean => {
    if (typeof value !== `boolean`) {
      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        const coercion = BOOLEAN_COERCIONS.get(value);
        if (typeof coercion !== `undefined`) {
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, coercion)]);
          return true;
        }
      }

      return pushError(state, `Expected a boolean (got ${getPrintable(value)})`);
    }

    return true;
  },
});

export const isNumber = () => makeValidator<unknown, number>({
  test: (value, state): value is number => {
    if (typeof value !== `number`) {
      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        let coercion: number | undefined;
        if (typeof value === `string`) {
          let val;
          try {
            val = JSON.parse(value);
          } catch {}

          // We check against JSON.stringify that the output is the same to ensure that the number can be safely represented in JS
          if (typeof val === `number`) {
            if (JSON.stringify(val) === value) {
              coercion = val;
            } else {
              return pushError(state, `Received a number that can't be safely represented by the runtime (${value})`);
            }
          }
        }

        if (typeof coercion !== `undefined`) {
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, coercion)]);
          return true;
        }
      }

      return pushError(state, `Expected a number (got ${getPrintable(value)})`);
    }

    return true;
  },
});

export const isDate = () => makeValidator<unknown, Date>({
  test: (value, state): value is Date => {
    if (!(value instanceof Date)) {
      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        let coercion: Date | undefined;

        if (typeof value === `string` && iso8601RegExp.test(value)) {
          coercion = new Date(value);
        } else {
          let timestamp: number | undefined;
          if (typeof value === `string`) {
            let val;
            try {
              val = JSON.parse(value);
            } catch {}

            if (typeof val === `number`) {
              timestamp = val;
            }
          } else if (typeof value === `number`) {
            timestamp = value;
          }

          if (typeof timestamp !== `undefined`) {
            if (Number.isSafeInteger(timestamp) || !Number.isSafeInteger(timestamp * 1000)) {
              coercion = new Date(timestamp * 1000);
            } else {
              return pushError(state, `Received a timestamp that can't be safely represented by the runtime (${value})`);
            }
          }
        }

        if (typeof coercion !== `undefined`) {
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, coercion)]);
          return true;
        }
      }

      return pushError(state, `Expected a date (got ${getPrintable(value)})`);
    }

    return true;
  },
});

export const isArray = <T extends AnyStrictValidator>(spec: T, {delimiter}: {delimiter?: string | RegExp} = {}) => makeValidator<unknown, Array<InferType<T>>>({
  test: (value, state): value is Array<InferType<T>> => {
    if (typeof value === `string` && typeof delimiter !== `undefined`) {
      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        value = value.split(delimiter);
        state.coercions.push([state.p ?? `.`, state.coercion.bind(null, value)]);
      }
    }

    if (!Array.isArray(value))
      return pushError(state, `Expected an array (got ${getPrintable(value)})`);

    let valid = true;

    for (let t = 0, T = value.length; t < T; ++t) {
      valid = spec(value[t], {...state, p: computeKey(state, t), coercion: makeCoercionFn(value, t)}) && valid;

      if (!valid && state?.errors == null) {
        break;
      }
    }

    return valid;
  },
});

type AnyStrictValidatorTuple = AnyStrictValidator[] | [];

type InferTypeFromTuple<T extends AnyStrictValidatorTuple> = {[K in keyof T]: InferType<T[K]>};

export const isTuple = <T extends AnyStrictValidatorTuple>(spec: T, {delimiter}: {delimiter?: string | RegExp} = {}) => {
  const lengthValidator = hasExactLength(spec.length);

  return makeValidator<unknown, InferTypeFromTuple<T>>({
    test: (value, state): value is InferTypeFromTuple<T> => {
      if (typeof value === `string` && typeof delimiter !== `undefined`) {
        if (typeof state?.coercions !== `undefined`) {
          if (typeof state?.coercion === `undefined`)
            return pushError(state, `Unbound coercion result`);

          value = value.split(delimiter);
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, value)]);
        }
      }

      if (!Array.isArray(value))
        return pushError(state, `Expected a tuple (got ${getPrintable(value)})`);

      let valid = lengthValidator(value, {...state});

      for (let t = 0, T = value.length; t < T && t < spec.length; ++t) {
        valid = spec[t](value[t], {...state, p: computeKey(state, t), coercion: makeCoercionFn(value, t)}) && valid;

        if (!valid && state?.errors == null) {
          break;
        }
      }

      return valid;
    },
  });
};

type DeriveIndexUnlessNull<T extends AnyStrictValidator | null> = T extends null ? {} : InferType<T>;

export const isDict = <T extends AnyStrictValidator>(spec: T, {
  keys: keySpec = null,
}: {
  keys?: StrictValidator<unknown, string> | null,
} = {}) => makeValidator<unknown, {[k: string]: InferType<T>}>({
  test: (value, state): value is {[k: string]: InferType<T>} => {
    if (typeof value !== `object` || value === null)
      return pushError(state, `Expected an object (got ${getPrintable(value)})`);

    const keys = Object.keys(value);

    let valid = true;
    for (let t = 0, T = keys.length && (valid || state?.errors != null); t < T; ++t) {
      const key = keys[t];
      const sub = (value as {[key: string]: unknown})[key];

      if (key === `__proto__` || key === `constructor`) {
        valid = pushError({...state, p: computeKey(state, key)}, `Unsafe property name`);
        continue;
      }

      if (keySpec !== null && !keySpec(key, state)) {
        valid = false;
        continue;
      }

      if (!spec(sub, {...state, p: computeKey(state, key), coercion: makeCoercionFn(value, key)})) {
        valid = false;
        continue;
      }
    }

    return valid;
  },
});

// https://stackoverflow.com/a/56146934/880703
type UndefinedProperties<T> = {[P in keyof T]-?: undefined extends T[P] ? P : never}[keyof T]
type ToOptional<T> = Partial<Pick<T, UndefinedProperties<T>>> & Pick<T, Exclude<keyof T, UndefinedProperties<T>>>

export const isObject = <T extends {[P in keyof T]: AnyStrictValidator}, UnknownValidator extends AnyStrictValidator | null = null>(props: T, {
  extra: extraSpec = null,
}: {
  extra?: UnknownValidator,
} = {}) => {
  const specKeys = Object.keys(props);

  // We need to store this type inside an alias, otherwise TS seems to miss the "value is ..." guard
  type RequestedShape = ToOptional<{[P in keyof T]: InferType<(typeof props)[P]>} & DeriveIndexUnlessNull<UnknownValidator>>;

  return makeValidator<unknown, RequestedShape>({
    test: (value, state): value is RequestedShape => {
      if (typeof value !== `object` || value === null)
        return pushError(state, `Expected an object (got ${getPrintable(value)})`);

      const keys = new Set([...specKeys, ...Object.keys(value)]);
      const extra: {[key: string]: unknown} = {};

      let valid = true;
      for (const key of keys) {
        if (key === `constructor` || key === `__proto__`) {
          valid = pushError({...state, p: computeKey(state, key)}, `Unsafe property name`);
        } else {
          const spec = Object.prototype.hasOwnProperty.call(props, key)
            ? (props as any)[key] as AnyStrictValidator | undefined
            : undefined;

          const sub = Object.prototype.hasOwnProperty.call(value, key)
            ? (value as any)[key] as unknown
            : undefined;

          if (typeof spec !== `undefined`) {
            valid = spec(sub, {...state, p: computeKey(state, key), coercion: makeCoercionFn(value, key)}) && valid;
          } else if (extraSpec === null) {
            valid = pushError({...state, p: computeKey(state, key)}, `Extraneous property (got ${getPrintable(sub)})`);
          } else {
            Object.defineProperty(extra, key, {
              enumerable: true,
              get: () => sub,
              set: makeSetter(value, key)
            });
          }
        }

        if (!valid && state?.errors == null) {
          break;
        }
      }

      if (extraSpec !== null && (valid || state?.errors != null))
        valid = extraSpec(extra, state) && valid;

      return valid;
    },
  });
};

export const isInstanceOf = <T extends new (...args: any) => InstanceType<T>>(constructor: T) => makeValidator<unknown, InstanceType<T>>({
  test: (value, state): value is InstanceType<T> => {
    if (!(value instanceof constructor))
      return pushError(state, `Expected an instance of ${constructor.name} (got ${getPrintable(value)})`);

    return true;
  },
});

export const isOneOf = <T extends AnyStrictValidator>(specs: Array<T>, {
  exclusive = false,
}: {
  exclusive?: boolean,
} = {}) => makeValidator<unknown, InferType<T>>({
  test: (value, state): value is InferType<T> => {
    const matches: [string, (Coercion[] | undefined)][] = [];
    const errorBuffer = typeof state?.errors !== `undefined`
      ? [] : undefined;

    for (let t = 0, T = specs.length; t < T; ++t) {
      const subErrors = typeof state?.errors !== `undefined`
        ? [] : undefined;

      const subCoercions = typeof state?.coercions !== `undefined`
        ? [] : undefined;

      if (specs[t](value, {...state, errors: subErrors, coercions: subCoercions, p: `${state?.p ?? `.`}#${t + 1}`})) {
        matches.push([`#${t + 1}`, subCoercions]);
        if (!exclusive) {
          break;
        }
      } else {
        errorBuffer?.push(subErrors![0]);
      }
    }

    if (matches.length === 1) {
      const [, subCoercions] = matches[0];
      if (typeof subCoercions !== `undefined`)
        state?.coercions?.push(...subCoercions);
      return true;
    }

    if (matches.length > 1)
      pushError(state, `Expected to match exactly a single predicate (matched ${matches.join(`, `)})`);
    else
      state?.errors?.push(...errorBuffer!);

    return false;
  },
});

export const applyCascade = <T extends AnyStrictValidator>(spec: T, followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>) => makeValidator<unknown, InferType<T>>({
  test: (value, state): value is InferType<T> => {
    const context = {value: value as any};

    const subCoercion = typeof state?.coercions !== `undefined`
      ? makeCoercionFn(context, `value`) : undefined;

    const subCoercions = typeof state?.coercions !== `undefined`
      ? [] as Coercion[] : undefined;

    if (!spec(value, {...state, coercion: subCoercion, coercions: subCoercions}))
      return false;

    const reverts: BoundCoercionFn[] = [];
    if (typeof subCoercions !== `undefined`)
      for (const [, coercion] of subCoercions)
        reverts.push(coercion());

    try {
      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        if (context.value !== value)
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, context.value)]);

        state?.coercions?.push(...subCoercions!);
      }

      return followups.every(spec => {
        return spec(context.value as InferType<T>, state);
      });
    } finally {
      for (const revert of reverts) {
        revert();
      }
    }
  },
});

export const isOptional = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, InferType<T> | undefined>({
  test: (value, state): value is InferType<T> | undefined => {
    if (typeof value === `undefined`)
      return true;

    return spec(value, state);
  },
});

export const isNullable = <T extends AnyStrictValidator>(spec: T) => makeValidator<unknown, InferType<T> | null>({
  test: (value, state): value is InferType<T> | null => {
    if (value === null)
      return true;

    return spec(value, state);
  },
});

export const hasMinLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, state) => {
    if (!(value.length >= length))
      return pushError(state, `Expected to have a length of at least ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasMaxLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, state) => {
    if (!(value.length <= length))
      return pushError(state, `Expected to have a length of at most ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasExactLength = <T extends {length: number}>(length: number) => makeValidator<T>({
  test: (value, state) => {
    if (!(value.length === length))
      return pushError(state, `Expected to have a length of exactly ${length} elements (got ${value.length})`);

    return true;
  },
});

export const hasUniqueItems = <T>({
  map,
}: {
  map?: (value: T) => unknown,
} = {}) => makeValidator<T[]>({
  test: (value, state) => {
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

        pushError(state, `Expected to contain unique elements; got a duplicate with ${getPrintable(value)}`);
        dup.add(key);
      } else {
        set.add(key);
      }
    }

    return dup.size === 0;
  },
});

export const isNegative = () => makeValidator<number>({
  test: (value, state) => {
    if (!(value <= 0))
      return pushError(state, `Expected to be negative (got ${value})`);

    return true;
  },
});

export const isPositive = () => makeValidator<number>({
  test: (value, state) => {
    if (!(value >= 0))
      return pushError(state, `Expected to be positive (got ${value})`);

    return true;
  },
});

export const isAtLeast = (n: number) => makeValidator<number>({
  test: (value, state) => {
    if (!(value >= n))
      return pushError(state, `Expected to be at least ${n} (got ${value})`);

    return true;
  },
});

export const isAtMost = (n: number) => makeValidator<number>({
  test: (value, state) => {
    if (!(value <= n))
      return pushError(state, `Expected to be at most ${n} (got ${value})`);

    return true;
  },
});

export const isInInclusiveRange = (a: number, b: number) => makeValidator<number>({
  test: (value, state) => {
    if (!(value >= a && value <= b))
      return pushError(state, `Expected to be in the [${a}; ${b}] range (got ${value})`);

    return true;
  },
});

export const isInExclusiveRange = (a: number, b: number) => makeValidator<number>({
  test: (value, state) => {
    if (!(value >= a && value < b))
      return pushError(state, `Expected to be in the [${a}; ${b}[ range (got ${value})`);

    return true;
  },
});

export const isInteger = ({
  unsafe = false,
}: {
  unsafe?: boolean,
} = {}) => makeValidator<number>({
  test: (value, state) => {
    if (value !== Math.round(value))
      return pushError(state, `Expected to be an integer (got ${value})`);

    if (!Number.isSafeInteger(value))
      return pushError(state, `Expected to be a safe integer (got ${value})`);

    return true;
  },
});

export const matchesRegExp = (regExp: RegExp) => makeValidator<string>({
  test: (value, state) => {
    if (!regExp.test(value))
      return pushError(state, `Expected to match the pattern ${regExp.toString()} (got ${getPrintable(value)})`);

    return true;
  },
});

export const isLowerCase = () => makeValidator<string>({
  test: (value, state) => {
    if (value !== value.toLowerCase())
      return pushError(state, `Expected to be all-lowercase (got ${value})`);

    return true;
  },
});

export const isUpperCase = () => makeValidator<string>({
  test: (value, state) => {
    if (value !== value.toUpperCase())
      return pushError(state, `Expected to be all-uppercase (got ${value})`);

    return true;
  },
});

export const isUUID4 = () => makeValidator<string>({
  test: (value, state) => {
    if (!uuid4RegExp.test(value))
      return pushError(state, `Expected to be a valid UUID v4 (got ${getPrintable(value)})`);

    return true;
  },
});

export const isISO8601 = () => makeValidator<string>({
  test: (value, state) => {
    if (!iso8601RegExp.test(value))
      return pushError(state, `Expected to be a valid ISO 8601 date string (got ${getPrintable(value)})`);

    return false;
  },
});

export const isHexColor = ({
  alpha = false,
}: {
  alpha?: boolean,
}) => makeValidator<string>({
  test: (value, state) => {
    const res = alpha
      ? colorStringRegExp.test(value)
      : colorStringAlphaRegExp.test(value);

    if (!res)
      return pushError(state, `Expected to be a valid hexadecimal color string (got ${getPrintable(value)})`);

    return true;
  },
});

export const isBase64 = () => makeValidator<string>({
  test: (value, state) => {
    if (!base64RegExp.test(value))
      return pushError(state, `Expected to be a valid base 64 string (got ${getPrintable(value)})`);

    return true;
  },
});

export const isJSON = (spec: AnyStrictValidator = isUnknown()) => makeValidator<string>({
  test: (value, state) => {
    let data;
    try {
      data = JSON.parse(value);
    } catch {
      return pushError(state, `Expected to be a valid JSON string (got ${getPrintable(value)})`);
    }

    return spec(data, state);
  },
});

export const hasRequiredKeys = (requiredKeys: string[]) => {
  const requiredSet = new Set(requiredKeys);

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const problems: string[] = [];
      for (const key of requiredSet)
        if (!keys.has(key))
          problems.push(key);

      if (problems.length > 0)
        return pushError(state, `Missing required ${plural(problems.length, `property`, `properties`)} ${problems.map(name => `"${name}"`).join(`, `)}`);

      return true;
    },
  });
};

export const hasForbiddenKeys = (forbiddenKeys: string[]) => {
  const forbiddenSet = new Set(forbiddenKeys);

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const problems: string[] = [];
      for (const key of forbiddenSet)
        if (keys.has(key))
          problems.push(key);

      if (problems.length > 0)
        return pushError(state, `Forbidden ${plural(problems.length, `property`, `properties`)} ${problems.map(name => `"${name}"`).join(`, `)}`);

      return true;
    },
  });
};

export const hasMutuallyExclusiveKeys = (exclusiveKeys: string[]) => {
  const exclusiveSet = new Set(exclusiveKeys);

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const used: string[] = [];
      for (const key of exclusiveSet)
        if (keys.has(key))
          used.push(key);

      if (used.length > 1)
        return pushError(state, `Mutually exclusive properties ${used.map(name => `"${name}"`).join(`, `)}`);

      return true;
    },
  });
};

export enum KeyRelationship {
  Forbids = `Forbids`,
  Requires = `Requires`,
};

const keyRelationships = {
  [KeyRelationship.Forbids]: {
    expect: false,
    message: `forbids using`,
  },
  [KeyRelationship.Requires]: {
    expect: true,
    message: `requires using`,
  },
};

export const hasKeyRelationship = (subject: string, relationship: KeyRelationship, others: string[]) => {
  const otherSet = new Set(others);
  const spec = keyRelationships[relationship];

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));
      if (!keys.has(subject))
        return true;

      const problems: string[] = [];
      for (const key of otherSet)
        if (keys.has(key) !== spec.expect)
          problems.push(key);

      if (problems.length >= 1)
        return pushError(state, `Property "${subject}" ${spec.message} ${plural(problems.length, `property`, `properties`)} ${problems.map(name => `"${name}"`).join(`, `)}`);

      return true;
    },
  })
};
