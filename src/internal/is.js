export const isFunction = f => typeof f === 'function';
export const isThenable = m => m instanceof Promise || Boolean(m) && isFunction(m.then);
export const isBoolean = f => typeof f === 'boolean';
export const isNumber = f => typeof f === 'number';
export const isUnsigned = n => (n === Infinity || isNumber(n) && n > 0 && n % 1 === 0);
export const isObject = o => o !== null && typeof o === 'object';
export const isIterator = i => isObject(i) && isFunction(i.next);
export const isArray = Array.isArray;
export const isStream = s => isObject(s) && typeof s.pipe === 'function';
