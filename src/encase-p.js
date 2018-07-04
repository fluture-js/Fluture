import {Core} from './core';
import {noop, show, showf, partial1} from './internal/fn';
import {isThenable, isFunction} from './internal/is';
import {typeError} from './internal/error';
import {throwInvalidArgument} from './internal/throw';

function invalidPromise(p, f, a){
  return typeError(
    'Future.encaseP expects the function it\'s given to return a Promise/Thenable'
    + '\n  Actual: ' + (show(p)) + '\n  From calling: ' + (showf(f))
    + '\n  With: ' + (show(a))
  );
}

export function EncaseP(fn, a){
  this._fn = fn;
  this._a = a;
}

EncaseP.prototype = Object.create(Core);

EncaseP.prototype._interpret = function EncaseP$interpret(rec, rej, res){
  var open = true, fn = this._fn, a = this._a, p;
  try{
    p = fn(a);
  }catch(e){
    rec(e);
    return noop;
  }
  if(!isThenable(p)){
    rec(invalidPromise(p, fn, a));
    return noop;
  }
  p.then(function EncaseP$res(x){
    if(open){
      open = false;
      res(x);
    }
  }, function EncaseP$rej(x){
    if(open){
      open = false;
      rej(x);
    }
  });
  return function EncaseP$cancel(){ open = false };
};

EncaseP.prototype.toString = function EncaseP$toString(){
  return 'Future.encaseP(' + showf(this._fn) + ', ' + show(this._a) + ')';
};

export function encaseP(f, x){
  if(!isFunction(f)) throwInvalidArgument('Future.encaseP', 0, 'be a function', f);
  if(arguments.length === 1) return partial1(encaseP, f);
  return new EncaseP(f, x);
}
