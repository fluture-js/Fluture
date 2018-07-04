import {Core} from './core';
import {showf, noop} from './internal/fn';
import {isFunction} from './internal/is';
import {throwInvalidArgument} from './internal/throw';

export function Node(fn){
  this._fn = fn;
}

Node.prototype = Object.create(Core);

Node.prototype._interpret = function Node$interpret(rec, rej, res){
  var open = false, cont = function(){ open = true };
  try{
    this._fn(function Node$done(err, val){
      cont = err ? function Node$rej(){
        open = false;
        rej(err);
      } : function Node$res(){
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
  return function Node$cancel(){ open = false };
};

Node.prototype.toString = function Node$toString(){
  return 'Future.node(' + showf(this._fn) + ')';
};

export function node(f){
  if(!isFunction(f)) throwInvalidArgument('Future.node', 0, 'be a function', f);
  return new Node(f);
}
