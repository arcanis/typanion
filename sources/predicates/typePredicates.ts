import {
  computeKey,
  getPrintableArray,
  getPrintable,
} from '../internal/format';

import {
  iso8601RegExp,
} from '../internal/regexps';

import {
  makeCoercionFn,
  makeLazyCoercionFn,
  makeSetter,
  pushError,
} from '../internal/tools';

import {
  makeValidator,
  softAssert,
} from '../tools';

import {
  AnyStrictValidator,
  Coercion,
  InferType,
  StrictValidator,
} from '../types';

import {
  hasExactLength,
} from './cascadingPredicates';

/**
 * Create a validator that always returns true and never refines the type.
 */
export function isUnknown() {
  return makeValidator<unknown, unknown>({
    test: (value, state): value is unknown => {
      return true;
    },
  });
}

/**
 * Create a validator that only returns true when the tested value is exactly
 * the same as the expected one.
 * 
 * Refines the type to the provided literal, as much as possible. For example,
 * if you provide a literal string as parameter, the resulting type will be
 * whatever this literal string is, not a generic `string` type. The same is
 * true for `null`, `true`, `false`, and literal numbers.
 */
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
        return pushError(state, `Expected ${getPrintable(expected)} (got ${getPrintable(value)})`);

      return true;
    },
  });
};

/**
 * Create a validator that only returns true when the tested value is a string.
 * Refines the type to `string`.
 */
