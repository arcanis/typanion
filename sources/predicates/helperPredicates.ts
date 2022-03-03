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
 
 /**
  * Create a validator that checks that the tested object contains the specified
  * keys.
  */
 export function hasRequiredKeys(requiredKeys: string[]) {
   const requiredSet = new Set(requiredKeys);
 
   return makeValidator<Record<string, unknown>>({
     test: (value, state) => {
       const keys = new Set(Object.keys(value));
 
       const problems: string[] = [];
       for (const key of requiredSet)
         if (!keys.has(key))
           problems.push(key);
 
       if (problems.length > 0)
         return pushError(state, `Missing required ${plural(problems.length, `property`, `properties`)} ${getPrintableArray(problems, `and`)}`);
 
       return true;
     },
   });
 }
 
 /**
  * Create a validator that checks that the tested object contains none of the
  * specified keys.
  */
 export function hasForbiddenKeys(forbiddenKeys: string[]) {
   const forbiddenSet = new Set(forbiddenKeys);
 
   return makeValidator<{[key: string]: unknown}>({
     test: (value, state) => {
       const keys = new Set(Object.keys(value));
 
       const problems: string[] = [];
       for (const key of forbiddenSet)
         if (keys.has(key))
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
 export function hasMutuallyExclusiveKeys(exclusiveKeys: string[]) {
   const exclusiveSet = new Set(exclusiveKeys);
 
   return makeValidator<{[key: string]: unknown}>({
     test: (value, state) => {
       const keys = new Set(Object.keys(value));
 
       const used: string[] = [];
       for (const key of exclusiveSet)
         if (keys.has(key))
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
 export function hasKeyRelationship(subject: string, relationship: KeyRelationship, others: string[], {
   ignore = [],
 }: {
   ignore?: any[],
 } = {}) {
   const skipped = new Set(ignore);
 
   const otherSet = new Set(others);
   const spec = keyRelationships[relationship];
 
   const conjunction = relationship === KeyRelationship.Forbids
     ? `or`
     : `and`;
 
   return makeValidator<{[key: string]: unknown}>({
     test: (value, state) => {
       const keys = new Set(Object.keys(value));
       if (!keys.has(subject) || skipped.has(value[subject]))
         return true;
 
       const problems: string[] = [];
       for (const key of otherSet)
         if ((keys.has(key) && !skipped.has(value[key])) !== spec.expect)
           problems.push(key);
 
       if (problems.length >= 1)
         return pushError(state, `Property "${subject}" ${spec.message} ${plural(problems.length, `property`, `properties`)} ${getPrintableArray(problems, conjunction)}`);
 
       return true;
     },
   })
 };
 