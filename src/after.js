import {Sequence, Core, isRejected, isResolved, isNever, never, RaceAction} from './core';
import {show, partial1} from './internal/fn';
import {isUnsigned} from './internal/is';
import {invalidArgument} from './internal/throw';

export function After(time, value){
  this._time = time;
  this._value = value;
}

After.prototype = Object.create(Core.prototype);

After.prototype.race = function After$race(other){
  return isRejected(other) ? other
       : isResolved(other) ? other
       : isNever(other) ? this
       : other instanceof After ? other._time < this._time ? other : this
       : new Sequence(this, [new RaceAction(other)]);
};

After.prototype._fork = function After$_fork(rej, res){
  const id = setTimeout(res, this._time, this._value);
  return () => { clearTimeout(id) };
};

After.prototype.extractRight = function After$extractRight(){
  return [this._value];
};

After.prototype.toString = function After$toString(){
  return `Future.after(${show(this._time)}, ${show(this._value)})`;
};

function Future$after$n(n, x){
  return n === Infinity ? never : new After(n, x);
}

export function after(n, x){
  if(!isUnsigned(n)) invalidArgument('Future.after', 0, 'be a positive integer', n);
  if(arguments.length === 1) return partial1(Future$after$n, n);
  return Future$after$n(n, x);
}