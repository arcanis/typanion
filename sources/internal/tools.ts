import {
  BoundCoercionFn,
  CoercionFn,
  ValidationState,
} from '../types';

export function pushError({errors, p}: ValidationState = {}, message: string) {
  errors?.push(`${p ?? `.`}: ${message}`);
  return false;
}

export function makeSetter(target: any, key: any) {
  return (v: any) => {
    target[key] = v;
  };
}

export function makeCoercionFn(target: any, key: any): CoercionFn {
  return (v: any) => {
    const previous = target[key];
    target[key] = v;
    return makeCoercionFn(target, key).bind(null, previous);
  };
}

export function makeLazyCoercionFn(fn: CoercionFn, orig: any, generator: () => any): BoundCoercionFn {
  const commit = () => {
    fn(generator());
    return revert;
  };

  const revert = () => {
    fn(orig);
    return commit;
  };

  return commit;
}
