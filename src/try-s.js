import {Core} from './core';
import {noop, show, showf} from './internal/fn';
import {isStream, isFunction} from './internal/is';
import {invalidArgument, typeError} from './internal/throw';
import concat from 'concat-stream';

function check$stream(s, f){
  return isStream(s) ? s : typeError(
    'Future.tryS expects the function it\'s given to return a Stream'
    + `\n  Actual: ${show(s)}\n  From calling: ${showf(f)}`
  );
}

export function TryS(fn){
  this._fn = fn;
}

TryS.prototype = Object.create(Core);

TryS.prototype._fork = function TryS$fork(rej, res){
  const {_fn} = this;
  check$stream(_fn(), _fn).pipe(concat(res)).on('error', rej);
  return noop;
};

TryS.prototype.toString = function TryS$toString(){
  const {_fn} = this;
  return `Future.tryS(${show(_fn)})`;
};

export function tryS(f){
  if(!isFunction(f)) invalidArgument('Future.tryS', 0, 'be a function', f);
  return new TryS(f);
}
