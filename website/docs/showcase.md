```ts twoslash
declare const value: unknown;
declare const server: import('http').Server;
// ---cut---
import * as t from 'typanion';

const isPort = t.cascade(t.isNumber(), [
    t.isInteger(),
    t.isInInclusiveRange(1, 65535),
]);

if (isPort(value)) {
    server.listen(value);
}
```
