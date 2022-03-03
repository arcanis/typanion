import {ValidationState} from '../types';

const simpleKeyRegExp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function getPrintable(value: unknown) {
  if (value === null)
    return `null`;
  if (value === undefined)
    return `undefined`;
  if (value === ``)
    return `an empty string`;
  if (typeof value === 'symbol')
    return `<${value.toString()}>`;
  if (Array.isArray(value))
    return `an array`;

  return JSON.stringify(value);
}

export function getPrintableArray(value: unknown[], conjunction: string) {
  if (value.length === 0)
    return `nothing`;

  if (value.length === 1)
    return getPrintable(value[0]);

  const rest = value.slice(0, -1);
  const trailing = value[value.length - 1];

  const separator = value.length > 2
    ? `, ${conjunction} `
    : ` ${conjunction} `;

  return `${rest.map(value => getPrintable(value)).join(`, `)}${separator}${getPrintable(trailing)}`;
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

export function plural(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}
