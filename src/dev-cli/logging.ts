import { inspect } from 'node:util';

export function logDeepObject(object: Record<any, any>) {
  console.log(inspect(object, { showHidden: false, depth: null, colors: true }));
}
