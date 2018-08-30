/*eslint no-cond-assign:0, no-constant-condition:0 */

import Denque from 'denque';
import {show, showf, noop, moop, raise} from './internal/utils';
import {isFunction} from './internal/predicates';
import {FL, $$type} from './internal/const';
import {nil, cons} from './internal/list';
import type from 'sanctuary-type-identifiers';
import {error, typeError, invalidFuture, valueToError} from './internal/error';
import {throwInvalidArgument, throwInvalidContext, throwInvalidFuture} from './internal/throw';

function Future$onCrash(x){
  raise(valueToError(x));
}

export function Future(computation){
  if(!isFunction(computation)) throwInvalidArgument('Future', 0, 'be a Function', computation);
  return new Computation(computation);
}

export function isFuture(x){
  return x instanceof Future || type(x) === $$type;
}

Future['@@type'] = $$type;

Future.prototype['@@show'] = function Future$show(){
  return this.toString();
};

Future.prototype[FL.ap] = function Future$FL$ap(other){
  return other._ap(this);
};

Future.prototype[FL.map] = function Future$FL$map(mapper){
  return this._map(mapper);
};

Future.prototype[FL.bimap] = function Future$FL$bimap(lmapper, rmapper){
  return this._bimap(lmapper, rmapper);
};

Future.prototype[FL.chain] = function Future$FL$chain(mapper){
  return this._chain(mapper);
};

Future.prototype.fork = function Future$fork(rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 1, 'to be a Function', res);
  return this._interpret(Future$onCrash, rej, res);
};

Future.prototype.forkCatch = function Future$forkCatch(rec, rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rec)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rec);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 1, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 2, 'to be a Function', res);
  return this._interpret(function Future$forkCatch$recover(x){ rec(valueToError(x)) }, rej, res);
};

Future.prototype.value = function Future$value(res){
  if(!isFuture(this)) throwInvalidContext('Future#value', this);
  if(!isFunction(res)) throwInvalidArgument('Future#value', 0, 'to be a Function', res);
  var _this = this;
  return _this._interpret(Future$onCrash, function Future$value$rej(x){
    raise(error(
      'Future#value was called on a rejected Future\n' +
      '  Rejection: ' + show(x) + '\n' +
      '  Future: ' + _this.toString()
    ));
  }, res);
};

Future.prototype.done = function Future$done(callback){
  if(!isFuture(this)) throwInvalidContext('Future#done', this);
  if(!isFunction(callback)) throwInvalidArgument('Future#done', 0, 'to be a Function', callback);
  return this._interpret(Future$onCrash,
                         function Future$done$rej(x){ callback(x) },
                         function Future$done$res(x){ callback(null, x) });
};

Future.prototype.promise = function Future$promise(){
  var _this = this;
  return new Promise(function Future$promise$computation(res, rej){
    _this._interpret(Future$onCrash, rej, res);
  });
};

Future.prototype.extractLeft = function Future$extractLeft(){
  return [];
};

Future.prototype.extractRight = function Future$extractRight(){
  return [];
};

Future.prototype._transform = function Future$transform(action){
  return new Transformation(this, cons(action, nil));
};

export function Computation(computation){
  this._computation = computation;
}

Computation.prototype = Object.create(Future.prototype);

Computation.prototype._interpret = function Computation$interpret(rec, rej, res){
  var open = false, cancel = noop, cont = function(){ open = true };
  try{
    cancel = this._computation(function Computation$rej(x){
      cont = function Computation$rej$cont(){
        open = false;
        rej(x);
      };
      if(open){
        cont();
      }
    }, function Computation$res(x){
      cont = function Computation$res$cont(){
        open = false;
        res(x);
      };
      if(open){
        cont();
      }
    }) || noop;
  }catch(e){
    open = false;
    rec(e);
    return noop;
  }
  if(!(isFunction(cancel) && cancel.length === 0)){
    rec(typeError(
      'The computation was expected to return a nullary function or void\n' +
      '  Actual: ' + show(cancel)
    ));
  }
  cont();
  return function Computation$cancel(){
    if(open){
      open = false;
      cancel && cancel();
    }
  };
};

Computation.prototype.toString = function Computation$toString(){
  return 'Future(' + showf(this._computation) + ')';
};

export function Transformation(spawn, actions){
  this._spawn = spawn;
  this._actions = actions;
}

Transformation.prototype = Object.create(Future.prototype);

Transformation.prototype._transform = function Transformation$_transform(action){
  return new Transformation(this._spawn, cons(action, this._actions));
};

