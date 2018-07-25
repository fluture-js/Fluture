import {show, showf, noop, moop, raise} from './internal/fn';
import {isFunction} from './internal/is';
import {FL, $$type} from './internal/const';
import interpret from './internal/interpreter';
import {nil, cons} from './internal/list';
import type from 'sanctuary-type-identifiers';
import {error, typeError, invalidFuture, valueToError} from './internal/error';
import {throwInvalidArgument, throwInvalidContext, throwInvalidFuture} from './internal/throw';

function Future$value$rej(x){
  raise(error(
    'Future#value was called on a rejected Future\n' +
    '  Actual: Future.reject(' + show(x) + ')'
  ));
}

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

Future.prototype.ap = function Future$ap(other){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  if(!isFuture(other)) throwInvalidFuture('Future#ap', 0, other);
  return this._ap(other);
};

Future.prototype.map = function Future$map(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#map', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#map', 0, 'to be a Function', mapper);
  return this._map(mapper);
};

Future.prototype.bimap = function Future$bimap(lmapper, rmapper){
  if(!isFuture(this)) throwInvalidContext('Future#bimap', this);
  if(!isFunction(lmapper)) throwInvalidArgument('Future#bimap', 0, 'to be a Function', lmapper);
  if(!isFunction(rmapper)) throwInvalidArgument('Future#bimap', 1, 'to be a Function', rmapper);
  return this._bimap(lmapper, rmapper);
};

Future.prototype.chain = function Future$chain(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#chain', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#chain', 0, 'to be a Function', mapper);
  return this._chain(mapper);
};

Future.prototype.mapRej = function Future$mapRej(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#mapRej', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#mapRej', 0, 'to be a Function', mapper);
  return this._mapRej(mapper);
};

Future.prototype.chainRej = function Future$chainRej(mapper){
  if(!isFuture(this)) throwInvalidContext('Future#chainRej', this);
  if(!isFunction(mapper)) throwInvalidArgument('Future#chainRej', 0, 'to be a Function', mapper);
  return this._chainRej(mapper);
};

Future.prototype.race = function Future$race(other){
  if(!isFuture(this)) throwInvalidContext('Future#race', this);
  if(!isFuture(other)) throwInvalidFuture('Future#race', 0, other);
  return this._race(other);
};

Future.prototype.both = function Future$both(other){
  if(!isFuture(this)) throwInvalidContext('Future#both', this);
  if(!isFuture(other)) throwInvalidFuture('Future#both', 0, other);
  return this._both(other);
};

Future.prototype.and = function Future$and(other){
  if(!isFuture(this)) throwInvalidContext('Future#and', this);
  if(!isFuture(other)) throwInvalidFuture('Future#and', 0, other);
  return this._and(other);
};

Future.prototype.or = function Future$or(other){
  if(!isFuture(this)) throwInvalidContext('Future#or', this);
  if(!isFuture(other)) throwInvalidFuture('Future#or', 0, other);
  return this._or(other);
};

Future.prototype.swap = function Future$swap(){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  return this._swap();
};

Future.prototype.fold = function Future$fold(lmapper, rmapper){
  if(!isFuture(this)) throwInvalidContext('Future#ap', this);
  if(!isFunction(lmapper)) throwInvalidArgument('Future#fold', 0, 'to be a Function', lmapper);
  if(!isFunction(rmapper)) throwInvalidArgument('Future#fold', 1, 'to be a Function', rmapper);
  return this._fold(lmapper, rmapper);
};

Future.prototype.finally = function Future$finally(other){
  if(!isFuture(this)) throwInvalidContext('Future#finally', this);
  if(!isFuture(other)) throwInvalidFuture('Future#finally', 0, other);
  return this._finally(other);
};

Future.prototype.lastly = function Future$lastly(other){
  if(!isFuture(this)) throwInvalidContext('Future#lastly', this);
  if(!isFuture(other)) throwInvalidFuture('Future#lastly', 0, other);
  return this._finally(other);
};

Future.prototype.fork = function Future$fork(rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 1, 'to be a Function', res);
  return this._interpret(Future$onCrash, rej, res);
};

