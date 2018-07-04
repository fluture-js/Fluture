import {Core} from './core';
import {show, showf, partial1, noop} from './internal/fn';
import {isFunction} from './internal/is';
import {throwInvalidArgument} from './internal/throw';

export function EncaseN(fn, a){
  this._fn = fn;
  this._a = a;
}

EncaseN.prototype = Object.create(Core);

EncaseN.prototype._interpret = function EncaseN$interpret(rec, rej, res){
  var open = false, cont = function(){ open = true };
  try{
    this._fn(this._a, function EncaseN$done(err, val){
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
  return function EncaseN$cancel(){ open = false };
};

EncaseN.prototype.toString = function EncaseN$toString(){
  return 'Future.encaseN(' + showf(this._fn) + ', ' + show(this._a) + ')';
};

export function encaseN(f, x){
  if(!isFunction(f)) throwInvalidArgument('Future.encaseN', 0, 'be a function', f);
  if(arguments.length === 1) return partial1(encaseN, f);
  return new EncaseN(f, x);
}
