export const colorStringRegExp = /^#[0-9a-f]{6}$/i;
export const colorStringAlphaRegExp = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

// https://stackoverflow.com/a/475217/880703
export const base64RegExp = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// https://stackoverflow.com/a/14166194/880703
export const uuid4RegExp = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$/i;

// https://stackoverflow.com/a/28022901/880703 + https://www.debuggex.com/r/bl8J35wMKk48a7u_
export const iso8601RegExp = /^(?:[1-9]\d{3}(-?)(?:(?:0[1-9]|1[0-2])\1(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])\1(?:29|30)|(?:0[13578]|1[02])(?:\1)31|00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[0-5]))|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)(?:(-?)02(?:\2)29|-?366))T(?:[01]\d|2[0-3])(:?)[0-5]\d(?:\3[0-5]\d)?(?:Z|[+-][01]\d(?:\3[0-5]\d)?)$/;
