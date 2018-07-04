import {Core} from './core';
import {noop, show, showf} from './internal/fn';
import {isThenable, isFunction} from './internal/is';
import {typeError} from './internal/error';
import {throwInvalidArgument} from './internal/throw';

function invalidPromise(p, f){
  return typeError(
    'Future.tryP expects the function it\'s given to return a Promise/Thenable'
    + '\n  Actual: ' + show(p) + '\n  From calling: ' + showf(f)
  );
}

export function TryP(fn){
  this._fn = fn;
}

TryP.prototype = Object.create(Core);

TryP.prototype._interpret = function TryP$interpret(rec, rej, res){
  var open = true, fn = this._fn, p;
  try{
    p = fn();
  }catch(e){
    rec(e);
    return noop;
  }
  if(!isThenable(p)){
    rec(invalidPromise(p, fn));
    return noop;
  }
  p.then(function TryP$res(x){
    if(open){
      open = false;
      res(x);
    }
  }, function TryP$rej(x){
    if(open){
      open = false;
      rej(x);
    }
  });
  return function TryP$cancel(){ open = false };
};

TryP.prototype.toString = function TryP$toString(){
  return 'Future.tryP(' + show(this._fn) + ')';
};

export function tryP(f){
  if(!isFunction(f)) throwInvalidArgument('Future.tryP', 0, 'be a function', f);
  return new TryP(f);
}