Transformation.prototype._interpret = function Transformation$interpret(rec, rej, res){

  //This is the primary queue of actions. All actions in here will be "cold",
  //meaning they haven't had the chance yet to run concurrent computations.
  var queue = new Denque();

  //These combined variables define our current state.
  // future  = the future we are currently forking
  // action  = the action to be informed when the future settles
  // cancel  = the cancel function of the current future
  // settled = a boolean indicating whether a new tick should start
  // async   = a boolean indicating whether we are awaiting a result asynchronously
  var future, action, cancel = noop, stack = nil, settled, async = true, it;

  //Pushes a new action onto the stack. The stack is used to keep "hot"
  //actions. The last one added is the first one to process, because actions
  //are pushed right-to-left (see warmupActions).
  function pushStack(x){
    stack = cons(x, stack);
  }

  //Takes the leftmost action from the stack and returns it.
  function popStack(){
    var x = stack.head;
    stack = stack.tail;
    return x;
  }

  //This function is called with a future to use in the next tick.
  //Here we "flatten" the actions of another Sequence into our own actions,
  //this is the magic that allows for infinitely stack safe recursion because
  //actions like ChainAction will return a new Sequence.
  //If we settled asynchronously, we call drain() directly to run the next tick.
  function settle(m){
    settled = true;
    future = m;
    if(future._spawn){
      var tail = future._actions;
      while(tail !== nil){
        queue.unshift(tail.head);
        tail = tail.tail;
      }
      future = future._spawn;
    }
    if(async) drain();
  }

  //This function serves as a rejection handler for our current future.
  //It will tell the current action that the future rejected, and it will
  //settle the current tick with the action's answer to that.
  function rejected(x){
    settle(action.rejected(x));
  }

  //This function serves as a resolution handler for our current future.
  //It will tell the current action that the future resolved, and it will
  //settle the current tick with the action's answer to that.
  function resolved(x){
    settle(action.resolved(x));
  }

  //This function is passed into actions when they are "warmed up".
  //If the action decides that it has its result, without the need to await
  //anything else, then it can call this function to force "early termination".
  //When early termination occurs, all actions which were queued prior to the
  //terminator will be skipped. If they were already hot, they will also receive
  //a cancel signal so they can cancel their own concurrent computations, as
  //their results are no longer needed.
  function early(m, terminator){
    cancel();
    queue.clear();
    if(async && action !== terminator){
      action.cancel();
      while((it = popStack()) && it !== terminator) it.cancel();
    }
    settle(m);
  }

  //This will cancel the current Future, the current action, and all queued hot actions.
  function Sequence$cancel(){
    cancel();
    action && action.cancel();
    while(it = popStack()) it.cancel();
  }

  //This function is called when an exception is caught.
  function exception(e){
    Sequence$cancel();
    settled = true;
    queue.clear();
    future = never;
    rec(e);
  }

  //This function serves to kickstart concurrent computations.
  //Takes all actions from the cold queue *back-to-front*, and calls run() on
  //each of them, passing them the "early" function. If any of them settles (by
  //calling early()), we abort. After warming up all actions in the cold queue,
  //we warm up the current action as well.
  function warmupActions(){
    while(it = queue.pop()){
      it = it.run(early);
      if(settled) return;
      pushStack(it);
    }
    action = action.run(early);
  }

  //This function represents our main execution loop. By "tick", we've been
  //referring to the execution of one iteration in the while-loop below.
  function drain(){
    async = false;
    while(true){
      settled = false;
      if(action = queue.shift()){
        cancel = future._interpret(exception, rejected, resolved);
        if(!settled) warmupActions();
      }else if(action = popStack()){
        cancel = future._interpret(exception, rejected, resolved);
      }else break;
      if(settled) continue;
      async = true;
      return;
    }
    cancel = future._interpret(exception, rej, res);
  }

  //Start the execution loop.
  settle(this);

  //Return the cancellation function.
  return Sequence$cancel;

};

Transformation.prototype.toString = function Transformation$toString(){
  var str = '', tail = this._actions;

  while(tail !== nil){
    str = '.' + tail.head.toString() + str;
    tail = tail.tail;
  }

  return this._spawn.toString() + str;
};

export function Crashed(error){
  this._error = error;
}

Crashed.prototype = Object.create(Future.prototype);

Crashed.prototype._interpret = function Crashed$interpret(rec){
  rec(this._error);
  return noop;
};

Crashed.prototype.toString = function Crashed$toString(){
  return 'Future(function crash(){ throw ' + show(this._error) + ' })';
};

export function Rejected(value){
  this._value = value;
}

Rejected.prototype = Object.create(Future.prototype);

