/* eslint consistent-return: 0 */

import {typeError, invalidFuture, invalidArgument, wrapException} from './internal/error.js';
import {isIteration} from './internal/iteration.js';
import {isIterator} from './internal/predicates.js';
import {Undetermined, Synchronous, Asynchronous} from './internal/timing.js';
import {show, noop} from './internal/utils.js';
import {createInterpreter, isFuture, application1, func} from './future.js';

export function invalidIteration(o){
  return typeError(
    'The iterator did not return a valid iteration from iterator.next()\n' +
    '  Actual: ' + show(o)
  );
}

export function invalidState(x){
  return invalidFuture(
    'go() expects the value produced by the iterator', x,
    '\n  Tip: If you\'re using a generator, make sure you always yield a Future'
  );
}

export var Go = createInterpreter(1, 'go', function Go$interpret(rec, rej, res){
  var _this = this, timing = Undetermined, cancel = noop, state, value, iterator;

  function crash(e){
    rec(wrapException(e, _this));
  }

  try{
    iterator = _this.$1();
  }catch(e){
    crash(e);
    return noop;
  }

  if(!isIterator(iterator)){
    crash(invalidArgument('go', 0, 'return an iterator, maybe you forgot the "*"', iterator));
    return noop;
  }

  function resolved(x){
    value = x;
    if(timing === Asynchronous) return drain();
    timing = Synchronous;
  }

  function drain(){
    // eslint-disable-next-line no-constant-condition
    while(true){
      try{
        state = iterator.next(value);
      }catch(e){
        return crash(e);
      }
      if(!isIteration(state)) return crash(invalidIteration(state));
      if(state.done) break;
      if(!isFuture(state.value)) return crash(invalidState(state.value));
      timing = Undetermined;
      cancel = state.value._interpret(crash, rej, resolved);
      if(timing === Undetermined) return (timing = Asynchronous);
    }
    res(state.value);
  }

  drain();

  return function Go$cancel(){ cancel() };
});

export function go(generator){
  return new Go(application1(go, func, arguments), generator);
}
