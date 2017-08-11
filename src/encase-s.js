import {Core} from './core';
import {noop, show, showf} from './internal/fn';
import {isStream, isFunction} from './internal/is';
import {invalidArgument, typeError} from './internal/throw';
import concat from 'concat-stream';

function check$stream(s, f){
  return isStream(s) ? true : typeError(
    'Future.encaseS expects the function it\'s given to return a Stream'
    + `\n  Actual: ${show(s)}\n  From calling: ${showf(f)}`
  );
}

export function EncaseS(fn){
  this._fn = fn;
}

EncaseS.prototype = Object.create(Core);

EncaseS.prototype._fork = function EncaseS$fork(rej, res){
  const {_fn} = this;
  check$stream(_fn(), _fn)._fn.pipe(concat(res)).on('error', rej);
  return noop;
};

EncaseS.prototype.toString = function EncaseS$toString(){
  const {_fn, _a} = this;
  return `Future.encaseS(${showf(_fn)}, ${show(_a)})`;
};

export function encaseS(f){
  if(!isFunction(f)) invalidArgument('Future.encaseS', 0, 'be a function', f);
  return new EncaseS(f);
}
