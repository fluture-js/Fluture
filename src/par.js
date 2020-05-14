import type from 'sanctuary-type-identifiers';

import {FL, namespace, version} from './internal/const.js';
import {invalidFutureArgument} from './internal/error.js';
import {captureContext} from './internal/debug.js';
import {nil} from './internal/list.js';

import {never, resolve, isFuture, MapTransformation} from './future.js';
import {ParallelApTransformation} from './pap.js';
import {RaceTransformation} from './race.js';

export function ConcurrentFuture (sequential){
  this.sequential = sequential;
}

ConcurrentFuture.prototype = Object.create(Par.prototype);

export function Par (sequential){
  if(!isFuture(sequential)) throw invalidFutureArgument(Par.name, 0, sequential);
  return new ConcurrentFuture(sequential);
}

var $$type = namespace + '/ConcurrentFuture@' + version;
var zeroInstance = new ConcurrentFuture(never);

// Compliance with sanctuary-type-identifiers versions 1 and 2.
// To prevent sanctuary-type-identifiers version 3 from identifying
// 'Par' as being of the type denoted by $$type, we ensure that
// Par.constructor.prototype is equal to Par.
Par['@@type'] = $$type;
Par.constructor = {prototype: Par};

Par[FL.of] = function Par$of(x){
  return new ConcurrentFuture(resolve(x));
};

Par[FL.zero] = function Par$zero(){
  return zeroInstance;
};

Par.prototype['@@type'] = $$type;

Par.prototype['@@show'] = function Par$show(){
  return this.toString();
};

Par.prototype.toString = function Par$toString(){
  return 'Par (' + this.sequential.toString() + ')';
};

Par.prototype[FL.map] = function Par$FL$map(f){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to map via ConcurrentFuture',
    Par$FL$map
  );
  return new ConcurrentFuture(this.sequential._transform(new MapTransformation(context, f)));
};

Par.prototype[FL.ap] = function Par$FL$ap(other){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to ap via ConcurrentFuture',
    Par$FL$ap
  );
  return new ConcurrentFuture(other.sequential._transform(
    new ParallelApTransformation(context, this.sequential)
  ));
};

Par.prototype[FL.alt] = function Par$FL$alt(other){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to alt via ConcurrentFuture',
    Par$FL$alt
  );
  return new ConcurrentFuture(other.sequential._transform(
    new RaceTransformation(context, this.sequential)
  ));
};

export function isParallel(x){
  return x instanceof ConcurrentFuture || type(x) === $$type;
}
