import {wrapException, invalidArgumentOf} from './internal/error.js';
import {isArray} from './internal/predicates.js';
import {noop} from './internal/utils.js';
import {
  createInterpreter,
  isFuture,
  resolve,
  application1,
  positiveInteger,
  application,
} from './future.js';

function isFutureArray(xs){
  if(!isArray(xs)) return false;
  for(var i = 0; i < xs.length; i++){
    if(!isFuture(xs[i])) return false;
  }
  return true;
}

export var futureArray = {
  pred: isFutureArray,
  error: invalidArgumentOf('be an Array of valid Futures'),
};

export var Parallel = createInterpreter(2, 'parallel', function Parallel$interpret(rec, rej, res){
  var _this = this, futures = this.$2, length = futures.length;
  var max = Math.min(this.$1, length), cancels = new Array(length), out = new Array(length);
  var cursor = 0, running = 0, blocked = false, cont = noop;

  function Parallel$cancel(){
    rec = noop;
    rej = noop;
    res = noop;
    cursor = length;
    for(var n = 0; n < length; n++) cancels[n] && cancels[n]();
  }

  function Parallel$run(idx){
    running++;
    cancels[idx] = futures[idx]._interpret(function Parallel$rec(e){
      cont = rec;
      cancels[idx] = noop;
      Parallel$cancel();
      cont(wrapException(e, _this));
    }, function Parallel$rej(reason){
      cont = rej;
      cancels[idx] = noop;
      Parallel$cancel();
      cont(reason);
    }, function Parallel$res(value){
      cancels[idx] = noop;
      out[idx] = value;
      running--;
      if(cursor === length && running === 0) res(out);
      else if(blocked) Parallel$drain();
    });
  }

  function Parallel$drain(){
    blocked = false;
    while(cursor < length && running < max) Parallel$run(cursor++);
    blocked = true;
  }

  Parallel$drain();

  return Parallel$cancel;
});

var emptyArray = resolve([]);

export function parallel(max){
  var context1 = application1(parallel, positiveInteger, arguments);
  return function parallel(ms){
    var context2 = application(2, parallel, futureArray, arguments, context1);
    return ms.length === 0 ? emptyArray : new Parallel(context2, max, ms);
  };
}
