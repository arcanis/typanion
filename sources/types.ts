export type BoundCoercionFn = () => BoundCoercionFn;
export type CoercionFn = (v: any) => BoundCoercionFn;
export type Coercion = [string, BoundCoercionFn];

/**
 * Given a Typanion validator, return the type the validator guarantees if it
 * matches.
 */
export type InferType<U> = U extends Trait<infer V> ? V : never;
export type Trait<Type> = {__trait: Type};

export type LooseTest<U> = (value: U, test?: ValidationState) => boolean;
export type StrictTest<U, V extends U> = (value: U, test?: ValidationState) => value is V;

export type LooseValidator<U, V> = LooseTest<U> & Trait<V>;
export type StrictValidator<U, V extends U> = StrictTest<U, V> & Trait<V>;

export type AnyStrictValidator = StrictValidator<any, any>;

export type ValidationState = {
  p?: string,
  errors?: string[],
  coercions?: Coercion[],
  coercion?: CoercionFn,
};
