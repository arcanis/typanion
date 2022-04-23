import {
  makeCoercionFn,
} from './internal/tools';

import {
  isTuple,
} from './predicates/typePredicates';

import {
  AnyStrictValidator,
  Coercion,
  InferType,
  LooseTest,
  LooseValidator,
  StrictTest,
  StrictValidator,
  Trait,
} from './types';

export function makeTrait<U>(value: U) {
  return <V>() => {
    return value as U & Trait<V>;
  };
}

export function makeValidator<U, V extends U>({test}: {test: StrictTest<U, V>}): StrictValidator<U, V>;
export function makeValidator<U, V extends U = U>({test}: {test: LooseTest<U>}): LooseValidator<U, V>;
export function makeValidator<U, V extends U>({test}: {test: StrictTest<U, V> | LooseTest<U>}) {
  return makeTrait(test)<V>();
}

export class TypeAssertionError extends Error {
  constructor({errors}: {errors?: string[]} = {}) {
    let errorMessage = `Type mismatch`;

    if (errors && errors.length > 0) {
      errorMessage += `\n`;
      for (const error of errors) {
        errorMessage += `\n- ${error}`;
      }
    }

    super(errorMessage);
  }
}

/**
 * Check that the specified value matches the given validator, and throws an
 * exception if it doesn't. Refine the type if it passes.
 */
export function assert<T extends AnyStrictValidator>(val: unknown, validator: T): asserts val is InferType<T> {
  if (!validator(val)) {
    throw new TypeAssertionError();
  }
}

/**
 * Check that the specified value matches the given validator, and throws an
 * exception if it doesn't. Refine the type if it passes.
 * 
 * Thrown exceptions include details about what exactly looks invalid in the
 * tested value.
 */
export function assertWithErrors<T extends AnyStrictValidator>(val: unknown, validator: T): asserts val is InferType<T> {
  const errors: string[] = [];
  if (!validator(val, {errors})) {
    throw new TypeAssertionError({errors});
  }
}

/**
 * Compile-time only. Refine the type as if the validator was matching the
 * tested value, but doesn't actually run it. Similar to the classic `as`
 * operator in TypeScript.
 */
export function softAssert<T extends AnyStrictValidator>(val: unknown, validator: T): asserts val is InferType<T> {
  // It's a soft assert; we tell TypeScript about the type, but we don't need to check it
}

/**
 * Check that the value matches the given validator. Returns a tuple where the
 * first element is the validated value, and the second the reported errors.
 * 
 * If the `errors` field is set to `false` (the default), the error reporting
 * will be a single boolean. If set to `true`, it'll be an array of strings.
 */
export function as<T extends AnyStrictValidator>(value: unknown, validator: T, opts: {coerce?: boolean, errors?: boolean, throw: true}): InferType<T>;
export function as<T extends AnyStrictValidator>(value: unknown, validator: T, opts: {coerce?: boolean, errors: false, throw?: false}): {value: InferType<T>, errors: undefined} | {value: unknown, errors: true};
export function as<T extends AnyStrictValidator>(value: unknown, validator: T, opts: {coerce?: boolean, errors: true, throw?: false}): {value: InferType<T>, errors: undefined} | {value: unknown, errors: Array<string>};
export function as<T extends AnyStrictValidator>(value: unknown, validator: T, opts?: {coerce?: boolean, errors?: boolean, throw?: false}): {value: InferType<T>, errors: undefined} | {value: unknown, errors: Array<string> | true};
export function as<T extends AnyStrictValidator>(value: unknown, validator: T, {coerce = false, errors: storeErrors, throw: throws}: {coerce?: boolean, errors?: boolean, throw?: boolean} = {}): InferType<T> | {value: InferType<T>, errors: undefined} | {value: unknown, errors: Array<string> | true} {
  const errors = storeErrors ? [] : undefined;

  if (!coerce) {
    if (validator(value, {errors})) {
      return throws ? value : {value, errors: undefined};
    } else if (!throws) {
      return {value: undefined as never, errors: errors ?? true};
    } else {
      throw new TypeAssertionError({errors})
    }
  }

  const state = {value};

  const coercion = makeCoercionFn(state, `value`);
  const coercions: Coercion[] = [];

  if (!validator(value, {errors, coercion, coercions})) {
    if (!throws) {
      return {value: undefined as never, errors: errors ?? true};
    } else {
      throw new TypeAssertionError({errors});
    }
  }

  for (const [, apply] of coercions)
    apply();

  if (throws) {
    return state.value as InferType<T>;
  } else {
    return {value: state.value as InferType<T>, errors: undefined};
  }
}

type FnValidatedArgument<T extends [] | [AnyStrictValidator, ...AnyStrictValidator[]]> =
  T extends [AnyStrictValidator, ...AnyStrictValidator[]]
    ? {[K in keyof T]: InferType<T[K]>}
    : [];
  
interface FnValidatedFunction<T extends [] | [AnyStrictValidator, ...AnyStrictValidator[]], Ret> {
  (...args: FnValidatedArgument<T>): Ret;
};

/**
 * Create and return a new function that apply the given validators to each
 * corresponding argument passed to the function and throws an exception in
 * case of a mismatch.
 */
export function fn<T extends [] | [AnyStrictValidator, ...AnyStrictValidator[]], Ret>(validators: T, fn: (...args: FnValidatedArgument<T>) => Ret): FnValidatedFunction<T, Ret> {
  const isValidArgList = isTuple(validators);

  return ((...args: FnValidatedArgument<T>) => {
    const check = isValidArgList(args);
    if (!check)
      throw new TypeAssertionError();

    return fn(...args as any);
  }) as FnValidatedFunction<T, Ret>;
}