export function isString() {
  return makeValidator<unknown, string>({
    test: (value, state): value is string => {
      if (typeof value !== `string`)
        return pushError(state, `Expected a string (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that only returns true when the tested value is amongst
 * the expected set of values. Accepts both value arrays (['foo', 'bar']) and
 * dictionaries ({foo: 'foo', bar: 'bar'}), which makes them compatible with
 * regular TypeScript enumerations (as long as they're not declared as `const
 * enum`).
 * 
 * Refines the type to the enumeration values as much as possible. For example,
 * if you pass a TypeScript enumeration as expected set of values, the
 * resulting type will be the union of all values in this enumeration.
 */
export function isEnum<T extends boolean | string | number | null>(values: ReadonlyArray<T>): StrictValidator<unknown, T>;
export function isEnum<T>(enumSpec: Record<string, T>): StrictValidator<unknown, T>;
export function isEnum<T>(enumSpec: any): StrictValidator<unknown, T> {
  const valuesArray: T[] = Array.isArray(enumSpec) ? enumSpec : Object.values(enumSpec);
  const isAlphaNum = valuesArray.every(item => typeof item === 'string' || typeof item === 'number');

  const values = new Set(valuesArray);
  if (values.size === 1)
    return isLiteral<T>([...values][0]);

  return makeValidator<unknown, T>({
    test: (value, state): value is T => {
      if (!values.has(value as T)) {
        if (isAlphaNum) {
          return pushError(state, `Expected one of ${getPrintableArray(valuesArray, `or`)} (got ${getPrintable(value)})`);
        } else {
          return pushError(state, `Expected a valid enumeration value (got ${getPrintable(value)})`);
        }
      }

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

/**
 * Create a validator that only returns true when the tested value is a
 * boolean. Refines the type to `boolean`.
 * 
 * Supports coercion:
 * - 'true' / 'True' / '1' / 1 will turn to `true`
 * - 'false' / 'False' / '0' / 0 will turn to `false`
 */
export function isBoolean() {
  return makeValidator<unknown, boolean>({
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
}

/**
 * Create a validator that only returns true when the tested value is a
 * number (including floating numbers; use `cascade` and `isInteger` to
 * restrict the range further). Refines the type to `number`.
 * 
 * Supports coercion.
 */
export function isNumber() {
  return makeValidator<unknown, number>({
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
}

/**
 * Important: This validator only makes sense when used in conjunction with
 * coercion! It will always error when used without.
 * 
 * Create a validator that only returns true when the tested value is a
 * JSON representation of the expected type. Refines the type to the
 * expected type, and casts the value into its inner value.
 */
export function isPayload<T extends AnyStrictValidator>(spec: T) {
  return makeValidator<unknown, InferType<T>>({
    test: (value, state): value is InferType<T> => {
      if (typeof state?.coercions === `undefined`)
        return pushError(state, `The isPayload predicate can only be used with coercion enabled`);

      if (typeof state.coercion === `undefined`)
        return pushError(state, `Unbound coercion result`);

      if (typeof value !== `string`)
        return pushError(state, `Expected a string (got ${getPrintable(value)})`);

      let inner: unknown;
      try {
        inner = JSON.parse(value);
      } catch {
        return pushError(state, `Expected a JSON string (got ${getPrintable(value)})`);
      }

      const wrapper = {value: inner};
      if (!spec(inner, {...state, coercion: makeCoercionFn(wrapper, `value`)}))
        return false;

      state.coercions.push([state.p ?? `.`, state.coercion.bind(null, wrapper.value)]);
      return true;
    },
  });
}

/**
 * Create a validator that only returns true when the tested value is a
 * valid date. Refines the type to `Date`.
 * 
 * Supports coercion via one of the following formats:
 * - ISO86001 strings
 * - Unix timestamps
 */
export function isDate() {
  return makeValidator<unknown, Date>({
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
}

/**
 * Create a validator that only returns true when the tested value is an
 * array whose all values match the provided subspec. Refines the type to
 * `Array<T>`, with `T` being the subspec inferred type.
 * 
 * Supports coercion if the `delimiter` option is set, in which case strings
 * will be split accordingly.
 */
export function isArray<T extends AnyStrictValidator>(spec: T, {delimiter}: {delimiter?: string | RegExp} = {}) {
  return makeValidator<unknown, Array<InferType<T>>>({
    test: (value, state): value is Array<InferType<T>> => {
      const originalValue = value;

      if (typeof value === `string` && typeof delimiter !== `undefined`) {
        if (typeof state?.coercions !== `undefined`) {
          if (typeof state?.coercion === `undefined`)
            return pushError(state, `Unbound coercion result`);

          value = value.split(delimiter);
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

      if (value !== originalValue)
        state!.coercions!.push([state!.p ?? `.`, state!.coercion!.bind(null, value)]);

      return valid;
    },
  });
}

/**
 * Create a validator that only returns true when the tested value is an
 * set whose all values match the provided subspec. Refines the type to
 * `Set<T>`, with `T` being the subspec inferred type.
 * 
 * Supports coercion from arrays (or anything that can be coerced into an
 * array).
 */
export function isSet<T extends AnyStrictValidator>(spec: T, {delimiter}: {delimiter?: string | RegExp} = {}) {
  const isArrayValidator = isArray(spec, {delimiter});

  return makeValidator<unknown, Set<InferType<T>>>({
    test: (value, state): value is Set<InferType<T>> => {
      if (Object.getPrototypeOf(value).toString() === `[object Set]`) {
        softAssert(value, isInstanceOf(Set));

        if (typeof state?.coercions !== `undefined`) {
          if (typeof state?.coercion === `undefined`)
            return pushError(state, `Unbound coercion result`);

          const originalValues = [...value];
          const coercedValues = [...value];

          if (!isArrayValidator(coercedValues, {...state, coercion: undefined}))
            return false;

          const updateValue = () => coercedValues.some((val, t) => val !== originalValues[t])
            ? new Set(coercedValues)
            : value;

          state.coercions.push([state.p ?? `.`, makeLazyCoercionFn(state.coercion, value, updateValue)]);
          return true;
        } else {
          let valid = true;

          for (const subValue of value) {
            valid = spec(subValue, {...state}) && valid;
      
            if (!valid && state?.errors == null) {
              break;
            }
          }
      
          return valid;
        }
      }

      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        const store = {value};
        if (!isArrayValidator(value, {...state, coercion: makeCoercionFn(store, `value`)}))
          return false;

        state.coercions.push([state.p ?? `.`, makeLazyCoercionFn(state.coercion, value, () => new Set(store.value as any))]);
        return true;
      }

      return pushError(state, `Expected a set (got ${getPrintable(value)})`);
    }
  });
};

/**
 * Create a validator that only returns true when the tested value is an
 * map whose all values match the provided subspecs. Refines the type to
 * `Map<U, V>`, with `U` being the key subspec inferred type and `V` being
 * the value subspec inferred type.
 * 
 * Supports coercion from array of tuples (or anything that can be coerced into
 * an array of tuples).
 */
export function isMap<TKey extends AnyStrictValidator, TValue extends AnyStrictValidator>(keySpec: TKey, valueSpec: TValue) {
  const isArrayValidator = isArray(isTuple([keySpec, valueSpec]));
  const isRecordValidator = isRecord(valueSpec, {keys: keySpec});

  return makeValidator<unknown, Map<InferType<TKey>, InferType<TValue>>>({
    test: (value, state): value is Map<InferType<TKey>, InferType<TValue>> => {
      if (Object.getPrototypeOf(value).toString() === `[object Map]`) {
        softAssert(value, isInstanceOf(Map));

        if (typeof state?.coercions !== `undefined`) {
          if (typeof state?.coercion === `undefined`)
            return pushError(state, `Unbound coercion result`);

          const originalValues = [...value];
          const coercedValues = [...value];

          if (!isArrayValidator(coercedValues, {...state, coercion: undefined}))
            return false;

          const updateValue = () => coercedValues.some((val, t) => val[0] !== originalValues[t][0] || val[1] !== originalValues[t][1])
            ? new Map(coercedValues)
            : value;

          state.coercions.push([state.p ?? `.`, makeLazyCoercionFn(state.coercion, value, updateValue)]);
          return true;
        } else {
          let valid = true;

          for (const [key, subValue] of value) {
            valid = keySpec(key, {...state}) && valid;
            if (!valid && state?.errors == null) {
              break;
            }

            valid = valueSpec(subValue, {...state, p: computeKey(state, key)}) && valid;
            if (!valid && state?.errors == null) {
              break;
            }
          }
      
          return valid;
        }
      }

      if (typeof state?.coercions !== `undefined`) {
        if (typeof state?.coercion === `undefined`)
          return pushError(state, `Unbound coercion result`);

        const store = {value};
        if (Array.isArray(value)) {
          if (!isArrayValidator(value, {...state, coercion: undefined}))
            return false;

          state.coercions.push([state.p ?? `.`, makeLazyCoercionFn(state.coercion, value, () => new Map(store.value as any))]);
          return true;
        } else {
          if (!isRecordValidator(value, {...state, coercion: makeCoercionFn(store, `value`)}))
            return false;

          state.coercions.push([state.p ?? `.`, makeLazyCoercionFn(state.coercion, value, () => new Map(Object.entries(store.value as any)))]);
          return true;
        }
      }

      return pushError(state, `Expected a map (got ${getPrintable(value)})`);
    }
  });
};

type AnyStrictValidatorTuple = AnyStrictValidator[] | [];

type InferTypeFromTuple<T extends AnyStrictValidatorTuple> = {[K in keyof T]: InferType<T[K]>};

/**
 * Create a validator that only returns true when the tested value is a
 * tuple whose each value matches the corresponding subspec. Refines the type
 * into a tuple whose each item has the type inferred by the corresponding
 * tuple.
 * 
 * Supports coercion if the `delimiter` option is set, in which case strings
 * will be split accordingly.
 */
export function isTuple<T extends AnyStrictValidatorTuple>(spec: T, {delimiter}: {delimiter?: string | RegExp} = {}) {
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

/**
 * Create a validator that only returns true when the tested value is an
 * object with any amount of properties that must all match the provided
 * subspec. Refines the type to `Record<string, T>`, with `T` being the
 * subspec inferred type.
 * 
 * Keys can be optionally validated as well by using the `keys` optional
 * subspec parameter.
 */
export function isRecord<T extends AnyStrictValidator>(spec: T, {
  keys: keySpec = null,
}: {
  keys?: StrictValidator<unknown, string> | null,
} = {}) {
  const isArrayValidator = isArray(isTuple([keySpec ?? isString(), spec]));

  return makeValidator<unknown, Record<string, InferType<T>>>({
    test: (value, state): value is Record<string, InferType<T>> => {
      if (Array.isArray(value)) {
        if (typeof state?.coercions !== `undefined`) {
          if (typeof state?.coercion === `undefined`)
            return pushError(state, `Unbound coercion result`);

          if (!isArrayValidator(value, {...state, coercion: undefined}))
            return false;

          value = Object.fromEntries(value);
          state.coercions.push([state.p ?? `.`, state.coercion.bind(null, value)]);

          return true;
        }
      }

      if (typeof value !== `object` || value === null)
        return pushError(state, `Expected an object (got ${getPrintable(value)})`);

      const keys = Object.keys(value);

      let valid = true;
      for (let t = 0, T = keys.length; t < T && (valid || state?.errors != null); ++t) {
        const key = keys[t];
        const sub = (value as Record<string, unknown>)[key];

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
}

/**
 * @deprecated Replace `isDict` by `isRecord`
 */
export function isDict<T extends AnyStrictValidator>(spec: T, opts: {
  keys?: StrictValidator<unknown, string> | null,
} = {}) {
  return isRecord(spec, opts);
}

// https://stackoverflow.com/a/68261113/880703
type ExtractIndex<T> = {[K in keyof T as {} extends Record<K, 1> ? K : never]: T[K]};
type RemoveIndex<T> = {[K in keyof T as {} extends Record<K, 1> ? never : K]: T[K]};

// https://stackoverflow.com/a/56146934/880703
type UndefinedProperties<T> = {[P in keyof T]-?: undefined extends T[P] ? P : never}[keyof T]
type UndefinedToOptional<T> = Partial<Pick<T, UndefinedProperties<T>>> & Pick<T, Exclude<keyof T, UndefinedProperties<T>>>

type ObjectType<T> = UndefinedToOptional<RemoveIndex<T>> & ExtractIndex<T>;

/**
 * Create a validator that only returns true when the tested value is an
 * object whose all properties match their corresponding subspec. Refines
 * the type into an object whose each property has the type inferred by the
 * corresponding subspec.
 * 
 * Unlike `t.isPartial`, `t.isObject` doesn't allow extraneous properties by
 * default. This behaviour can be altered by using the `extra` optional
 * subspec parameter, which will be called to validate an object only
 * containing the extraneous properties.
 * 
 * Calling `t.isObject(..., {extra: t.isRecord(t.isUnknown())})` is
 * essentially the same as calling `t.isPartial(...)`.
 */
export function isObject<T extends {[P in keyof T]: AnyStrictValidator}, UnknownValidator extends AnyStrictValidator = StrictValidator<unknown, unknown>>(props: T, {
  extra: extraSpec = null,
}: {
  extra?: UnknownValidator | null,
} = {}) {
  const specKeys = Object.keys(props);

  // We need to store this type inside an alias, otherwise TS seems to miss the "value is ..." guard
  type RequestedShape = ObjectType<{[P in keyof T]: InferType<(typeof props)[P]>} & InferType<UnknownValidator>>;

  const validator = makeValidator<unknown, RequestedShape>({
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

  return Object.assign(validator, {
    properties: props,
  });
};

/**
 * Create a validator that only returns true when the tested value is an
 * object whose all properties match their corresponding subspec. Refines
 * the type into an object whose each property has the type inferred by the
 * corresponding subspec.
 * 
 * Unlike `t.isObject`, `t.isPartial` allows extraneous properties. The
 * resulting type will reflect this behaviour by including an index
 * signature (each extraneous property being typed `unknown`).
 * 
 * Calling `t.isPartial(...)` is essentially the same as calling
 * `t.isObject(..., {extra: t.isRecord(t.isUnknown())})`.
 */
export function isPartial<T extends {[P in keyof T]: AnyStrictValidator}>(props: T) {
  return isObject(props, {extra: isRecord(isUnknown())});
};

/**
 * Create a validator that only returns true when the tested value is an
 * object whose prototype is derived from the given class. Refines the type
 * into a class instance.
 */
export const isInstanceOf = <T extends new (...args: any) => InstanceType<T>>(constructor: T) => makeValidator<unknown, InstanceType<T>>({
  test: (value, state): value is InstanceType<T> => {
    if (!(value instanceof constructor))
      return pushError(state, `Expected an instance of ${constructor.name} (got ${getPrintable(value)})`);

    return true;
  },
});

/**
 * Create a validator that only returns true when the tested value is an
 * object matching any of the provided subspecs. If the optional `exclusive`
 * parameter is set to `true`, the behaviour changes so that the validator
 * only returns true when exactly one subspec matches.
 */
export const isOneOf = <T extends AnyStrictValidator>(specs: ReadonlyArray<T>, {
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
