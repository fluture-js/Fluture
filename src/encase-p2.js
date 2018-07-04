import {Core} from './core';
import {noop, show, showf, partial1, partial2} from './internal/fn';
import {isThenable, isFunction} from './internal/is';
import {typeError} from './internal/error';
import {throwInvalidArgument} from './internal/throw';

function invalidPromise(p, f, a, b){
  return typeError(
    'Future.encaseP2 expects the function it\'s given to return a Promise/Thenable'
    + '\n  Actual: ' + (show(p)) + '\n  From calling: ' + (showf(f))
    + '\n  With 1: ' + (show(a))
    + '\n  With 2: ' + (show(b))
  );
}

export function EncaseP2(fn, a, b){
  this._fn = fn;
  this._a = a;
  this._b = b;
}

EncaseP2.prototype = Object.create(Core);

EncaseP2.prototype._interpret = function EncaseP2$interpret(rec, rej, res){
  var open = true, fn = this._fn, a = this._a, b = this._b, p;
  try{
    p = fn(a, b);
  }catch(e){
    rec(e);
    return noop;
  }
  if(!isThenable(p)){
    rec(invalidPromise(p, fn, a, b));
    return noop;
  }
  p.then(function EncaseP2$res(x){
    if(open){
      open = false;
      res(x);
    }
  }, function EncaseP2$rej(x){
    if(open){
      open = false;
      rej(x);
    }
  });
  return function EncaseP2$cancel(){ open = false };
};

EncaseP2.prototype.toString = function EncaseP2$toString(){
  return 'Future.encaseP2(' + showf(this._fn) + ', ' + show(this._a) + ', ' + show(this._b) + ')';
};

export function encaseP2(f, x, y){
  if(!isFunction(f)) throwInvalidArgument('Future.encaseP2', 0, 'be a function', f);

  switch(arguments.length){
    case 1: return partial1(encaseP2, f);
    case 2: return partial2(encaseP2, f, x);
    default: return new EncaseP2(f, x, y);
  }
}
