import {Core} from './core';
import {show, showf, partial1, partial2, partial3, noop} from './internal/fn';
import {isFunction} from './internal/is';
import {throwInvalidArgument} from './internal/throw';

export function EncaseN3(fn, a, b, c){
  this._fn = fn;
  this._a = a;
  this._b = b;
  this._c = c;
}

EncaseN3.prototype = Object.create(Core);

EncaseN3.prototype._interpret = function EncaseN3$interpret(rec, rej, res){
  var open = false, cont = function(){ open = true };
  try{
    this._fn(this._a, this._b, this._c, function EncaseN3$done(err, val){
      cont = err ? function EncaseN3$rej(){
        open = false;
        rej(err);
      } : function EncaseN3$res(){
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
  return function EncaseN3$cancel(){ open = false };
};

EncaseN3.prototype.toString = function EncaseN3$toString(){
  return 'Future.encaseN3('
       + showf(this._fn)
       + ', '
       + show(this._a)
       + ', '
       + show(this._b)
       + ', '
       + show(this._c)
       + ')';
};

export function encaseN3(f, x, y, z){
  if(!isFunction(f)) throwInvalidArgument('Future.encaseN3', 0, 'be a function', f);

  switch(arguments.length){
    case 1: return partial1(encaseN3, f);
    case 2: return partial2(encaseN3, f, x);
    case 3: return partial3(encaseN3, f, x, y);
    default: return new EncaseN3(f, x, y, z);
  }
}