Rejected.prototype._interpret = function Rejected$interpret(rec, rej){
  rej(this._value);
  return noop;
};

Rejected.prototype.extractLeft = function Rejected$extractLeft(){
  return [this._value];
};

Rejected.prototype.toString = function Rejected$toString(){
  return 'Future.reject(' + show(this._value) + ')';
};

export function reject(x){
  return new Rejected(x);
}

export function Resolved(value){
  this._value = value;
}

Resolved.prototype = Object.create(Future.prototype);

Resolved.prototype._interpret = function Resolved$interpret(rec, rej, res){
  res(this._value);
  return noop;
};

Resolved.prototype.extractRight = function Resolved$extractRight(){
  return [this._value];
};

Resolved.prototype.toString = function Resolved$toString(){
  return 'Future.of(' + show(this._value) + ')';
};

export function resolve(x){
  return new Resolved(x);
}

function Never(){
  this._isNever = true;
}

Never.prototype = Object.create(Future.prototype);

Never.prototype._interpret = function Never$interpret(){
  return noop;
};

Never.prototype.toString = function Never$toString(){
  return 'Future.never';
};

export var never = new Never();

export function isNever(x){
  return isFuture(x) && x._isNever === true;
}

function Eager(future){
  var _this = this;
  _this.rec = noop;
  _this.rej = noop;
  _this.res = noop;
  _this.crashed = false;
  _this.rejected = false;
  _this.resolved = false;
  _this.value = null;
  _this.cancel = future._interpret(function Eager$crash(x){
    _this.value = x;
    _this.crashed = true;
    _this.cancel = noop;
    _this.rec(x);
  }, function Eager$reject(x){
    _this.value = x;
    _this.rejected = true;
    _this.cancel = noop;
    _this.rej(x);
  }, function Eager$resolve(x){
    _this.value = x;
    _this.resolved = true;
    _this.cancel = noop;
    _this.res(x);
  });
}

Eager.prototype = Object.create(Future.prototype);

Eager.prototype._interpret = function Eager$interpret(rec, rej, res){
  if(this.crashed) rec(this.value);
  else if(this.rejected) rej(this.value);
  else if(this.resolved) res(this.value);
  else{
    this.rec = rec;
    this.rej = rej;
    this.res = res;
  }
  return this.cancel;
};

export var Action = {
  rejected: function Action$rejected(x){ this.cancel(); return new Rejected(x) },
  resolved: function Action$resolved(x){ this.cancel(); return new Resolved(x) },
  run: moop,
  cancel: noop
};

function nullaryActionToString(){
  return this.name + '()';
}

function defineNullaryAction(name, prototype){
  var _name = '_' + name;
  function NullaryAction(){}
  NullaryAction.prototype = Object.assign(Object.create(Action), prototype);
  NullaryAction.prototype.name = name;
  NullaryAction.prototype.toString = nullaryActionToString;
  Future.prototype[name] = function checkedNullaryTransformation(){
    if(!isFuture(this)) throwInvalidContext('Future#' + name, this);
    return this[_name]();
  };
  Future.prototype[_name] = function uncheckedNullaryTransformation(){
    return this._transform(new NullaryAction);
  };
  return NullaryAction;
}

function mapperActionToString(){
  return this.name + '(' + showf(this.mapper) + ')';
}

function defineMapperAction(name, prototype){
  var _name = '_' + name;
  function MapperAction(mapper){ this.mapper = mapper }
  MapperAction.prototype = Object.assign(Object.create(Action), prototype);
  MapperAction.prototype.name = name;
  MapperAction.prototype.toString = mapperActionToString;
  Future.prototype[name] = function checkedMapperTransformation(mapper){
    if(!isFuture(this)) throwInvalidContext('Future#' + name, this);
    if(!isFunction(mapper)) throwInvalidArgument('Future#' + name, 0, 'to be a Function', mapper);
    return this[_name](mapper);
  };
  Future.prototype[_name] = function uncheckedMapperTransformation(mapper){
    return this._transform(new MapperAction(mapper));
  };
  return MapperAction;
}

function bimapperActionToString(){
  return this.name + '(' + showf(this.lmapper) + ', ' + showf(this.rmapper) + ')';
}