Future.prototype.forkCatch = function Future$fork(rec, rej, res){
  if(!isFuture(this)) throwInvalidContext('Future#fork', this);
  if(!isFunction(rec)) throwInvalidArgument('Future#fork', 0, 'to be a Function', rec);
  if(!isFunction(rej)) throwInvalidArgument('Future#fork', 1, 'to be a Function', rej);
  if(!isFunction(res)) throwInvalidArgument('Future#fork', 2, 'to be a Function', res);
  return this._interpret(rec, rej, res);
};

Future.prototype.value = function Future$value(res){
  if(!isFuture(this)) throwInvalidContext('Future#value', this);
  if(!isFunction(res)) throwInvalidArgument('Future#value', 0, 'to be a Function', res);
  return this._interpret(Future$onCrash, Future$value$rej, res);
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

Future.prototype.isRejected = function Future$isRejected(){
  return false;
};

Future.prototype.isResolved = function Future$isResolved(){
  return false;
};

Future.prototype.isSettled = function Future$isSettled(){
  return this.isRejected() || this.isResolved();
};

Future.prototype.extractLeft = function Future$extractLeft(){
  return [];
};

Future.prototype.extractRight = function Future$extractRight(){
  return [];
};

export var Core = Object.create(Future.prototype);

Core._ap = function Core$ap(other){
  return new Sequence(this)._ap(other);
};

Core._parallelAp = function Core$parallelAp(other){
  return new Sequence(this)._parallelAp(other);
};

Core._map = function Core$map(mapper){
  return new Sequence(this)._map(mapper);
};

Core._bimap = function Core$bimap(lmapper, rmapper){
  return new Sequence(this)._bimap(lmapper, rmapper);
};

Core._chain = function Core$chain(mapper){
  return new Sequence(this)._chain(mapper);
};

Core._mapRej = function Core$mapRej(mapper){
  return new Sequence(this)._mapRej(mapper);
};

Core._chainRej = function Core$chainRej(mapper){
  return new Sequence(this)._chainRej(mapper);
};

Core._race = function Core$race(other){
  return new Sequence(this)._race(other);
};

Core._both = function Core$both(other){
  return new Sequence(this)._both(other);
};

Core._and = function Core$and(other){
  return new Sequence(this)._and(other);
};

Core._or = function Core$or(other){
  return new Sequence(this)._or(other);
};

Core._swap = function Core$swap(){
  return new Sequence(this)._swap();
};

Core._fold = function Core$fold(lmapper, rmapper){
  return new Sequence(this)._fold(lmapper, rmapper);
};

Core._finally = function Core$finally(other){
  return new Sequence(this)._finally(other);
};

export function Computation(computation){
  this._computation = computation;
}

Computation.prototype = Object.create(Core);

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

export function Rejected(value){
  this._value = value;
}

Rejected.prototype = Object.create(Core);

Rejected.prototype._ap = moop;
Rejected.prototype._parallelAp = moop;
Rejected.prototype._map = moop;
Rejected.prototype._chain = moop;
Rejected.prototype._race = moop;
Rejected.prototype._both = moop;
Rejected.prototype._and = moop;

Rejected.prototype._or = function Rejected$or(other){
  return other;
};

Rejected.prototype._finally = function Rejected$finally(other){
  return other._and(this);
};

Rejected.prototype._swap = function Rejected$swap(){
  return new Resolved(this._value);
};

Rejected.prototype._interpret = function Rejected$interpret(rec, rej){
  rej(this._value);
  return noop;
};

Rejected.prototype.isRejected = function Rejected$isRejected(){
  return true;
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

Resolved.prototype = Object.create(Core);

Resolved.prototype._race = moop;
Resolved.prototype._mapRej = moop;
Resolved.prototype._or = moop;

Resolved.prototype._and = function Resolved$and(other){
  return other;
};

Resolved.prototype._both = function Resolved$both(other){
  var left = this._value;
  return other._map(function Resolved$both$mapper(right){
    return [left, right];
  });
};

Resolved.prototype._swap = function Resolved$swap(){
  return new Rejected(this._value);
};

Resolved.prototype._finally = function Resolved$finally(other){
  var value = this._value;
  return other._map(function Resolved$finally$mapper(){
    return value;
  });
};

Resolved.prototype._interpret = function Resolved$interpret(rec, rej, res){
  res(this._value);
  return noop;
};

Resolved.prototype.isResolved = function Resolved$isResolved(){
  return true;
};

Resolved.prototype.extractRight = function Resolved$extractRight(){
  return [this._value];
};

Resolved.prototype.toString = function Resolved$toString(){
  return 'Future.of(' + show(this._value) + ')';
};

export function of(x){
  return new Resolved(x);
}

function Never(){
  this._isNever = true;
}

Never.prototype = Object.create(Future.prototype);

Never.prototype._ap = moop;
Never.prototype._parallelAp = moop;
Never.prototype._map = moop;
Never.prototype._bimap = moop;
Never.prototype._chain = moop;
Never.prototype._mapRej = moop;
Never.prototype._chainRej = moop;
Never.prototype._both = moop;
Never.prototype._or = moop;
Never.prototype._swap = moop;
Never.prototype._fold = moop;
Never.prototype._finally = moop;

Never.prototype._race = function Never$race(other){
  return other;
};

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

export function Crashed(error){
  this._error = error;
}

Crashed.prototype = Object.create(Future.prototype);

Crashed.prototype._ap = moop;
Crashed.prototype._parallelAp = moop;
Crashed.prototype._map = moop;
Crashed.prototype._bimap = moop;
Crashed.prototype._chain = moop;
Crashed.prototype._mapRej = moop;
Crashed.prototype._chainRej = moop;
Crashed.prototype._both = moop;
Crashed.prototype._or = moop;
Crashed.prototype._swap = moop;
Crashed.prototype._fold = moop;
Crashed.prototype._finally = moop;
Crashed.prototype._race = moop;

Crashed.prototype._interpret = function Crashed$interpret(rec){
  rec(this._error);
  return noop;
};

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

Eager.prototype = Object.create(Core);

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
  run: function Action$run(){ return this },
  cancel: function Action$cancel(){}
};

export function ApAction(other){ this.other = other }
ApAction.prototype = Object.create(Action);

ApAction.prototype.resolved = function ApAction$resolved(f){
  return isFunction(f) ?
         this.other._map(function ApAction$resolved$mapper(x){ return f(x) }) :
         new Crashed(typeError(
           'Future#ap expects its first argument to be a Future of a Function'
           + '\n  Actual: Future.of(' + show(f) + ')'
         ));
};

ApAction.prototype.toString = function ApAction$toString(){
  return 'ap(' + this.other.toString() + ')';
};

export function MapAction(mapper){ this.mapper = mapper }
MapAction.prototype = Object.create(Action);

MapAction.prototype.resolved = function MapAction$resolved(x){
  var m;
  try{ m = new Resolved(this.mapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

MapAction.prototype.toString = function MapAction$toString(){
  return 'map(' + showf(this.mapper) + ')';
};

export function BimapAction(lmapper, rmapper){ this.lmapper = lmapper; this.rmapper = rmapper }
BimapAction.prototype = Object.create(Action);

BimapAction.prototype.rejected = function BimapAction$rejected(x){
  var m;
  try{ m = new Rejected(this.lmapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

BimapAction.prototype.resolved = function BimapAction$resolved(x){
  var m;
  try{ m = new Resolved(this.rmapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

BimapAction.prototype.toString = function BimapAction$toString(){
  return 'bimap(' + showf(this.lmapper) + ', ' + showf(this.rmapper) + ')';
};

export function ChainAction(mapper){ this.mapper = mapper }
ChainAction.prototype = Object.create(Action);

ChainAction.prototype.resolved = function ChainAction$resolved(x){
  var m;
  try{ m = this.mapper(x) }catch(e){ return new Crashed(e) }
  return isFuture(m) ? m : new Crashed(invalidFuture(
    'Future#chain',
    'the function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(this.mapper) + '\n  With: ' + show(x)
  ));
};

ChainAction.prototype.toString = function ChainAction$toString(){
  return 'chain(' + showf(this.mapper) + ')';
};

export function MapRejAction(mapper){ this.mapper = mapper }
MapRejAction.prototype = Object.create(Action);

MapRejAction.prototype.rejected = function MapRejAction$rejected(x){
  var m;
  try{ m = new Rejected(this.mapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

MapRejAction.prototype.toString = function MapRejAction$toString(){
  return 'mapRej(' + showf(this.mapper) + ')';
};

export function ChainRejAction(mapper){ this.mapper = mapper }
ChainRejAction.prototype = Object.create(Action);

ChainRejAction.prototype.rejected = function ChainRejAction$rejected(x){
  var m;
  try{ m = this.mapper(x) }catch(e){ return new Crashed(e) }
  return isFuture(m) ? m : new Crashed(invalidFuture(
    'Future#chainRej',
    'the function it\'s given to return a Future',
    m,
    '\n  From calling: ' + showf(this.mapper) + '\n  With: ' + show(x)
  ));
};

ChainRejAction.prototype.toString = function ChainRejAction$toString(){
  return 'chainRej(' + showf(this.mapper) + ')';
};

export function SwapAction(){}
SwapAction.prototype = Object.create(Action);

SwapAction.prototype.rejected = function SwapAction$rejected(x){
  return new Resolved(x);
};

SwapAction.prototype.resolved = function SwapAction$resolved(x){
  return new Rejected(x);
};

SwapAction.prototype.toString = function SwapAction$toString(){
  return 'swap()';
};

export function FoldAction(lmapper, rmapper){ this.lmapper = lmapper; this.rmapper = rmapper }
FoldAction.prototype = Object.create(Action);

FoldAction.prototype.rejected = function FoldAction$rejected(x){
  var m;
  try{ m = new Resolved(this.lmapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

FoldAction.prototype.resolved = function FoldAction$resolved(x){
  var m;
  try{ m = new Resolved(this.rmapper(x)) }catch(e){ m = new Crashed(e) }
  return m;
};

FoldAction.prototype.toString = function FoldAction$toString(){
  return 'fold(' + showf(this.lmapper) + ', ' + showf(this.rmapper) + ')';
};

export function FinallyAction(other){ this.other = other }
FinallyAction.prototype = Object.create(Action);

FinallyAction.prototype.rejected = function FinallyAction$rejected(x){
  return this.other._and(new Rejected(x));
};

FinallyAction.prototype.resolved = function FinallyAction$resolved(x){
  return this.other._map(function FoldAction$resolved$mapper(){ return x });
};

FinallyAction.prototype.cancel = function FinallyAction$cancel(){
  this.other._interpret(noop, noop, noop)();
};

FinallyAction.prototype.toString = function FinallyAction$toString(){
  return 'finally(' + this.other.toString() + ')';
};

export function AndAction(other){ this.other = other }
AndAction.prototype = Object.create(Action);

AndAction.prototype.resolved = function AndAction$resolved(){
  return this.other;
};

AndAction.prototype.toString = function AndAction$toString(){
  return 'and(' + this.other.toString() + ')';
};

export function OrAction(other){ this.other = other }
OrAction.prototype = Object.create(Action);

OrAction.prototype.rejected = function OrAction$rejected(){
  return this.other;
};

OrAction.prototype.toString = function OrAction$toString(){
  return 'or(' + this.other.toString() + ')';
};

export function ParallelApAction(other){ this.other = other }
ParallelApAction.prototype = Object.create(ApAction.prototype);

ParallelApAction.prototype.run = function ParallelApAction$run(early){
  return new ParallelApActionState(early, this.other);
};

ParallelApAction.prototype.toString = function ParallelApAction$toString(){
  return '_parallelAp(' + this.other.toString() + ')';
};

export function RaceAction(other){ this.other = other }
RaceAction.prototype = Object.create(Action);

RaceAction.prototype.run = function RaceAction$run(early){
  return new RaceActionState(early, new Eager(this.other));
};

RaceAction.prototype.toString = function RaceAction$toString(){
  return 'race(' + this.other.toString() + ')';
};

export function BothAction(other){ this.other = other }
BothAction.prototype = Object.create(Action);

BothAction.prototype.resolved = function BothAction$resolved(x){
  return this.other._map(function BothAction$resolved$mapper(y){ return [x, y] });
};

BothAction.prototype.run = function BothAction$run(early){
  return new BothActionState(early, new Eager(this.other));
};

BothAction.prototype.toString = function BothAction$toString(){
  return 'both(' + this.other.toString() + ')';
};

export function ParallelApActionState(early, other){
  var _this = this;
  _this.other = new Eager(other);
  _this.cancel = this.other._interpret(
    function ParallelApActionState$rec(x){ early(new Crashed(x), _this) },
    function ParallelApActionState$rej(x){ early(new Rejected(x), _this) },
    noop
  );
}

ParallelApActionState.prototype = Object.create(ParallelApAction.prototype);

export function RaceActionState(early, other){
  var _this = this;
  _this.other = other;
  _this.cancel = other._interpret(
    function RaceActionState$rec(x){ early(new Crashed(x), _this) },
    function RaceActionState$rej(x){ early(new Rejected(x), _this) },
    function RaceActionState$res(x){ early(new Resolved(x), _this) }
  );
}

RaceActionState.prototype = Object.create(RaceAction.prototype);

export function BothActionState(early, other){
  var _this = this;
  _this.other = other;
  _this.cancel = other._interpret(
    function BothActionState$rec(x){ early(new Crashed(x), _this) },
    function BothActionState$rej(x){ early(new Rejected(x), _this) },
    noop
  );
}

BothActionState.prototype = Object.create(BothAction.prototype);

export function Sequence(spawn, actions){
  this._spawn = spawn;
  this._actions = actions || nil;
}

Sequence.prototype = Object.create(Future.prototype);

Sequence.prototype._transform = function Sequence$_transform(action){
  return new Sequence(this._spawn, cons(action, this._actions));
};

Sequence.prototype._ap = function Sequence$ap(other){
  return this._transform(new ApAction(other));
};

Sequence.prototype._parallelAp = function Sequence$pap(other){
  return this._transform(new ParallelApAction(other));
};

Sequence.prototype._map = function Sequence$map(mapper){
  return this._transform(new MapAction(mapper));
};

Sequence.prototype._bimap = function Sequence$bimap(lmapper, rmapper){
  return this._transform(new BimapAction(lmapper, rmapper));
};

Sequence.prototype._chain = function Sequence$chain(mapper){
  return this._transform(new ChainAction(mapper));
};

Sequence.prototype._mapRej = function Sequence$mapRej(mapper){
  return this._transform(new MapRejAction(mapper));
};

Sequence.prototype._chainRej = function Sequence$chainRej(mapper){
  return this._transform(new ChainRejAction(mapper));
};

Sequence.prototype._race = function Sequence$race(other){
  return isNever(other) ? this : this._transform(new RaceAction(other));
};

Sequence.prototype._both = function Sequence$both(other){
  return this._transform(new BothAction(other));
};

Sequence.prototype._and = function Sequence$and(other){
  return this._transform(new AndAction(other));
};

Sequence.prototype._or = function Sequence$or(other){
  return this._transform(new OrAction(other));
};

Sequence.prototype._swap = function Sequence$swap(){
  return this._transform(new SwapAction);
};

Sequence.prototype._fold = function Sequence$fold(lmapper, rmapper){
  return this._transform(new FoldAction(lmapper, rmapper));
};

Sequence.prototype._finally = function Sequence$finally(other){
  return this._transform(new FinallyAction(other));
};

Sequence.prototype._interpret = function Sequence$interpret(rec, rej, res){
  return interpret(this, rec, rej, res);
};

Sequence.prototype.toString = function Sequence$toString(){
  var str = '', tail = this._actions;

  while(tail !== nil){
    str = '.' + tail.head.toString() + str;
    tail = tail.tail;
  }

  return this._spawn.toString() + str;
};
