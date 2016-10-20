////      ____ _         _
////     / ___| |       | |_
////    | |__ | | _   _ |  _\   _  ___  ___
////    |  __|| || | | || || | | ||  _// _ \
////    | |   | || |_| || || |_| || | |  __/
////    |_|   |_| \__,_||_| \__,_||_|  \___\
////
(function(global, f){

  'use strict';

  /*istanbul ignore next*/
  if(module && typeof module.exports !== 'undefined'){
    module.exports = f(require('inspect-f'));
  }

  else{
    global.Fluture = f(global.inspectf);
  }

}(/*istanbul ignore next*/(global || window || this), function(inspectf){

  'use strict';

  ///////////////////
  // Type checking //
  ///////////////////

  const TYPEOF_FUTURE = 'fluture/Future';
  const FL = {
    map: 'fantasy-land/map',
    bimap: 'fantasy-land/bimap',
    chain: 'fantasy-land/chain',
    chainRec: 'fantasy-land/chainRec',
    ap: 'fantasy-land/ap',
    of: 'fantasy-land/of'
  };

  function isForkable(m){
    return Boolean(m) && typeof m.fork === 'function' && m.fork.length >= 2;
  }

  function isFuture(m){
    return m instanceof Future || Boolean(m) && m['@@type'] === TYPEOF_FUTURE;
  }

  function isFunction(f){
    return typeof f === 'function';
  }

  function isBinary(f){
    return f.length >= 2;
  }

  function isTernary(f){
    return f.length >= 3;
  }

  function isPositiveInteger(n){
    return n === Infinity || (typeof n === 'number' && n > 0 && n % 1 === 0 && n === n);
  }

  function isObject(o){
    return o !== null && typeof o === 'object';
  }

  function isIterator(i){
    return isObject(i) && typeof i.next === 'function';
  }

  function isIteration(o){
    return isObject(o) && typeof o.done === 'boolean';
  }

  ///////////////
  // Utilities //
  ///////////////

  //A small string representing a value, but not containing the whole value.
  const preview = x =>
    typeof x === 'string'
    ? JSON.stringify(x)
    : Array.isArray(x)
    ? `[Array: ${x.length}]`
    : typeof x === 'function'
    ? typeof x.name === 'string' && x.name.length > 0
    ? `[Function: ${x.name}]`
    : /*istanbul ignore next*/ '[Function]' //Only for older JS engines.
    : x && typeof x === 'object'
    ? `[Object: ${Object.keys(x).map(String).join(', ')}]`
    : String(x);

  //A show function to provide a slightly more meaningful representation of values.
  const show = x =>
    typeof x === 'string'
    ? preview(x)
    : Array.isArray(x)
    ? `[${x.map(preview).join(', ')}]`
    : x && (typeof x.toString === 'function')
    ? x.toString === Object.prototype.toString
    ? `{${Object.keys(x).reduce((o, k) => o.concat(`${preview(k)}: ${preview(x[k])}`), []).join(', ')}}`
    : x.toString()
    : preview(x);

  const noop = function noop(){};
  const padf = (sf, s) => s.replace(/^/gm, sf).replace(sf, '');
  const showf = f => padf('  ', inspectf(2, f));
  const fid = f => f.name ? f.name : '<anonymous>';
  const ordinal = ['first', 'second', 'third', 'fourth', 'fifth'];
  const Next = x => ({done: false, value: x});
  const Done = x => ({done: true, value: x});

  //Partially apply a function with a single argument.
  function unaryPartial(f, a){
    return function partial(b, c, d){
      switch(arguments.length){
        case 1: return f(a, b);
        case 2: return f(a, b, c);
        default: return f(a, b, c, d);
      }
    };
  }

  //Partially apply a function with two arguments.
  function binaryPartial(f, a, b){
    return function partial(c, d){ return arguments.length === 1 ? f(a, b, c) : f(a, b, c, d) };
  }

  //Partially apply a function with three arguments.
  function ternaryPartial(f, a, b, c){
    return function partial(d){ return f(a, b, c, d) };
  }

  //Creates a dispatcher for a nullary method.
  function createNullaryDispatcher(method){
    return function nullaryDispatch(m){
      if(m && typeof m[method] === 'function') return m[method]();
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
  }

  //Creates a dispatcher for a unary method.
  function createUnaryDispatcher(method){
    return function unaryDispatch(a, m){
      if(arguments.length === 1) return unaryPartial(unaryDispatch, a);
      if(m && typeof m[method] === 'function') return m[method](a);
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
  }

  //Creates a dispatcher for a binary method.
  function createBinaryDispatcher(method){
    return function binaryDispatch(a, b, m){
      if(arguments.length === 1) return unaryPartial(binaryDispatch, a);
      if(arguments.length === 2) return binaryPartial(binaryDispatch, a, b);
      if(m && typeof m[method] === 'function') return m[method](a, b);
      error$invalidArgument(`Future.${method}`, 2, `have a "${method}" method`, m);
    };
  }

  //Creates a dispatcher for a binary method, but takes the object first rather than last.
  function createInvertedBinaryDispatcher(method){
    return function invertedBinaryDispatch(m, a, b){
      if(arguments.length === 1) return unaryPartial(invertedBinaryDispatch, m);
      if(arguments.length === 2) return binaryPartial(invertedBinaryDispatch, m, a);
      if(m && typeof m[method] === 'function') return m[method](a, b);
      error$invalidArgument(`Future.${method}`, 0, `have a "${method}" method`, m);
    };
  }

  ////////////
  // Errors //
  ////////////

  function error$invalidArgument(it, at, expected, actual){
    throw new TypeError(
      `${it} expects its ${ordinal[at]} argument to ${expected}\n  Actual: ${show(actual)}`
    );
  }

  function error$invalidContext(it, actual){
    throw new TypeError(
      `${it} was invoked outside the context of a Future. You might want to use`
      + ` a dispatcher instead\n  Called on: ${show(actual)}`
    )
  }

  function check$Future(fork){
    if(!isFunction(fork)) error$invalidArgument('Future', 0, 'be a function', fork);
  }

  function check$fork(it, rej, res){
    if(!isFuture(it)) error$invalidContext('Future#fork', it);
    if(!isFunction(rej)) error$invalidArgument('Future#fork', 0, 'be a function', rej);
    if(!isFunction(res)) error$invalidArgument('Future#fork', 1, 'be a function', res);
  }

  function check$fork$f(f, c){
    if(!(f === undefined || (isFunction(f) && f.length === 0))) throw new TypeError(
      'Future#fork expected the computation to return a nullary function or void'
      + `\n  Actual: ${show(f)}\n  From calling: ${showf(c)}`
    );
  }

  function check$chain(it, f){
    if(!isFuture(it)) error$invalidContext('Future#chain', it);
    if(!isFunction(f)) error$invalidArgument('Future#chain', 0, 'be a function', f);
  }

  function check$chainRec(f){
    if(!isFunction(f)) error$invalidArgument('Future.chainRec', 0, 'be a function', f);
  }

  function check$chainRec$f(m, f, i, x){
    if(!isFuture(m)) throw new TypeError(
      'Future.chainRec expects the function its given to return a Future every'
      + ' time it is called. The value returned from'
      + (ordinal[i] ? ` the ${ordinal[i]} call` : ` call ${i}`)
      + ' was not a Future.'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: (Next, Done, ${show(x)})`
    );
  }

  function check$chainRec$it(it, i){
    if(!isIteration(it)) throw new TypeError(
      'Future.chainRec expects the function its given to return a Future of an'
      + ' Iteration every time it is called. The Future returned from'
      + (ordinal[i] ? ` the ${ordinal[i]} call` : ` call ${i}`)
      + ' did not resolve to a member of Iteration.'
      + '\n  You can create an uncomplete or complete Iteration using the next'
      + ' or done functions respectively. These are passed into your callback'
      + ' as first and second arguments.'
      + `\n  Actual: Future.of(${show(it)})`
    );
  }

  function check$chain$f(m, f, x){
    if(!isFuture(m)) throw new TypeError(
      'Future#chain expects the function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: ${show(x)}`
    );
  }

  function check$chainRej(it, f){
    if(!isFuture(it)) error$invalidContext('Future.chainRej', it);
    if(!isFunction(f)) error$invalidArgument('Future.chainRej', 0, 'a function', f);
  }

  function check$chainRej$f(m, f, x){
    if(!isFuture(m)) throw new TypeError(
      'Future.chainRej expects the function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: ${show(x)}`
    );
  }

  function check$map(it, f){
    if(!isFuture(it)) error$invalidContext('Future#map', it);
    if(!isFunction(f)) error$invalidArgument('Future#map', 0, 'be a function', f);
  }

  function check$mapRej(it, f){
    if(!isFuture(it)) error$invalidContext('Future#mapRej', it);
    if(!isFunction(f)) error$invalidArgument('Future#mapRej', 0, 'be a function', f);
  }

  function check$bimap(it, f, g){
    if(!isFuture(it)) error$invalidContext('Future#bimap', it);
    if(!isFunction(f)) error$invalidArgument('Future#bimap', 0, 'be a function', f);
    if(!isFunction(g)) error$invalidArgument('Future#bimap', 1, 'be a function', g);
  }

  function check$ap(it, m){
    if(!isFuture(it)) error$invalidContext('Future#ap', it);
    if(!isFuture(m)) error$invalidArgument('Future#ap', 0, 'be a Future', m);
  }

  function check$ap$f(f){
    if(!isFunction(f)) throw new TypeError(
      'Future#ap expects its first argument to be a Future of a Function'
      + `\n  Actual: Future.of(${show(f)})`
    );
  }

  function check$swap(it){
    if(!isFuture(it)) error$invalidContext('Future#swap', it);
  }

  function check$race(it, m){
    if(!isFuture(it)) error$invalidContext('Future#race', it);
    if(!isFuture(m)) error$invalidArgument('Future#race', 0, 'be a Future', m);
  }

  function check$or(it, m){
    if(!isFuture(it)) error$invalidContext('Future#or', it);
    if(!isFuture(m)) error$invalidArgument('Future#or', 0, 'be a Future', m);
  }

  function check$fold(it, f, g){
    if(!isFuture(it)) error$invalidContext('Future#fold', it);
    if(!isFunction(f)) error$invalidArgument('Future#fold', 0, 'be a function', f);
    if(!isFunction(g)) error$invalidArgument('Future#fold', 1, 'be a function', g);
  }

  function check$hook(it, f, g){
    if(!isFuture(it)) error$invalidContext('Future#hook', it);
    if(!isFunction(f)) error$invalidArgument('Future#hook', 0, 'be a function', f);
    if(!isFunction(g)) error$invalidArgument('Future#hook', 1, 'be a function', g);
  }

  function check$hook$f(m, f, x){
    if(!isFuture(m)) throw new TypeError(
      'Future#hook expects the first function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: ${show(x)}`
    );
  }

  function check$hook$g(m, g, x){
    if(!isFuture(m)) throw new TypeError(
      'Future#hook expects the second function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(g)}\n  With: ${show(x)}`
    );
  }

  function check$finally(it, m){
    if(!isFuture(it)) error$invalidContext('Future#finally', it);
    if(!isFuture(m)) error$invalidArgument('Future#finally', 0, 'be a Future', m);
  }

  function check$value(it, f){
    if(!isFuture(it)) error$invalidContext('Future#value', it);
    if(!isFunction(f)) error$invalidArgument('Future#value', 0, 'be a function', f);
  }

  function check$then(it){
    if(!isFuture(it)) error$invalidContext('Future#then', it);
  }

  function check$cache(it){
    if(!isFuture(it)) error$invalidContext('Future#cache', it);
  }

  function check$after(n){
    if(typeof n !== 'number') error$invalidArgument('Future.after', 0, 'be a number', n);
  }

  function check$cast(m){
    if(!isForkable(m)) error$invalidArgument('Future.cast', 0, 'be a Forkable', m);
  }

  function check$try(f){
    if(!isFunction(f)) error$invalidArgument('Future.try', 0, 'be a function', f);
  }

  function check$encase(f){
    if(!isFunction(f)) error$invalidArgument('Future.encase', 0, 'be a function', f);
  }

  function check$encase2(f){
    if(!isFunction(f)) error$invalidArgument('Future.encase2', 0, 'be a function', f);
    if(!isBinary(f)) error$invalidArgument('Future.encase2', 0, 'take two arguments', f);
  }

  function check$encase3(f){
    if(!isFunction(f)) error$invalidArgument('Future.encase3', 0, 'be a function', f);
    if(!isTernary(f)) error$invalidArgument('Future.encase3', 0, 'take three arguments', f);
  }

  function check$node(f){
    if(!isFunction(f)) error$invalidArgument('Future.node', 0, 'be a function', f);
  }

  function check$parallel(i, ms){
    if(!isPositiveInteger(i)) error$invalidArgument('Future.parallel', 0, 'be a positive integer', i);
    if(!Array.isArray(ms)) error$invalidArgument('Future.parallel', 1, 'be an array', ms);
  }

  function check$parallel$m(m, i){
    if(!isFuture(m)) throw new TypeError(
      'Future.parallel expects its second argument to be an array of Futures.'
      + ` The value at position ${i} in the array was not a Future\n  Actual: ${show(m)}`
    );
  }

  function check$do(f){
    if(!isFunction(f)) error$invalidArgument('Future.do', 0, 'be a function', f);
  }

  function check$do$g(g){
    if(!isIterator(g)) error$invalidArgument(
      'Future.do', 0, 'return an iterator, maybe you forgot the "*"', g
    );
  }

  function check$do$next(o){
    if(!isIteration(o)) throw new TypeError(
      'Future.do was given an invalid generator:'
      + ' Its iterator did not return a valid iteration from iterator.next()'
      + `\n  Actual: ${show(o)}`
    );
    if(!o.done && !isFuture(o.value)) throw new TypeError(
      'A non-Future was produced by iterator.next() in Future.do.'
      + ' If you\'re using a generator, make sure you always `yield` a Future'
      + `\n  Actual: ${o.value}`
    );
  }

  ////////////////
  // Base class //
  ////////////////

  function Future(f){
    check$Future(f);
    return new SafeFuture(f);
  }

  function Future$of(x){
    return new FutureOf(x);
  }

  function Future$chainRec(f, init){
    if(arguments.length === 1) return unaryPartial(Future$chainRec, f);
    check$chainRec(f);
    return new ChainRec(f, init);
  }

  Future.prototype = {

    //Properties.
    '@@type': TYPEOF_FUTURE,
    _f: null,

    //Subclass creators.
    of: Future$of,

    ap: function Future$ap(m){
      check$ap(this, m);
      return new FutureAp(this, m);
    },

    map: function Future$map(f){
      check$map(this, f);
      return new FutureMap(this, f);
    },

    bimap: function Future$bimap(f, g){
      check$bimap(this, f, g);
      return new FutureBimap(this, f, g);
    },

    chain: function Future$chain(f){
      check$chain(this, f);
      return new FutureChain(this, f);
    },

    chainRej: function Future$chainRej(f){
      check$chainRej(this, f);
      return new FutureChainRej(this, f);
    },

    mapRej: function Future$mapRej(f){
      check$mapRej(this, f);
      return new FutureMapRej(this, f);
    },

    swap: function Future$swap(){
      check$swap(this);
      return new FutureSwap(this);
    },

    race: function Future$race(m){
      check$race(this, m);
      return new FutureRace(this, m);
    },

    or: function Future$or(m){
      check$or(this, m);
      return new FutureOr(this, m);
    },

    fold: function Future$fold(f, g){
      check$fold(this, f, g);
      return new FutureFold(this, f, g);
    },

    hook: function Future$hook(dispose, consume){
      check$hook(this, dispose, consume);
      return new FutureHook(this, dispose, consume);
    },

    finally: function Future$finally(m){
      check$finally(this, m);
      return new FutureFinally(this, m);
    },

    cache: function Future$cache(){
      check$cache(this);
      return new CachedFuture(this);
    },

    //Other methods.
    fork: function Future$fork(rej, res){
      check$fork(this, rej, res);
      return this._f(rej, res);
    },

    inspect: function Future$inspect(){
      return this.toString();
    },

    value: function Future$value(f){
      check$value(this, f);
      return this._f(
        function Future$value$rej(e){
          throw new Error(
            `Future#value was called on a rejected Future\n  Actual: Future.reject(${show(e)})`
          );
        },
        f
      );
    },

    then: function Future$then(resolve, reject){
      check$then(this);
      const then = new FutureThen(this, resolve, reject);
      const deferred = new CachedFuture(then);
      then.setGuard(deferred);
      setImmediate(function Future$then$eager(){ deferred.run() });
      return deferred;
    }

  };

  //Static functions.
  Future.of = Future$of;
  Future.ap = createUnaryDispatcher(FL.ap);
  Future.map = createUnaryDispatcher(FL.map);
  Future.bimap = createBinaryDispatcher(FL.bimap);
  Future.chain = createUnaryDispatcher(FL.chain);
  Future.chainRec = Future$chainRec;
  Future.recur = createUnaryDispatcher('recur');
  Future.chainRej = createUnaryDispatcher('chainRej');
  Future.mapRej = createUnaryDispatcher('mapRej');
  Future.swap = createNullaryDispatcher('swap');
  Future.fork = createBinaryDispatcher('fork');
  Future.race = createUnaryDispatcher('race');
  Future.or = createUnaryDispatcher('or');
  Future.fold = createBinaryDispatcher('fold');
  Future.hook = createInvertedBinaryDispatcher('hook');
  Future.finally = createUnaryDispatcher('finally');
  Future.value = createUnaryDispatcher('value');
  Future.cache = createNullaryDispatcher('cache');
  Future.Future = Future;
  Future.isFuture = isFuture;
  Future.isForkable = isForkable;

  Future.reject = function Future$reject(x){
    return new FutureReject(x);
  };

  Future.after = function Future$after(n, x){
    if(arguments.length === 1) return unaryPartial(Future$after, n);
    check$after(n);
    return new FutureAfter(n, x);
  };

  Future.cast = function Future$cast(m){
    check$cast(m);
    return new FutureCast(m);
  };

  Future.try = function Future$try(f){
    check$try(f);
    return new FutureTry(f);
  };

  Future.encase = function Future$encase(f, x){
    if(arguments.length === 1) return unaryPartial(Future$encase, f);
    check$encase(f);
    return new FutureEncase(f, x);
  };

  Future.encase2 = function Future$encase2(f, x, y){
    switch(arguments.length){
      case 1: return unaryPartial(Future$encase2, f);
      case 2: return binaryPartial(Future$encase2, f, x);
      default:
        check$encase2(f);
        return new FutureEncase(f, x, y);
    }
  };

  Future.encase3 = function Future$encase3(f, x, y, z){
    switch(arguments.length){
      case 1: return unaryPartial(Future$encase3, f);
      case 2: return binaryPartial(Future$encase3, f, x);
      case 3: return ternaryPartial(Future$encase3, f, x, y);
      default:
        check$encase3(f);
        return new FutureEncase(f, x, y, z);
    }
  };

  Future.node = function Future$node(f){
    check$node(f);
    return new FutureNode(f);
  };

  Future.parallel = function Future$parallel(i, ms){
    if(arguments.length === 1) return unaryPartial(Future$parallel, i);
    check$parallel(i, ms);
    return new FutureParallel(i, ms);
  };

  Future.do = function Future$do(f){
    check$do(f);
    return new FutureDo(f);
  };

  //Utilities.
  Future.util = {
    Next,
    Done,
    isForkable,
    isFuture,
    isFunction,
    isBinary,
    isTernary,
    isPositiveInteger,
    isObject,
    isIterator,
    isIteration,
    preview,
    show,
    padf,
    showf,
    fid,
    unaryPartial,
    binaryPartial,
    ternaryPartial
  };

  //Fantasy-Land compatibility.
  Future[FL.of] = Future.of;
  Future[FL.chainRec] = Future$chainRec;
  Future.prototype[FL.of] = Future.prototype.of;
  Future.prototype[FL.ap] = Future.prototype.ap;
  Future.prototype[FL.map] = Future.prototype.map;
  Future.prototype[FL.bimap] = Future.prototype.bimap;
  Future.prototype[FL.chain] = Future.prototype.chain;
  Future.prototype[FL.chainRec] = Future.prototype.chainRec;

  /////////////////
  // Sub classes //
  /////////////////

  function SafeFuture(computation){
    this._computation = computation;
  }

  SafeFuture.prototype = Object.create(Future.prototype);

  SafeFuture.prototype._f = function SafeFuture$fork(rej, res){
    let open = true;
    const f = this._computation(function SafeFuture$fork$rej(x){
      if(open){
        open = false;
        rej(x);
      }
    }, function SafeFuture$fork$res(x){
      if(open){
        open = false;
        res(x);
      }
    });
    check$fork$f(f, this._computation);
    return function SafeFuture$fork$cancel(){
      open && f && f();
      open = false;
    };
  }

  SafeFuture.prototype.toString = function SafeFuture$toString(){
    return `Future(${showf(this._computation)})`;
  }

  //----------

  //data Timing = Undetermined | Synchronous | Asynchronous
  const Undetermined = 0;
  const Synchronous = 1;
  const Asynchronous = 2;

  function ChainRec(iterate, init){
    this._iterate = iterate;
    this._init = init;
  }

  ChainRec.prototype = Object.create(Future.prototype);

  ChainRec.prototype._f = function ChainRec$fork(rej, res){
    const _this = this;
    let cancel = noop, i = 0;
    (function Future$chainRec$recur(state){
      let timing = Undetermined;
      function Future$chainRec$res(it){
        check$chainRec$it(it, i);
        i = i + 1;
        if(timing === Undetermined){
          timing = Synchronous;
          state = it;
        }else{
          Future$chainRec$recur(it);
        }
      }
      while(!state.done){
        timing = Undetermined;
        const m = _this._iterate(Next, Done, state.value);
        check$chainRec$f(m, _this._iterate, i, state.value);
        cancel = m._f(rej, Future$chainRec$res);
        if(timing !== Synchronous){
          timing = Asynchronous;
          return;
        }
      }
      res(state.value);
    }(Next(_this._init)));
    return function Future$chainRec$cancel(){ cancel() };
  }

  ChainRec.prototype.toString = function ChainRec$toString(){
    return `Future.chainRec(${showf(this._iterate)}, ${show(this._init)})`;
  }

  //----------

  //data State = Cold | Pending | Rejected | Resolved
  const Cold = 0;
  const Pending = 1;
  const Rejected = 2;
  const Resolved = 3;

  function Queued(rej, res){
    this[Rejected] = rej;
    this[Resolved] = res;
  }

  function CachedFuture(pure){
    this._pure = pure;
    this._cancel = noop;
    this._queue = [];
    this._queued = 0;
    this._value = null;
    this._state = Cold;
  }

  CachedFuture.STATE = {
    [Cold]: 'cold',
    [Pending]: 'pending',
    [Rejected]: 'rejected',
    [Resolved]: 'resolved'
  };

  CachedFuture.prototype = Object.create(Future.prototype);

  CachedFuture.prototype._addToQueue = function CachedFuture$addToQueue(rej, res){
    const _this = this;
    if(_this._state > Pending) return noop;
    const i = _this._queue.push(new Queued(rej, res)) - 1;
    _this._queued = _this._queued + 1;
    return function CachedFuture$removeFromQueue(){
      if(_this._state > Pending) return;
      _this._queue[i] = undefined;
      _this._queued = _this._queued - 1;
      if(_this._queued === 0) _this.reset();
    };
  }

  CachedFuture.prototype._drainQueue = function CachedFuture$drainQueue(){
    if(this._state <= Pending) return;
    if(this._queued === 0) return;
    const queue = this._queue;
    const length = queue.length;
    const state = this._state;
    const value = this._value;
    for(let i = 0; i < length; i++){
      queue[i] && queue[i][state](value);
      queue[i] = undefined;
    }
    this._queue = undefined;
    this._queued = 0;
  }

  CachedFuture.prototype.reject = function CachedFuture$reject(reason){
    if(this._state > Pending) return;
    this._value = reason;
    this._state = Rejected;
    this._drainQueue();
  }

  CachedFuture.prototype.resolve = function CachedFuture$resolve(value){
    if(this._state > Pending) return;
    this._value = value;
    this._state = Resolved;
    this._drainQueue();
  }

  CachedFuture.prototype.run = function CachedFuture$run(){
    const _this = this;
    if(_this._state > Cold) return;
    _this._state = Pending;
    _this._cancel = _this._pure._f(
      function CachedFuture$fork$rej(x){ _this.reject(x) },
      function CachedFuture$fork$res(x){ _this.resolve(x) }
    );
  }

  CachedFuture.prototype.reset = function CachedFuture$reset(){
    if(this._state === Cold) return;
    this._cancel();
    this._cancel = noop;
    this._queue = [];
    this._queued = 0;
    this._value = undefined;
    this._state = Cold;
  }

  CachedFuture.prototype.getState = function CachedFuture$getState(){
    return CachedFuture.STATE[this._state];
  }

  CachedFuture.prototype._f = function CachedFuture$fork(rej, res){
    const _this = this;
    let cancel = noop;
    switch(_this._state){
      case 1: cancel = _this._addToQueue(rej, res); break;
      case 2: rej(_this._value); break;
      case 3: res(_this._value); break;
      default: cancel = _this._addToQueue(rej, res); _this.run();
    }
    return cancel;
  }

  CachedFuture.prototype.inspect = function CachedFuture$inspect(){
    const repr = this._state === Resolved
      ? show(this._value)
      : `<${this.getState()}>` + (this._state === Rejected ? ` ${this._value}` : '');
    return `CachedFuture({ ${repr} })`;
  }

  CachedFuture.prototype.toString = function CachedFuture$toString(){
    return `${this._pure.toString()}.cache()`;
  }

  //----------

  function FutureThen(parent, onResolve, onReject){
    this._parent = parent;
    this._onResolve = onResolve;
    this._onReject = onReject;
    this._guard = null;
  }

  FutureThen.prototype = Object.create(Future.prototype);

  FutureThen.prototype.setGuard = function FutureThen$setGuard(guard){
    this._guard = guard;
  }

  FutureThen.prototype._f = function FutureThen$fork(rej, res){
    const _this = this, onReject = _this._onReject, onResolve = _this._onResolve;
    const setResolved = x => setImmediate(res, x);
    const setRejected = x => setImmediate(rej, x);
    const settle = function FutureThen$fork$settle(inner){
      let locked = false;
      function deeper(x){
        if(locked) return;
        locked = true;
        FutureThen$fork$settle(x);
      }
      function reject(x){
        if(locked) return;
        locked = true;
        setRejected(x);
      }
      if(inner === _this._guard){
        throw new TypeError('Cannot return the same Future to Future.then');
      }
      if(inner === null || typeof inner !== 'object' && typeof inner !== 'function'){
        return void setResolved(inner);
      }
      let then;
      try{
        then = inner.then;
      }catch(error){
        return void reject(error);
      }
      if(typeof then === 'function') try{
        return void then.call(inner, deeper, reject);
      }catch(error){
        return void reject(error);
      }
      setResolved(inner);
    };
    return _this._parent._f(function FutureThen$fork$rej(reason){
      if(typeof onReject === 'function'){
        setImmediate(() => {
          try{
            settle(onReject(reason));
          }catch(error){
            setRejected(error);
          }
        })
      }else{
        setRejected(reason);
      }
    }, function FutureThen$fork$res(value){
      if(typeof onResolve === 'function'){
        setImmediate(() => {
          try{
            settle(onResolve(value));
          }catch(error){
            setRejected(error);
          }
        })
      }else{
        setResolved(value);
      }
    });
  }

  FutureThen.prototype.toString = function FutureThen$toString(){
    return `${this._parent.toString()}.then(${show(this._onResolve)}, ${show(this._onReject)})`;
  }

  //----------

  function FutureOf(value){
    this._value = value;
  }

  FutureOf.prototype = Object.create(Future.prototype);

  FutureOf.prototype._f = function FutureOf$fork(rej, res){
    res(this._value);
    return noop;
  }

  FutureOf.prototype.toString = function FutureOf$toString(){
    return `Future.of(${show(this._value)})`;
  }

  //----------

  function FutureReject(reason){
    this._reason = reason;
  }

  FutureReject.prototype = Object.create(Future.prototype);

  FutureReject.prototype._f = function FutureReject$fork(rej){
    rej(this._reason);
    return noop;
  }

  FutureReject.prototype.toString = function FutureReject$toString(){
    return `Future.reject(${show(this._reason)})`;
  }

  //----------

  function FutureNode(computation){
    this._computation = computation;
  }

  FutureNode.prototype = Object.create(Future.prototype);

  FutureNode.prototype._f = function FutureNode$fork(rej, res){
    let open = true;
    this._computation(function FutureNode$fork$done(a, b){
      if(open){
        a ? rej(a) : res(b);
        open = false;
      }
    });
    return function FutureNode$fork$cancel(){ open = false };
  }

  FutureNode.prototype.toString = function FutureNode$toString(){
    return `Future.node(${showf(this._computation)})`;
  }

  //----------

  function FutureAfter(time, value){
    this._time = time;
    this._value = value;
  }

  FutureAfter.prototype = Object.create(Future.prototype);

  FutureAfter.prototype._f = function FutureAfter$fork(rej, res){
    const id = setTimeout(res, this._time, this._value);
    return function FutureAfter$fork$cancel(){ clearTimeout(id) };
  }

  FutureAfter.prototype.toString = function FutureAfter$toString(){
    return `Future.after(${show(this._time)}, ${show(this._value)})`;
  }

  //----------

  function FutureParallel$emptyFork(rej, res){
    res([]);
  }

  function FutureParallel(max, futures){
    this._futures = futures;
    this._length = futures.length;
    this._max = Math.min(this._length, max);
    if(futures.length === 0) this._f = FutureParallel$emptyFork;
  }

  FutureParallel.prototype = Object.create(Future.prototype);

  FutureParallel.prototype._f = function FutureParallel$fork(rej, res){
    const _this = this, cancels = new Array(_this._max), out = new Array(_this._length);
    let i = _this._max, ok = 0;
    const cancelAll = function Future$parallel$cancel(){
      for(let n = 0; n < _this._max; n++) cancels[n] && cancels[n]();
    };
    const run = function FutureParallel$fork$run(future, j, c){
      check$parallel$m(future, j);
      cancels[c] = future._f(function Future$parallel$fork$rej(reason){
        cancelAll();
        rej(reason);
      }, function Future$parallel$fork$res(value){
        out[j] = value;
        ok = ok + 1;
        if(i < _this._length) run(_this._futures[i], i++, c);
        else if(ok === _this._length) res(out);
      });
    }
    for(let n = 0; n < _this._max; n++) run(_this._futures[n], n, n);
    return cancelAll;
  }

  FutureParallel.prototype.toString = function FutureParallel$toString(){
    return `Future.parallel(${show(this._max)}, [${this._futures.map(show).join(', ')}])`;
  }

  //----------

  function FutureDo(generator){
    this._generator = generator;
  }

  FutureDo.prototype = Object.create(Future.prototype);

  FutureDo.prototype._f = function FutureDo$fork(rej, res){
    const iterator = this._generator();
    check$do$g(iterator);
    const recurser = new ChainRec(function Future$do$next(next, _, x){
      const iteration = iterator.next(x);
      check$do$next(iteration);
      return iteration.done ? new FutureOf(iteration) : iteration.value.map(next);
    }, undefined);
    return recurser._f(rej, res);
  }

  FutureDo.prototype.toString = function FutureDo$toString(){
    return `Future.do(${showf(this._generator)})`;
  }

  //----------

  function FutureCast(forkable){
    SafeFuture.call(this, (l, r) => forkable.fork(l, r));
    this._forkable = forkable;
  }

  FutureCast.prototype = Object.create(SafeFuture.prototype);

  FutureCast.prototype.toString = function FutureCast$toString(){
    return `Future.cast(${show(this._forkable)})`;
  }

  //----------

  function FutureTry(fn){
    this._fn = fn;
  }

  FutureTry.prototype = Object.create(Future.prototype);

  FutureTry.prototype._f = function FutureTry$0$fork(rej, res){
    let r;
    try{ r = this._fn() }catch(e){ rej(e); return noop }
    res(r);
    return noop;
  }

  FutureTry.prototype.toString = function FutureTry$toString(){
    return `Future.try(${show(this._fn)})`;
  }

  //----------

  function FutureEncase(fn, a, b, c){
    this._length = arguments.length - 1;
    this._fn = fn;
    this._a = a;
    this._b = b;
    this._c = c;
    this._f = FutureEncase.FS[this._length];
  }

  FutureEncase.FS = {
    1: function FutureEncase$1$fork(rej, res){
      let r;
      try{ r = this._fn(this._a) }catch(e){ rej(e); return noop }
      res(r);
      return noop;
    },
    2: function FutureEncase$2$fork(rej, res){
      let r;
      try{ r = this._fn(this._a, this._b) }catch(e){ rej(e); return noop }
      res(r);
      return noop;
    },
    3: function FutureEncase$3$fork(rej, res){
      let r;
      try{ r = this._fn(this._a, this._b, this._c) }catch(e){ rej(e); return noop }
      res(r);
      return noop;
    }
  }

  FutureEncase.prototype = Object.create(Future.prototype);

  FutureEncase.prototype.toString = function FutureEncase$toString(){
    const args = [this._a, this._b, this._c].slice(0, this._length).map(show).join(', ');
    const name = `encase${this._length > 1 ? this._length : ''}`;
    return `Future.${name}(${show(this._fn)}, ${args})`;
  }

  //----------

  function FutureChain(parent, chainer){
    this._parent = parent;
    this._chainer = chainer;
  }

  FutureChain.prototype = Object.create(Future.prototype);

  FutureChain.prototype._f = function FutureChain$fork(rej, res){
    const _this = this;
    let cancel;
    const r = _this._parent._f(rej, function FutureChain$fork$res(x){
      const m = _this._chainer(x);
      check$chain$f(m, _this._chainer, x);
      cancel = m._f(rej, res);
    });
    return cancel || (cancel = r, function FutureChain$fork$cancel(){ cancel() });
  }

  FutureChain.prototype.toString = function FutureChain$toString(){
    return `${this._parent.toString()}.chain(${showf(this._chainer)})`;
  }

  //----------

  function FutureChainRej(parent, chainer){
    this._parent = parent;
    this._chainer = chainer;
  }

  FutureChainRej.prototype = Object.create(Future.prototype);

  FutureChainRej.prototype._f = function FutureChainRej$fork(rej, res){
    const _this = this;
    let cancel;
    const r = _this._parent._f(function FutureChainRej$fork$rej(x){
      const m = _this._chainer(x);
      check$chainRej$f(m, _this._chainer, x);
      cancel = m._f(rej, res);
    }, res);
    return cancel || (cancel = r, function FutureChainRej$fork$cancel(){ cancel() });
  }

  FutureChainRej.prototype.toString = function FutureChainRej$toString(){
    return `${this._parent.toString()}.chainRej(${showf(this._chainer)})`;
  }

  //----------

  function FutureMap(parent, mapper){
    this._parent = parent;
    this._mapper = mapper;
  }

  FutureMap.prototype = Object.create(Future.prototype);

  FutureMap.prototype._f = function FutureMap$fork(rej, res){
    const _this = this;
    return _this._parent._f(rej, function FutureMap$fork$res(x){
      res(_this._mapper(x));
    });
  }

  FutureMap.prototype.toString = function FutureMap$toString(){
    return `${this._parent.toString()}.map(${showf(this._mapper)})`;
  }

  //----------

  function FutureMapRej(parent, mapper){
    this._parent = parent;
    this._mapper = mapper;
  }

  FutureMapRej.prototype = Object.create(Future.prototype);

  FutureMapRej.prototype._f = function FutureMapRej$fork(rej, res){
    const _this = this;
    return _this._parent._f(function FutureMapRej$fork$rej(x){
      rej(_this._mapper(x));
    }, res);
  }

  FutureMapRej.prototype.toString = function FutureMapRej$toString(){
    return `${this._parent.toString()}.mapRej(${showf(this._mapper)})`;
  }

  //----------

  function FutureBimap(parent, lmapper, rmapper){
    this._parent = parent;
    this._lmapper = lmapper;
    this._rmapper = rmapper;
  }

  FutureBimap.prototype = Object.create(Future.prototype);

  FutureBimap.prototype._f = function FutureBimap$fork(rej, res){
    const _this = this;
    return _this._parent._f(function FutureBimap$fork$rej(x){
      rej(_this._lmapper(x));
    }, function FutureBimap$fork$res(x){
      res(_this._rmapper(x));
    });
  }

  FutureBimap.prototype.toString = function FutureBimap$toString(){
    return `${this._parent.toString()}.bimap(${showf(this._lmapper)}, ${showf(this._rmapper)})`;
  }

  //----------

  function FutureAp(mval, mfunc){
    this._mval = mval;
    this._mfunc = mfunc;
  }

  FutureAp.prototype = Object.create(Future.prototype);

  FutureAp.prototype._f = function FutureAp$fork(_rej, res){
    let _f, _x, ok1, ok2, ko;
    const rej = x => ko || (ko = 1, _rej(x));
    const c1 = this._mval._f(rej, function FutureAp$fork$resThis(x){
      if(!ok1) return void (ok2 = 1, _x = x)
      check$ap$f(_f);
      res(_f(x));
    });
    const c2 = this._mfunc._f(rej, function FutureAp$fork$resThat(f){
      if(!ok2) return void (ok1 = 1, _f = f);
      check$ap$f(f);
      res(f(_x));
    });
    return function FutureAp$fork$cancel(){ c1(); c2() };
  }

  FutureAp.prototype.toString = function FutureAp$toString(){
    return `${this._mval.toString()}.ap(${this._mfunc.toString()})`;
  }

  //----------

  function FutureSwap(parent){
    this._parent = parent;
  }

  FutureSwap.prototype = Object.create(Future.prototype);

  FutureSwap.prototype._f = function FutureSwap$fork(rej, res){
    return this._parent._f(res, rej);
  }

  FutureSwap.prototype.toString = function FutureSwap$toString(){
    return `${this._parent.toString()}.swap()`;
  }

  //----------

  function FutureRace(left, right){
    this._left = left;
    this._right = right;
  }

  FutureRace.prototype = Object.create(Future.prototype);

  FutureRace.prototype._f = function FutureRace$fork(rej, res){
    let cancelled = false, lcancel = noop, rcancel = noop;
    const cancel = function FutureRace$fork$cancel(){ cancelled = true; lcancel(); rcancel() };
    const reject = function FutureRace$fork$rej(x){ cancel(); rej(x) }
    const resolve = function FutureRace$fork$res(x){ cancel(); res(x) }
    lcancel = this._left._f(reject, resolve);
    cancelled || (rcancel = this._right._f(reject, resolve));
    return cancel;
  }

  FutureRace.prototype.toString = function FutureRace$toString(){
    return `${this._left.toString()}.race(${this._right.toString()})`;
  }

  //----------

  function FutureOr(left, right){
    this._left = left;
    this._right = right;
  }

  FutureOr.prototype = Object.create(Future.prototype);

  FutureOr.prototype._f = function FutureOr$fork(rej, res){
    let resolved = false, rejected = false, val, err, lcancel = noop, rcancel = noop;
    lcancel = this._left._f(
      _ => rejected ? rej(err) : resolved ? res(val) : (rejected = true),
      x => (resolved = true, rcancel(), res(x))
    );
    resolved || (rcancel = this._right._f(
      e => resolved || (rejected ? rej(e) : (err = e, rejected = true)),
      x => resolved || (rejected ? res(x) : (val = x, resolved = true))
    ));
    return function FutureOr$fork$cancel(){ lcancel(); rcancel() };
  }

  FutureOr.prototype.toString = function FutureOr$toString(){
    return `${this._left.toString()}.or(${this._right.toString()})`;
  }

  //----------

  function FutureFold(parent, lfold, rfold){
    this._parent = parent;
    this._lfold = lfold;
    this._rfold = rfold;
  }

  FutureFold.prototype = Object.create(Future.prototype);

  FutureFold.prototype._f = function FutureFold$fork(rej, res){
    const _this = this;
    return _this._parent._f(function FutureFold$fork$rej(x){
      res(_this._lfold(x));
    }, function FutureFold$fork$res(x){
      res(_this._rfold(x));
    });
  }

  FutureFold.prototype.toString = function FutureFold$toString(){
    return `${this._parent.toString()}.fold(${showf(this._lfold)}, ${showf(this._rfold)})`;
  }

  //----------

  function FutureHook(acquire, dispose, consume){
    this._acquire = acquire;
    this._dispose = dispose;
    this._consume = consume;
  }

  FutureHook.prototype = Object.create(Future.prototype);

  FutureHook.prototype._f = function FutureHook$fork(rej, res){
    const _this = this;
    let cancel, cancelAcquire = noop;
    cancelAcquire = _this._acquire._f(rej, function FutureHook$fork$res(resource){
      const disposer = function FutureHook$dispose(callback){
        const disposal = _this._dispose(resource);
        check$hook$f(disposal, _this._dispose, resource);
        cancel = disposal._f(rej, callback);
        return cancel;
      }
      const consumption = _this._consume(resource);
      check$hook$g(consumption, _this._consume, resource);
      cancel = function FutureHook$fork$cancelConsume(){
        disposer(noop)();
        cancelAcquire();
        cancelConsume();
      }
      const cancelConsume = consumption._f(
        x => disposer(_ => rej(x)),
        x => disposer(_ => res(x))
      );
    });
    cancel = cancel || cancelAcquire;
    return function FutureHook$fork$cancel(){ cancel() };
  }

  FutureHook.prototype.toString = function FutureHook$toString(){
    return `${this._acquire.toString()}.hook(${showf(this._dispose)}, ${showf(this._consume)})`;
  }

  //----------

  function FutureFinally(left, right){
    this._left = left;
    this._right = right;
  }

  FutureFinally.prototype = Object.create(Future.prototype);

  FutureFinally.prototype._f = function FutureFinally$fork(rej, res){
    const _this = this;
    let cancel;
    const r = _this._left._f(function FutureFinally$fork$rej(e){
      cancel = _this._right._f(rej, function FutureFinally$fork$rej$res(){ rej(e) });
    }, function FutureFinally$fork$res(x){
      cancel = _this._right._f(rej, function FutureFinally$fork$res$res(){ res(x) });
    });
    return cancel || (cancel = r, function FutureFinally$fork$cancel(){ cancel() });
  }

  FutureFinally.prototype.toString = function FutureFinally$toString(){
    return `${this._left.toString()}.finally(${this._right.toString()})`;
  }

  return Future;

}));