function defineBimapperAction(name, prototype){
  var _name = '_' + name;
  function BimapperAction(lmapper, rmapper){ this.lmapper = lmapper; this.rmapper = rmapper }
  BimapperAction.prototype = Object.assign(Object.create(Action), prototype);
  BimapperAction.prototype.name = name;
  BimapperAction.prototype.toString = bimapperActionToString;
  Future.prototype[name] = function checkedBimapperTransformation(lm, rm){
    if(!isFuture(this)) throwInvalidContext('Future#' + name, this);
    if(!isFunction(lm)) throwInvalidArgument('Future#' + name, 0, 'to be a Function', lm);
    if(!isFunction(rm)) throwInvalidArgument('Future#' + name, 1, 'to be a Function', rm);
    return this[_name](lm, rm);
  };
  Future.prototype[_name] = function uncheckedBimapperTransformation(lm, rm){
    return this._transform(new BimapperAction(lm, rm));
  };
  return BimapperAction;
}

function otherActionToString(){
  return this.name + '(' + this.other.toString() + ')';
}

function defineOtherAction(name, prototype){
  var _name = '_' + name;
  function OtherAction(other){ this.other = other }
  OtherAction.prototype = Object.assign(Object.create(Action), prototype);
  OtherAction.prototype.name = name;
  OtherAction.prototype.toString = otherActionToString;
  Future.prototype[name] = function checkedOtherTransformation(other){
    if(!isFuture(this)) throwInvalidContext('Future#' + name, this);
    if(!isFuture(other)) throwInvalidFuture('Future#' + name, 0, other);
    return this[_name](other);
  };
  Future.prototype[_name] = function uncheckedOtherTransformation(other){
    return this._transform(new OtherAction(other));
  };
  return OtherAction;
}

function defineParallelAction(name, rec, rej, res, prototype){
  var ParallelAction = defineOtherAction(name, prototype);
  ParallelAction.prototype.run = function ParallelAction$run(early){
    var eager = new Eager(this.other);
    var action = new ParallelAction(eager);
    function ParallelAction$early(m){ early(m, action) }
    action.cancel = eager._interpret(
      function ParallelAction$rec(x){ rec(ParallelAction$early, x) },
      function ParallelAction$rej(x){ rej(ParallelAction$early, x) },
      function ParallelAction$res(x){ res(ParallelAction$early, x) }
    );
    return action;
  };
  return ParallelAction;
}

function apActionHandler(f){
  return isFunction(f) ?
         this.other._map(function ApAction$resolved$mapper(x){ return f(x) }) :
         new Crashed(typeError(
           'Future#' + this.name + ' expects its first argument to be a Future of a Function\n' +
           '  Actual: Future.of(' + show(f) + ')'
         ));
}

function chainActionHandler(x){
  var m;
  try{ m = this.mapper(x) }catch(e){ return new Crashed(e) }
  return isFuture(m) ? m : new Crashed(invalidFuture(
    'Future#' + this.name,
    'the function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(this.mapper) + '\n  With: ' + show(x)
  ));
}

function returnOther(){
  return this.other;
}

function mapWith(mapper, create, value){
  var m;
  try{ m = create(mapper(value)) }catch(e){ m = new Crashed(e) }
  return m;
}

function mapRight(value){
  return mapWith(this.rmapper, resolve, value);
}

function earlyCrash(early, x){
  early(new Crashed(x));
}

function earlyReject(early, x){
  early(new Rejected(x));
}

function earlyResolve(early, x){
  early(new Resolved(x));
}

defineOtherAction('ap', {
  resolved: apActionHandler
});

defineMapperAction('map', {
  resolved: function MapAction$resolved(x){ return mapWith(this.mapper, resolve, x) }
});

defineBimapperAction('bimap', {
  resolved: mapRight,
  rejected: function BimapAction$rejected(x){ return mapWith(this.lmapper, reject, x) }
});

defineMapperAction('chain', {
  resolved: chainActionHandler
});

defineMapperAction('mapRej', {
  rejected: function MapRejAction$rejected(x){ return mapWith(this.mapper, reject, x) }
});

defineMapperAction('chainRej', {
  rejected: chainActionHandler
});

defineNullaryAction('swap', {
  rejected: Action.resolved,
  resolved: Action.rejected
});

defineBimapperAction('fold', {
  resolved: mapRight,
  rejected: function FoldAction$rejected(x){ return mapWith(this.lmapper, resolve, x) }
});

defineOtherAction('assume', {
  rejected: returnOther,
  resolved: returnOther
});

defineOtherAction('and', {
  resolved: returnOther
});

defineOtherAction('or', {
  rejected: returnOther
});

defineParallelAction('_parallelAp', earlyCrash, earlyReject, noop, {
  resolved: apActionHandler
});

defineParallelAction('race', earlyCrash, earlyReject, earlyResolve, {});

defineParallelAction('both', earlyCrash, earlyReject, noop, {
  resolved: function BothAction$resolved(x){
    return this.other._map(function BothAction$resolved$mapper(y){ return [x, y] });
  }
});
