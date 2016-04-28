////      ____ _         _
////     / ___| |       | |_
////    | |__ | | _   _ |  _\   _  ___  ___
////    |  __|| || | | || || | | ||  _// _ \
////    | |   | || |_| || || |_| || | |  __/
////    |_|   |_| \__,_||_| \__,_||_|  \___\
////

/*global define FantasyLand inspectf*/
(function(global, f){

  'use strict';

  /*istanbul ignore next*/
  if(typeof module !== 'undefined'){
    module.exports = f(require('fantasy-land'), require('inspect-f'));
  }

  else if(typeof define === 'function' && define.amd){
    define(['fantasy-land', 'inspect-x', 'inspect-f'], f);
  }

  else{
    global.Fluture = f(FantasyLand, inspectf);
  }

}(/*istanbul ignore next*/(global || window || this), function(FL, inspectf){

  'use strict';

  ///////////////////
  // Type checking //
  ///////////////////

  const TYPEOF_FUTURE = 'fluture/Future';

  function isForkable(m){
    return Boolean(m) && typeof m.fork === 'function' && m.fork.length >= 2;
  }

  function isFuture(m){
    return (m instanceof FutureClass) || Boolean(m) && m['@@type'] === TYPEOF_FUTURE;
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

  function isObject(x){
    return typeof x === 'object' && x !== null;
  }

  function isIterator(i){
    return isObject(i) && typeof i.next === 'function';
  }

  function isIteration(o){
    return isObject(o) && 'value' in o && 'done' in o && typeof o.done === 'boolean';
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
    : '[Function]'
    : x && x.toString === Object.prototype.toString
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

  const padf = (sf, s) => s.replace(/^/gm, sf).replace(sf, '');
  const showf = f => padf('  ', inspectf(2, f));
  const fid = f => f.name ? f.name : '<anonymous>';

  //Partially apply a function with a single argument.
  function unaryPartial(f, a){
    const g = function partial(b, c, d){
      switch(arguments.length){
        case 1: return f(a, b);
        case 2: return f(a, b, c);
        default: return f(a, b, c, d);
      }
    };
    g.toString = () => `${inspectf(2, f)}.bind(null, ${show(a)})`;
    g.inspect = () => `[Function: unaryPartial$${fid(f)}]`;
    return g;
  }

  //Partially apply a function with two arguments.
  function binaryPartial(f, a, b){
    const g = function partial(c, d){ return arguments.length === 1 ? f(a, b, c) : f(a, b, c, d) };
    g.toString = () => `${inspectf(2, f)}.bind(null, ${show(a)}, ${show(b)})`;
    g.inspect = () => `[Function: binaryPartial$${fid(f)}]`;
    return g;
  }

  //Partially apply a function with three arguments.
  function ternaryPartial(f, a, b, c){
    const g = function partial(d){ return f(a, b, c, d) };
    g.toString = () => `${inspectf(2, f)}.bind(null, ${show(a)}, ${show(b)}, ${show(c)})`;
    g.inspect = () => `[Function: ternaryPartial$${fid(f)}]`;
    return g;
  }

  ////////////
  // Errors //
  ////////////

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
    if(!isFuture(it)) error$invalidContext('Future#fork', it);
    if(!isFunction(rej)) error$invalidArgument('Future#fork', 0, 'be a function', rej);
    if(!isFunction(res)) error$invalidArgument('Future#fork', 1, 'be a function', res);
  }

  function check$chain(it, f){
    if(!isFuture(it)) error$invalidContext('Future#chain', it);
    if(!isFunction(f)) error$invalidArgument('Future#chain', 0, 'be a function', f);
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
      `Future#ap can only be used on Future<Function> but was used on a Future of: ${show(f)}`
    );
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

  function check$value(it, f){
    if(!isFuture(it)) error$invalidContext('Future#value', it);
    if(!isFunction(f)) error$invalidArgument('Future#value', 0, 'be a function', f);
  }

  function check$promise(it){
    if(!isFuture(it)) error$invalidContext('Future#promise', it);
  }

  function check$cache(it){
    if(!isFuture(it)) error$invalidContext('Future#cache', it);
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
    if(!isFunction(f)) error$invalidArgument('Future.encase', 0, 'be a function', f);
  }

  function check$encase2(f){
    if(!isFunction(f)) error$invalidArgument('Future.encase2', 0, 'be a function', f);
    if(!isBinary(f)) error$invalidArgument('Future.encase2', 0, 'take at least two arguments', f);
  }

  function check$encase3(f){
    if(!isFunction(f)) error$invalidArgument('Future.encase3', 0, 'be a function', f);
    if(!isTernary(f)) error$invalidArgument('Future.encase3', 0, 'take at least three arguments', f);
  }

  function check$node(f){
    if(!isFunction(f)) error$invalidArgument('Future.node', 0, 'be a function', f);
  }

  function check$parallel(i, ms){
    if(!isPositiveInteger(i)) error$invalidArgument('Future.parallel', 0, 'be a positive integer', i);
    if(!Array.isArray(ms)) error$invalidArgument('Future.parallel', 0, 'be an array', ms);
  }

  function check$parallel$m(m, i){
    if(!isFuture(m)) throw new TypeError(
      'Future.parallel expects argument 1 to be an array of Futures.'
      + ` The value at position ${i} in the array was not a Future.\n  Actual: ${show(m)}`
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

  ////////////
  // Future //
  ////////////

  function FutureClass(f){
    this._f = f;
  }

  function Future(f){
    check$Future(f);
    return new FutureClass(f);
  }

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

  function Future$mapRej(f){
    check$mapRej(this, f);
    const _this = this;
    return new FutureClass(function Future$mapRej$fork(rej, res){
      _this._f(function Future$mapRej$rej(x){
        rej(f(x));
      }, res);
    });
  }

  function Future$bimap(f, g){
    check$bimap(this, f, g);
    const _this = this;
    return new FutureClass(function Future$bimap$fork(rej, res){
      _this._f(function Future$bimap$rej(x){
        rej(f(x));
      }, function Future$bimap$res(x){
        res(g(x));
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

  function Future$promise(){
    check$promise(this);
    const _this = this;
    return new Promise(function Future$promise$do(resolve, reject){
      _this.fork(reject, resolve);
    });
  }

  function Future$cache(){
    check$cache(this);
    const _this = this;
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
          _this.fork(settleWith(2), settleWith(3));
      }
    });
  }

  FutureClass.prototype = Future.prototype = {
    '@@type': TYPEOF_FUTURE,
    _f: null,
    fork: Future$fork,
    [FL.of]: Future$of,
    of: Future$of,
    [FL.chain]: Future$chain,
    chain: Future$chain,
    chainRej: Future$chainRej,
    [FL.map]: Future$map,
    map: Future$map,
    mapRej: Future$mapRej,
    bimap: Future$bimap,
    [FL.ap]: Future$ap,
    ap: Future$ap,
    toString: Future$toString,
    inspect: Future$toString,
    race: Future$race,
    or: Future$or,
    fold: Future$fold,
    value: Future$value,
    promise: Future$promise,
    cache: Future$cache
  };

  Future[FL.of] = Future.of = Future$of;
  Future.Future = Future;

  Future.util = {
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

  /////////////////
  // Dispatchers //
  /////////////////

  //Creates a dispatcher for a nullary method.
  function createNullaryDispatcher(method){
    const f = function nullaryDispatch(m){
      if(m && typeof m[method] === 'function') return m[method]();
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
    f.toString = () => `function dispatch$${method}(m){ m.${method}() }`;
    f.inspect = () => `[Function: dispatch$${method}]`;
    return f;
  }

  //Creates a dispatcher for a unary method.
  function createUnaryDispatcher(method){
    const f = function unaryDispatch(a, m){
      if(arguments.length === 1) return unaryPartial(f, a);
      if(m && typeof m[method] === 'function') return m[method](a);
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
    f.toString = () => `function dispatch$${method}(a, m){ m.${method}(a) }`;
    f.inspect = () => `[Function: dispatch$${method}]`;
    return f;
  }

  //Creates a dispatcher for a unary method, but takes the object first rather than last.
  function createInvertedUnaryDispatcher(method){
    const f = function invertedUnaryDispatch(m, a){
      if(arguments.length === 1) return unaryPartial(f, m);
      if(m && typeof m[method] === 'function') return m[method](a);
      error$invalidArgument(`Future.${method}`, 1, `have a "${method}" method`, m);
    };
    f.toString = () => `function dispatch$${method}(m, a){ m.${method}(a) }`;
    f.inspect = () => `[Function: dispatch$${method}]`;
    return f;
  }

  //Creates a dispatcher for a binary method.
  function createBinaryDispatcher(method){
    const f = function binaryDispatch(a, b, m){
      if(arguments.length === 1) return unaryPartial(f, a);
      if(arguments.length === 2) return binaryPartial(f, a, b);
      if(m && typeof m[method] === 'function') return m[method](a, b);
      error$invalidArgument(`Future.${method}`, 2, `have a "${method}" method`, m);
    };
    f.toString = () => `function dispatch$${method}(a, b, m){ m.${method}(a, b) }`;
    f.inspect = () => `[Function: dispatch$${method}]`;
    return f;
  }

  Future.chain = createUnaryDispatcher('chain');
  Future.chainRej = createUnaryDispatcher('chainRej');
  Future.map = createUnaryDispatcher('map');
  Future.mapRej = createUnaryDispatcher('mapRej');
  Future.bimap = createBinaryDispatcher('bimap');
  Future.ap = createInvertedUnaryDispatcher('ap');
  Future.fork = createBinaryDispatcher('fork');
  Future.race = createUnaryDispatcher('race');
  Future.or = createUnaryDispatcher('or');
  Future.fold = createBinaryDispatcher('fold');
  Future.value = createUnaryDispatcher('value');
  Future.promise = createNullaryDispatcher('promise');
  Future.cache = createNullaryDispatcher('cache');

  /////////////////////
  // Other functions //
  /////////////////////

  Future.isFuture = isFuture;
  Future.isForkable = isForkable;

  Future.reject = function Future$reject(x){
    return new FutureClass(function Future$reject$fork(rej){
      rej(x);
    });
  };

  Future.after = function Future$after(n, x){
    if(arguments.length === 1) return unaryPartial(Future.after, n);
    check$after(n);
    return new FutureClass(function Future$after$fork(rej, res){
      setTimeout(res, n, x);
    })
  };

  Future.cast = function Future$cast(m){
    check$cast(m);
    return new FutureClass(function Future$cast$fork(rej, res){
      m.fork(rej, res);
    });
  };

  Future.encase = function Future$encase(f, x){
    check$encase(f);
    if(arguments.length === 1) return unaryPartial(Future.encase, f);
    return new FutureClass(function Future$encase$fork(rej, res){
      let r;
      try{
        r = f(x);
      }
      catch(e){
        return void rej(e);
      }
      res(r);
    });
  };

  Future.encase2 = function Future$encase2(f, x, y){
    check$encase2(f);
    if(arguments.length === 1) return unaryPartial(Future.encase2, f);
    if(arguments.length === 2) return binaryPartial(Future.encase2, f, x);
    return new FutureClass(function Future$encase2$fork(rej, res){
      let r;
      try{
        r = f(x, y);
      }
      catch(e){
        return void rej(e);
      }
      res(r);
    });
  };

  Future.encase3 = function Future$encase3(f, x, y, z){
    check$encase3(f);
    if(arguments.length === 1) return unaryPartial(Future.encase3, f);
    if(arguments.length === 2) return binaryPartial(Future.encase3, f, x);
    if(arguments.length === 3) return ternaryPartial(Future.encase3, f, x, y);
    return new FutureClass(function Future$encase3$fork(rej, res){
      let r;
      try{
        r = f(x, y, z);
      }
      catch(e){
        return void rej(e);
      }
      res(r);
    });
  };

  Future.try = function Future$try(f){
    return Future.encase(f, undefined);
  };

  Future.node = function Future$node(f){
    check$node(f);
    return new FutureClass(function Future$node$fork(rej, res){
      f((a, b) => a ? rej(a) : res(b));
    });
  };

  Future.parallel = function Future$parallel(i, ms){
    if(arguments.length === 1) return unaryPartial(Future.parallel, i);
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

  Future.do = function Future$do(f){
    check$do(f);
    return new FutureClass(function Future$do$fork(rej, res){
      const g = f();
      check$do$g(g);
      const next = function Future$do$next(x){
        const o = g.next(x);
        check$do$next(o);
        return o.done ? Future$of(o.value) : o.value.chain(Future$do$next);
      };
      return next().fork(rej, res);
    });
  };

  return Future;

}));
