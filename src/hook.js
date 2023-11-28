import {noop, show, raise} from './internal/utils.js';
import {invalidFuture, wrapException} from './internal/error.js';
import {createInterpreter, isFuture, application1, application, func, future} from './future.js';

function invalidDisposal(m, f, x){
  return invalidFuture(
    'hook() expects the return value from the first function it\'s given', m,
    '\n  From calling: ' + show(f) + '\n  With: ' + show(x)
  );
}

function invalidConsumption(m, f, x){
  return invalidFuture(
    'hook() expects the return value from the second function it\'s given', m,
    '\n  From calling: ' + show(f) + '\n  With: ' + show(x)
  );
}

export var Hook = createInterpreter(3, 'hook', function Hook$interpret(rec, rej, res){
  var _this = this, _acquire = this.$1, _dispose = this.$2, _consume = this.$3;
  var cancel, cancelConsume = noop, resource, value, cont = noop;

  function Hook$done(){
    cont(value);
  }

  function Hook$rec(x){
    rec(wrapException(x, _this));
  }

  function Hook$dispose(){
    var disposal;
    try{
      disposal = _dispose(resource);
    }catch(e){
      return Hook$rec(e);
    }
    if(!isFuture(disposal)){
      return Hook$rec(invalidDisposal(disposal, _dispose, resource));
    }
    cancel = Hook$cancelDisposal;
    disposal._interpret(Hook$rec, Hook$disposalRejected, Hook$done);
  }

  function Hook$cancelConsumption(){
    cancelConsume();
    Hook$dispose();
    Hook$cancelDisposal();
  }

  function Hook$cancelDisposal(){
    cont = noop;
  }

  function Hook$disposalRejected(x){
    Hook$rec(new Error('The disposal Future rejected with ' + show(x)));
  }

  function Hook$consumptionException(x){
    cont = Hook$rec;
    value = x;
    Hook$dispose();
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

  var cancelAcquire = _acquire._interpret(Hook$rec, rej, Hook$consume);
  cancel = cancel || cancelAcquire;

  return function Hook$fork$cancel(){
    rec = raise;
    cancel();
  };
});

export function hook(acquire){
  var context1 = application1(hook, future, arguments);
  return function hook(dispose){
    var context2 = application(2, hook, func, arguments, context1);
    return function hook(consume){
      var context3 = application(3, hook, func, arguments, context2);
      return new Hook(context3, acquire, dispose, consume);
    };
  };
}
