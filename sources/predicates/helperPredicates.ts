import {
  getPrintableArray,
  plural,
} from '../internal/format';

import {
  makeCoercionFn,
  pushError,
} from '../internal/tools';

import {
  makeValidator,
} from '../tools';

import {
  AnyStrictValidator,
  BoundCoercionFn,
  Coercion,
  InferType,
  LooseTest,
  StrictTest,
  StrictValidator,
} from '../types';

/**
 * Create a validator that runs the provided spec before applying a series of
 * followup validation on the refined type. This is useful when you not only
 * wish to validate the data type itself, but also its format.
 * 
 * For example, the following would validate that a value is a valid port:
 *   t.cascade(t.isNumber(), t.isInteger(), t.isInInclusiveRange(1, 655356))
 * 
 * And the following would validate that a value is base64:
 *   t.cascade(t.isString(), t.isBase64())
 */
export function cascade<T extends AnyStrictValidator>(spec: T, followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>): StrictValidator<unknown, InferType<T>>;
export function cascade<T extends AnyStrictValidator>(spec: T, ...followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>): StrictValidator<unknown, InferType<T>>;
export function cascade<T extends AnyStrictValidator>(spec: T, ...followups: any) {
  const resolvedFollowups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>> = Array.isArray(followups[0])
    ? followups[0]
    : followups;

  return makeValidator<unknown, InferType<T>>({
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
          if (context.value !== value) {
            if (typeof state?.coercion === `undefined`)
              return pushError(state, `Unbound coercion result`);

            state.coercions.push([state.p ?? `.`, state.coercion.bind(null, context.value)]);
          }

          state?.coercions?.push(...subCoercions!);
        }

        return resolvedFollowups.every(spec => {
          return spec(context.value as InferType<T>, state);
        });
      } finally {
        for (const revert of reverts) {
          revert();
        }
      }
    },
  });
}

/**
 * @deprecated Replace `applyCascade` by `cascade`
 */
export function applyCascade<T extends AnyStrictValidator>(spec: T, followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>): StrictValidator<unknown, InferType<T>>;
export function applyCascade<T extends AnyStrictValidator>(spec: T, ...followups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>>): StrictValidator<unknown, InferType<T>>;
export function applyCascade<T extends AnyStrictValidator>(spec: T, ...followups: any) {
  const resolvedFollowups: Array<StrictTest<InferType<T>, InferType<T>> | LooseTest<InferType<T>>> = Array.isArray(followups[0])
    ? followups[0]
    : followups;

  return cascade(spec, resolvedFollowups);
}

/**
 * Wraps the given spec to also allow `undefined`.
 */
export function isOptional<T extends AnyStrictValidator>(spec: T) {
  return makeValidator<unknown, InferType<T> | undefined>({
    test: (value, state): value is InferType<T> | undefined => {
      if (typeof value === `undefined`)
        return true;

      return spec(value, state);
    },
  });
}
 
/**
 * Wraps the given spec to also allow `null`.
 */
export function isNullable<T extends AnyStrictValidator>(spec: T) {
  return makeValidator<unknown, InferType<T> | null>({
    test: (value, state): value is InferType<T> | null => {
      if (value === null)
        return true;

      return spec(value, state);
    },
  });
}

export type MissingType = 'missing' | 'undefined' | 'nil' | 'falsy';

const checks: {[index in MissingType]: (keys: Set<string>, key: string, value: Record<string, unknown>) => boolean } = {
  missing: (keys, key) => keys.has(key),
  undefined: (keys, key, value) => keys.has(key) && typeof value[key] !== `undefined`,
  nil: (keys, key, value) => keys.has(key) && value[key] != null,
  falsy: (keys, key, value) => keys.has(key) && !!value[key],
};

/**
 * Create a validator that checks that the tested object contains the specified
 * keys.
*/
export function hasRequiredKeys(requiredKeys: string[], options?: { missingIf?: MissingType }) {
  const requiredSet = new Set(requiredKeys);
  const check = checks[options?.missingIf ?? 'missing'];

  return makeValidator<Record<string, unknown>>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const problems: string[] = [];
      for (const key of requiredSet)
        if (!check(keys, key, value))
          problems.push(key);

      if (problems.length > 0)
        return pushError(state, `Missing required ${plural(problems.length, `property`, `properties`)} ${getPrintableArray(problems, `and`)}`);

      return true;
    },
  });
}

/**
* Create a validator that checks that the tested object contains at least one
* of the specified keys.
*/
export function hasAtLeastOneKey(requiredKeys: string[], options?: { missingIf?: MissingType }) {
  const requiredSet = new Set(requiredKeys);
  const check = checks[options?.missingIf ?? 'missing'];

  return makeValidator<Record<string, unknown>>({
    test: (value, state) => {
      const keys = Object.keys(value);

      const valid = keys.some(key => check(requiredSet, key, value));
      if (!valid)
        return pushError(state, `Missing at least one property from ${getPrintableArray(Array.from(requiredSet), `or`)}`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested object contains none of the
 * specified keys.
*/
export function hasForbiddenKeys(forbiddenKeys: string[], options?: { missingIf?: MissingType }) {
  const forbiddenSet = new Set(forbiddenKeys);
  const check = checks[options?.missingIf ?? 'missing'];

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const problems: string[] = [];
      for (const key of forbiddenSet)
        if (check(keys, key, value))
          problems.push(key);

      if (problems.length > 0)
        return pushError(state, `Forbidden ${plural(problems.length, `property`, `properties`)} ${getPrintableArray(problems, `and`)}`);

      return true;
    },
  });
}

/**
 * Create a validator that checks that the tested object contains at most one
 * of the specified keys.
 */
export function hasMutuallyExclusiveKeys(exclusiveKeys: string[], options?: { missingIf?: MissingType }) {
  const exclusiveSet = new Set(exclusiveKeys);
  const check = checks[options?.missingIf ?? 'missing'];

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));

      const used: string[] = [];
      for (const key of exclusiveSet)
        if (check(keys, key, value))
          used.push(key);

      if (used.length > 1)
        return pushError(state, `Mutually exclusive properties ${getPrintableArray(used, `and`)}`);

      return true;
    },
  });
}

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

/**
 * Create a validator that checks that, when the specified subject property is
 * set, the relationship is satisfied.
 */
export function hasKeyRelationship(subject: string, relationship: KeyRelationship, others: string[], options?: { ignore?: any[], missingIf?: MissingType }) {
  const skipped = new Set(options?.ignore ?? []);
  const check = checks[options?.missingIf ?? 'missing'];

  const otherSet = new Set(others);
  const spec = keyRelationships[relationship];

  const conjunction = relationship === KeyRelationship.Forbids
    ? `or`
    : `and`;

  return makeValidator<{[key: string]: unknown}>({
    test: (value, state) => {
      const keys = new Set(Object.keys(value));
      if (!check(keys, subject, value) || skipped.has(value[subject]))
        return true;

      const problems: string[] = [];
      for (const key of otherSet)
        if ((check(keys, key, value) && !skipped.has(value[key])) !== spec.expect)
          problems.push(key);

      if (problems.length >= 1)
        return pushError(state, `Property "${subject}" ${spec.message} ${plural(problems.length, `property`, `properties`)} ${getPrintableArray(problems, conjunction)}`);

      return true;
    },
  })
};
