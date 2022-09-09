import {
  getPrintable,
} from '../internal/format';

import {
  base64RegExp,
  colorStringAlphaRegExp,
  colorStringRegExp,
  iso8601RegExp,
  uuid4RegExp,
} from '../internal/regexps';

import {
  pushError,
} from '../internal/tools';

import {
  makeValidator,
} from '../tools';

import {
  AnyStrictValidator,
} from '../types';

import {
  isUnknown,
} from './typePredicates';

/**
 * Create a validator that checks that the tested array or string has at least
 * the specified length.
 */
export function hasMinLength<T extends {length: number}>(length: number) {
  return makeValidator<T>({
    test: (value, state) => {
      if (!(value.length >= length))
        return pushError(state, `Expected to have a length of at least ${length} elements (got ${value.length})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested array or string has at most
 * the specified length.
 */
export function hasMaxLength<T extends {length: number}>(length: number) {
  return makeValidator<T>({
    test: (value, state) => {
      if (!(value.length <= length))
        return pushError(state, `Expected to have a length of at most ${length} elements (got ${value.length})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested array or string has exactly
 * the specified length.
 */
export function hasExactLength<T extends {length: number}>(length: number) {
  return makeValidator<T>({
    test: (value, state) => {
      if (!(value.length === length))
        return pushError(state, `Expected to have a length of exactly ${length} elements (got ${value.length})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested array only contains unique
 * elements. The optional `map` parameter lets you define a transform to
 * apply before making the check (the result of this transform will be
 * discarded afterwards).
 */
export function hasUniqueItems<T>({
  map,
}: {
  map?: (value: T) => unknown,
} = {}) {
  return makeValidator<T[]>({
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
}

/**
 * Create a validator that checks that the tested number is strictly less than 0.
 */
export function isNegative() {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value <= 0))
        return pushError(state, `Expected to be negative (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is equal or greater
 * than 0.
 */
export function isPositive() {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value >= 0))
        return pushError(state, `Expected to be positive (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is equal or greater
 * than the specified reference.
 */
export function isAtLeast(n: number) {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value >= n))
        return pushError(state, `Expected to be at least ${n} (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is equal or smaller
 * than the specified reference.
 */
export function isAtMost(n: number) {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value <= n))
        return pushError(state, `Expected to be at most ${n} (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is between the
 * specified references (including the upper boundary).
 */
export function isInInclusiveRange(a: number, b: number) {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value >= a && value <= b))
        return pushError(state, `Expected to be in the [${a}; ${b}] range (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is between the
 * specified references (excluding the upper boundary).
 */
export function isInExclusiveRange(a: number, b: number) {
  return makeValidator<number>({
    test: (value, state) => {
      if (!(value >= a && value < b))
        return pushError(state, `Expected to be in the [${a}; ${b}[ range (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested number is an integer.
 * 
 * By default Typanion will also check that it's a *safe* integer. For example,
 * 2^53 wouldn't be a safe integer because 2^53+1 would be rounded to 2^53,
 * which could put your applications at risk when used in loops.
 */
export function isInteger({
  unsafe = false,
}: {
  unsafe?: boolean,
} = {}) {
  return makeValidator<number>({
    test: (value, state) => {
      if (value !== Math.round(value))
        return pushError(state, `Expected to be an integer (got ${value})`);

      if (!unsafe && !Number.isSafeInteger(value))
        return pushError(state, `Expected to be a safe integer (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string matches the given
 * regular expression.
 */
export function matchesRegExp(regExp: RegExp) {
  return makeValidator<string>({
    test: (value, state) => {
      if (!regExp.test(value))
        return pushError(state, `Expected to match the pattern ${regExp.toString()} (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string only contain lowercase
 * characters.
 */
export function isLowerCase() {
  return makeValidator<string>({
    test: (value, state) => {
      if (value !== value.toLowerCase())
        return pushError(state, `Expected to be all-lowercase (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string only contain uppercase
 * characters.
 */
export function isUpperCase() {
  return makeValidator<string>({
    test: (value, state) => {
      if (value !== value.toUpperCase())
        return pushError(state, `Expected to be all-uppercase (got ${value})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string is a valid UUID v4.
 */
export function isUUID4() {
  return makeValidator<string>({
    test: (value, state) => {
      if (!uuid4RegExp.test(value))
        return pushError(state, `Expected to be a valid UUID v4 (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string is a valid ISO8601
 * date.
 */
export function isISO8601() {
  return makeValidator<string>({
    test: (value, state) => {
      if (!iso8601RegExp.test(value))
        return pushError(state, `Expected to be a valid ISO 8601 date string (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string is a valid hexadecimal
 * color. Setting the optional `alpha` parameter to `true` allows an additional
 * transparency channel to be included.
 */
export function isHexColor({
  alpha = false,
}: {
  alpha?: boolean,
}) {
  return makeValidator<string>({
    test: (value, state) => {
      const res = alpha
        ? colorStringRegExp.test(value)
        : colorStringAlphaRegExp.test(value);

      if (!res)
        return pushError(state, `Expected to be a valid hexadecimal color string (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string is valid base64.
 */
export function isBase64() {
  return makeValidator<string>({
    test: (value, state) => {
      if (!base64RegExp.test(value))
        return pushError(state, `Expected to be a valid base 64 string (got ${getPrintable(value)})`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested string is valid JSON. A
 * optional spec can be passed as parameter, in which case the data will be
 * deserialized and validated against the spec (coercion will be disabled
 * for this check, and even if successful the returned value will still be
 * the original string).
 */
export function isJSON(spec: AnyStrictValidator = isUnknown()) {
  return makeValidator<string>({
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
}
