import type from 'sanctuary-type-identifiers';

export var parseType = type.parse;

export {type};

// Copyright (c) 2017 Sanctuary
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
var $$type = '@@type';
export function legacyType(x){
  return x != null &&
         x.constructor != null &&
         x.constructor.prototype !== x &&
         typeof x.constructor[$$type] === 'string' ?
    x.constructor[$$type] :
    Object.prototype.toString.call(x).slice('[object '.length, -']'.length);
}
// End copyright
