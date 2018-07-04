import {Core} from './core';
import {show, showf, partial1, partial2, noop} from './internal/fn';
import {isFunction} from './internal/is';
import {throwInvalidArgument} from './internal/throw';

export function EncaseN2(fn, a, b){
  this._fn = fn;
  this._a = a;
  this._b = b;
}

EncaseN2.prototype = Object.create(Core);

EncaseN2.prototype._interpret = function EncaseN2$interpret(rec, rej, res){
  var open = false, cont = function(){ open = true };
  try{
    this._fn(this._a, this._b, function EncaseN2$done(err, val){
      cont = err ? function EncaseN2$rej(){
        open = false;
        rej(err);
      } : function EncaseN2$res(){
        open = false;
        res(val);
      };
      if(open){
        cont();
      }
    });
  }catch(e){
    rec(e);
    open = false;
    return noop;
  }
  cont();
  return function EncaseN2$cancel(){ open = false };
};

EncaseN2.prototype.toString = function EncaseN2$toString(){
  return 'Future.encaseN2(' + showf(this._fn) + ', ' + show(this._a) + ', ' + show(this._b) + ')';
};

export function encaseN2(f, x, y){
  if(!isFunction(f)) throwInvalidArgument('Future.encaseN2', 0, 'be a function', f);

  switch(arguments.length){
    case 1: return partial1(encaseN2, f);
    case 2: return partial2(encaseN2, f, x);
    default: return new EncaseN2(f, x, y);
  }
}
