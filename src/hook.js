/* eslint no-param-reassign:0 */

import {Core, isFuture} from './core';
import {noop, show, showf, partial1, partial2} from './internal/fn';
import {isFunction} from './internal/is';
import {invalidFuture} from './internal/error';
import {throwInvalidArgument, throwInvalidFuture} from './internal/throw';

function invalidDisposal(m, f, x){
  return invalidFuture(
    'Future.hook',
    'the first function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(f) + '\n  With: ' + show(x)
  );
}

function invalidConsumption(m, f, x){
  return invalidFuture(
    'Future.hook',
    'the second function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(f) + '\n  With: ' + show(x)
  );
}

export function Hook(acquire, dispose, consume){
  this._acquire = acquire;
  this._dispose = dispose;
  this._consume = consume;
}

Hook.prototype = Object.create(Core);

Hook.prototype._interpret = function Hook$interpret(rec, rej, res){

  var _acquire = this._acquire, _dispose = this._dispose, _consume = this._consume;
  var cancel, cancelConsume = noop, resource, value, cont = noop;

  function Hook$done(){
    cont(value);
  }

  function Hook$reject(x){
    rej(x);
  }

  function Hook$consumptionException(e){
    var rec_ = rec;
    cont = noop;
    rej = noop;
    rec = noop;
    Hook$dispose();
    rec_(e);
  }

  function Hook$dispose(){
    var disposal;
    try{
      disposal = _dispose(resource);
    }catch(e){
      return rec(e);
    }
    if(!isFuture(disposal)){
      return rec(invalidDisposal(disposal, _dispose, resource));
    }
    disposal._interpret(rec, Hook$reject, Hook$done);
    cancel = Hook$cancelDisposal;
  }

  function Hook$cancelConsumption(){
    cancelConsume();
    Hook$dispose();
    Hook$cancelDisposal();
  }

  function Hook$cancelDisposal(){
    cont = noop;
    rec = noop;
    rej = noop;
  }

  function Hook$consumptionRejected(x){
    cont = rej;
    value = x;
    Hook$dispose();
  }

  function Hook$consumptionResolved(x){
    cont = res;
    value = x;
    Hook$dispose();
  }

  function Hook$consume(x){
    resource = x;
    var consumption;
    try{
      consumption = _consume(resource);
    }catch(e){
      return Hook$consumptionException(e);
    }
    if(!isFuture(consumption)){
      return Hook$consumptionException(invalidConsumption(consumption, _consume, resource));
    }
    cancel = Hook$cancelConsumption;
    cancelConsume = consumption._interpret(
      Hook$consumptionException,
      Hook$consumptionRejected,
      Hook$consumptionResolved
    );
  }

  var cancelAcquire = _acquire._interpret(rec, Hook$reject, Hook$consume);
  cancel = cancel || cancelAcquire;

  return function Hook$fork$cancel(){ cancel() };

};

Hook.prototype.toString = function Hook$toString(){
  return 'Future.hook('
       + this._acquire.toString()
       + ', '
       + showf(this._dispose)
       + ', '
       + showf(this._consume)
       + ')';
};

function hook$acquire$cleanup(acquire, cleanup, consume){
  if(!isFunction(consume)) throwInvalidArgument('Future.hook', 2, 'be a Future', consume);
  return new Hook(acquire, cleanup, consume);
}

function hook$acquire(acquire, cleanup, consume){
  if(!isFunction(cleanup)) throwInvalidArgument('Future.hook', 1, 'be a function', cleanup);
  if(arguments.length === 2) return partial2(hook$acquire$cleanup, acquire, cleanup);
  return hook$acquire$cleanup(acquire, cleanup, consume);
}

export function hook(acquire, cleanup, consume){
  if(!isFuture(acquire)) throwInvalidFuture('Future.hook', 0, acquire);
  if(arguments.length === 1) return partial1(hook$acquire, acquire);
  if(arguments.length === 2) return hook$acquire(acquire, cleanup);
  return hook$acquire(acquire, cleanup, consume);
}
