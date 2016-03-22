/*global define FantasyLand inspectx inspectf*/
(function(global, f){

  'use strict';

  /*istanbul ignore next*/
  if(typeof module !== 'undefined'){
    module.exports = f(require('fantasy-land'), require('inspect-x'), require('inspect-f'));
  }

  else if(typeof define === 'function' && define.amd){
    define(['fantasy-land', 'inspect-x', 'inspect-f'], f);
  }

  else{
    global.Fluture = f(FantasyLand, inspectx, inspectf);
  }

}(/*istanbul ignore next*/(global || window || this), function(FL, inspectx, inspectf){

  'use strict';

  ///////////////////
  // Type checking //
  ///////////////////

  function isForkable(m){
    return m && typeof m.fork === 'function' && m.fork.length >= 2;
  }

  function isFluture(m){
    return m instanceof FutureClass;
  }

  function isFunction(f){
    return typeof f === 'function';
  }

  function isPositiveInteger(n){
    return n === Infinity || (typeof n === 'number' && n > 0 && n % 1 === 0 && n === n);
  }

  ////////////////////
  // Error handling //
  ////////////////////

  const show = x => inspectx(x, {depth: 1});
  const showf = f => inspectf(2, f).replace(/^/gm, '  ').trim();

  function error$invalidArgument(it, at, expected, actual){
    throw new TypeError(
      `${it} expects argument ${at} to ${expected}\n  Actual: ${show(actual)}`
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
    if(!isFluture(it)) error$invalidContext('Future#fork', it);
    if(!isFunction(rej)) error$invalidArgument('Future#fork', 0, 'be a function', rej);
    if(!isFunction(res)) error$invalidArgument('Future#fork', 1, 'be a function', res);
  }

  function check$chain(it, f){
    if(!isFluture(it)) error$invalidContext('Future#chain', it);
    if(!isFunction(f)) error$invalidArgument('Future#chain', 0, 'be a function', f);
  }

  function check$chain$f(m, f, x){
    if(!isFluture(m)) throw new TypeError(
      'Future#chain expects the function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: ${show(x)}`
    );
  }

  function check$chainRej(it, f){
    if(!isFluture(it)) error$invalidContext('Future.chainRej', it);
    if(!isFunction(f)) error$invalidArgument('Future.chainRej', 0, 'a function', f);
  }

  function check$chainRej$f(m, f, x){
    if(!isFluture(m)) throw new TypeError(
      'Future.chainRej expects the function its given to return a Future'
      + `\n  Actual: ${show(m)}\n  From calling: ${showf(f)}\n  With: ${show(x)}`
    );
  }

  function check$map(it, f){
    if(!isFluture(it)) error$invalidContext('Future#map', it);
    if(!isFunction(f)) error$invalidArgument('Future#map', 0, 'be a function', f);
  }

  function check$ap(it, m){
    if(!isFluture(it)) error$invalidContext('Future#ap', it);
    if(!isFluture(m)) error$invalidArgument('Future#ap', 0, 'be a Future', m);
  }

  //Check resolution value of the Future on which #ap was called.
  function check$ap$f(f){
    if(!isFunction(f)) throw new TypeError(
      `Future#ap can only be used on Future<Function> but was used on a Future of: ${show(f)}`
    );
  }

  function check$race(it, m){
    if(!isFluture(it)) error$invalidContext('Future#race', it);
    if(!isFluture(m)) error$invalidArgument('Future#race', 0, 'be a Future', m);
  }

  function check$or(it, m){
    if(!isFluture(it)) error$invalidContext('Future#or', it);
    if(!isFluture(m)) error$invalidArgument('Future#or', 0, 'be a Future', m);
  }

  function check$fold(it, f, g){
    if(!isFluture(it)) error$invalidContext('Future#fold', it);
    if(!isFunction(f)) error$invalidArgument('Future#fold', 0, 'be a function', f);
    if(!isFunction(g)) error$invalidArgument('Future#fold', 1, 'be a function', g);
  }

  function check$value(it, f){
    if(!isFluture(it)) error$invalidContext('Future#value', it);
    if(!isFunction(f)) error$invalidArgument('Future#value', 0, 'be a function', f);
  }

  function check$then(it){
    if(!isFluture(it)) error$invalidContext('Future#then', it);
  }

  function check$cache(m){
    if(!isFluture(m)) error$invalidArgument('Future.cache', 0, 'be a Future', m);
  }

  function check$cache$settle(oldState, newState, oldValue, newValue){
    if(oldState > 1) throw new Error(
      'Future.cache expects the Future it wraps to only resolve or reject once; '
      + ' a cached Future tried to ' + (newState === 2 ? 'reject' : 'resolve') + ' a second time.'
      + ' Please check your cached Future and make sure it does not call res or rej multiple times'
      + '\n  It was ' + (oldState === 2 ? 'rejected' : 'resolved') + ' with: ' + show(oldValue)
      + '\n  It got ' + (newState === 2 ? 'rejected' : 'resolved') + ' with: ' + show(newValue)
    );
  }

  function check$after(n){
    if(typeof n !== 'number') error$invalidArgument('Future.after', 0, 'be a number', n);
  }

  function check$cast(m){
    if(!isForkable(m)) error$invalidArgument('Future.cast', 0, 'be a Forkable', m);
  }

  function check$encase(f){
    if(typeof f !== 'function') error$invalidArgument('Future.encase', 0, 'be a function', f);
  }

  function check$node(f){
    if(typeof f !== 'function') error$invalidArgument('Future.node', 0, 'be a function', f);
  }

  function check$parallel(i, ms){
    if(!isPositiveInteger(i)) error$invalidArgument('Future.parallel', 0, 'be a positive integer', i);
    if(!Array.isArray(ms)) error$invalidArgument('Future.parallel', 0, 'be an array', ms);
  }

  function check$parallel$m(m, i){
    if(!isFluture(m)) throw new TypeError(
      'Future.parallel expects argument 1 to be an array of Futures.'
      + ` The value at position ${i} in the array was not a Future.\n  Actual: ${show(m)}`
    );
  }

  ////////////
  // Future //
  ////////////

  //Constructor.
  function FutureClass(f){
    this._f = f;
  }

  //A createFuture function which pretends to be Future.
  function Future(f){
    check$Future(f);
    return new FutureClass(f);
  }

  //The of method.
  function Future$of(x){
    return new FutureClass(function Future$of$fork(rej, res){
      res(x);
    });
  }

  function Future$fork(rej, res){
    check$fork(this, rej, res);
    this._f(rej, res);
  }

  function Future$chain(f){
    check$chain(this, f);
    const _this = this;
    return new FutureClass(function Future$chain$fork(rej, res){
      _this._f(rej, function Future$chain$res(x){
        const m = f(x);
        check$chain$f(m, f, x);
        m._f(rej, res);
      });
    });
  }

  function Future$chainRej(f){
    check$chainRej(this, f);
    const _this = this;
    return new FutureClass(function Future$chainRej$fork(rej, res){
      _this._f(function Future$chainRej$rej(x){
        const m = f(x);
        check$chainRej$f(m, f, x);
        m._f(rej, res);
      }, res);
    });
  }

  function Future$map(f){
    check$map(this, f);
    const _this = this;
    return new FutureClass(function Future$map$fork(rej, res){
      _this._f(rej, function Future$map$res(x){
        res(f(x));
      });
    });
  }

  function Future$ap(m){
    check$ap(this, m);
    const _this = this;
    return new FutureClass(function Future$ap$fork(g, res){
      let _f, _x, ok1, ok2, ko;
      const rej = x => ko || (ko = 1, g(x));
      _this._f(rej, function Future$ap$resThis(f){
        if(!ok2) return void (ok1 = 1, _f = f);
        check$ap$f(f);
        res(f(_x));
      });
      m._f(rej, function Future$ap$resThat(x){
        if(!ok1) return void (ok2 = 1, _x = x)
        check$ap$f(_f);
        res(_f(x));
      });
    });
  }

  function Future$toString(){
    return `Future(${this._f.toString()})`;
  }

  function Future$race(m){
    check$race(this, m);
    const _this = this;
    return new FutureClass(function Future$race$fork(rej, res){
      let settled = false;
      const once = f => a => settled || (settled = true, f(a));
      _this._f(once(rej), once(res));
      m._f(once(rej), once(res));
    });
  }

  function Future$or(m){
    check$or(this, m);
    const _this = this;
    return new FutureClass(function Future$or$fork(rej, res){
      let ok = false, ko = false, val, err;
      _this._f(
        () => ko ? rej(err) : ok ? res(val) : (ko = true),
        x => (ok = true, res(x))
      );
      m._f(
        e => ok || (ko ? rej(e) : (err = e, ko = true)),
        x => ok || (ko ? res(x) : (val = x, ok = true))
      );
    });
  }

  function Future$fold(f, g){
    check$fold(this, f, g);
    const _this = this;
    return new FutureClass(function Future$fold$fork(rej, res){
      _this._f(e => res(f(e)), x => res(g(x)));
    });
  }

  function Future$value(f){
    check$value(this, f);
    this._f(
      function Future$value$rej(e){
        throw new Error(
          `Future#value was called on a rejected Future\n  Actual: Future.reject(${show(e)})`
        );
      },
      f
    );
  }

  function Future$then(onResolve, onReject){
    check$then(this);
    const cached = this._cached || (this._cached = Future.cache(this));
    return new Promise(function Future$then$do(resolve, reject){
      cached.fork(reject, resolve);
    }).then(onResolve, onReject);
  }

  //Give Future a prototype.
  FutureClass.prototype = Future.prototype = {
    _f: null,
    fork: Future$fork,
    [FL.of]: Future$of,
    of: Future$of,
    [FL.chain]: Future$chain,
    chain: Future$chain,
    chainRej: Future$chainRej,
    [FL.map]: Future$map,
    map: Future$map,
    [FL.ap]: Future$ap,
    ap: Future$ap,
    toString: Future$toString,
    inspect: Future$toString,
    race: Future$race,
    or: Future$or,
    fold: Future$fold,
    value: Future$value,
    then: Future$then
  };

  //Expose `of` statically as well.
  Future[FL.of] = Future.of = Future$of;

  //Expose Future statically for ease of destructuring.
  Future.Future = Future;

  /////////////////
  // Dispatchers //
  /////////////////

  //Creates a dispatcher for a unary method.
  function createUnaryDispatcher(method){
    return function dispatch(a, m){
      if(arguments.length === 1) return m => dispatch(a, m);
      if(m && typeof m[method] === 'function') return m[method](a);
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
  }

  //Creates a dispatcher for a binary method.
  function createBinaryDispatcher(method){
    return function dispatch(a, b, m){
      if(arguments.length === 1) return (b, m) => m ? dispatch(a, b, m) : dispatch(a, b);
      if(arguments.length === 2) return m => dispatch(a, b, m);
      if(m && typeof m[method] === 'function') return m[method](a, b);
      error$invalidArgument(`Future.${method}`, 2, `have a "${method}" method`, m);
    };
  }

  //chain :: Chain m => (a -> m b) -> m a -> m b
  Future.chain = createUnaryDispatcher('chain');

  //chainRej :: (a -> Future a c) -> Future a b -> Future a c
  Future.chainRej = createUnaryDispatcher('chainRej');

  //map :: Functor m => (a -> b) -> m a -> m b
  Future.map = createUnaryDispatcher('map');

  //ap :: Apply m => m (a -> b) -> m a -> m b
  Future.ap = function dispatch$ap(m, a){
    if(arguments.length === 1) return a => dispatch$ap(m, a);
    if(m && typeof m.ap === 'function') return m.ap(a);
    error$invalidArgument('Future.ap', 0, 'have a "ap" method', m);
  };

  //fork :: (a -> Void) -> (b -> Void) -> Future a b -> Void
  Future.fork = createBinaryDispatcher('fork');

  //race :: Future a b -> Future a b -> Future a b
  Future.race = createUnaryDispatcher('race');

  //or :: Future a b -> Future a b -> Future a b
  Future.or = createUnaryDispatcher('or');

  //fold :: (a -> c) -> (b -> c) -> Future a b -> Future _ c
  Future.fold = createBinaryDispatcher('fold');

  //value :: (b -> Void) -> Future a b -> Void
  Future.value = createUnaryDispatcher('value');

  ///////////////
  // Utilities //
  ///////////////

  // Cache a Future.
  // Returns a Future which caches the resolution value of the given Future so
  // that whenever it's forked, it can load the value from cache rather than
  // reexecuting the chain.
  Future.cache = function Future$cache(m){
    check$cache(m);
    let que = [];
    let value, state;
    const settleWith = newState => function Future$cache$settle(newValue){
      check$cache$settle(state, newState, value, newValue);
      value = newValue; state = newState;
      for(let i = 0, l = que.length; i < l; i++){
        que[i][state](value);
        que[i] = undefined;
      }
      que = undefined;
    };
    return new FutureClass(function Future$cache$fork(rej, res){
      switch(state){
        case 1: que.push({2: rej, 3: res}); break;
        case 2: rej(value); break;
        case 3: res(value); break;
        default:
          state = 1;
          que.push({2: rej, 3: res});
          m.fork(settleWith(2), settleWith(3));
      }
    });
  };

  //Create a Future which rejects witth the given value.
  Future.reject = function Future$reject(x){
    return new FutureClass(function Future$reject$fork(rej){
      rej(x);
    });
  };

  //Create a Future which resolves after the given time with the given value.
  Future.after = function Future$after(n, x){
    if(arguments.length === 1) return x => Future$after(n, x);
    check$after(n);
    return new FutureClass(function Future$after$fork(rej, res){
      setTimeout(res, n, x);
    })
  };

  Future.cast = function Future$cast(m){
    check$cast(m);
    if(m instanceof FutureClass){
      return m;
    }
    return new FutureClass(function Future$cast$fork(rej, res){
      m.fork(rej, res);
    });
  };

  //encase :: (a -> !b | c) -> a -> Future b c
  Future.encase = function Future$encase(f, x){
    if(arguments.length === 1) return x => Future$encase(f, x);
    check$encase(f);
    return new FutureClass(function Future$encase$fork(rej, res){
      let y;
      try{
        y = f(x);
      }
      catch(err){
        return void rej(err);
      }
      res(y);
    });
  };

  //Create a Future which resolves with the return value of the given function,
  //or rejects with the exception thrown by the given function.
  Future.try = function Future$try(f){
    return Future.encase(f, undefined);
  };

  //node :: ((err, a) -> Void) -> Future[Error, a]
  Future.node = function Future$node(f){
    check$node(f);
    return new FutureClass(function Future$node$fork(rej, res){
      f((a, b) => a ? rej(a) : res(b));
    });
  };

  //parallel :: PositiveInteger -> [Future a b] -> Future a [b]
  Future.parallel = function Future$parallel(i, ms){
    if(arguments.length === 1) return ms => Future$parallel(i, ms);
    check$parallel(i, ms);
    const l = ms.length;
    return l < 1 ? Future$of([]) : new FutureClass(function Future$parallel$fork(rej, res){
      let ko = false;
      let ok = 0;
      const out = new Array(l);
      const next = j => i < l ? fork(ms[i], i++) : (j === l && res(out));
      const fork = (m, j) => (check$parallel$m(m, j), m._f(
        e => ko || (rej(e), ko = true),
        x => ko || (out[j] = x, next(++ok))
      ));
      ms.slice(0, i).forEach(fork);
    });
  };

  //Export Future factory.
  return Future;

}));
