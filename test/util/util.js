import oletus from 'oletus';
import show from 'sanctuary-show';
import {reject, resolve} from '../../index.js';
import {crash} from '../../src/future.js';
import * as assert from '../assertions.js';
export * from '../../src/internal/predicates.js';

export var STACKSIZE = (function r (){ try{ return 1 + r() }catch(e){ return 1 } }());
export var noop = function (){};
export var add = function (a){ return function (b){ return a + b } };
export var sub = function (a){ return function (b){ return a - b } };
export var bang = function (s){ return (s + '!') };
export var I = function (x){ return x };
export var B = function (f){ return function (g){ return function (x){ return f(g(x)) } } };
export var K = function (x){ return function (){ return x } };
export var T = function (x){ return function (f){ return f(x) } };
export var error = new Error('Intentional error for unit testing');
export var throwing = function (){ throw error };

export function test (name, impl){
  oletus(name, () => (
    impl.length === 0 ? impl() : new Promise((res, rej) => { impl(e => e ? rej(e) : res()) })
  ));
}

export var eq = function eq (actual, expected){
  assert.equality(actual)(expected);
};

export var throws = function throws (f, expected){
  try{
    f();
  }catch(actual){
    eq(typeof actual, typeof expected);
    eq(actual.constructor, expected.constructor);
    eq(actual.name, expected.name);
    eq(actual.message, expected.message);
    return;
  }
  throw new Error('Expected the function to throw');
};

export var itRaises = function itRaises (when, f, e){
  test('raises ' + when, function (done){
    var listeners = process.rawListeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    process.once('uncaughtException', function (actual){
      listeners.forEach(function (f){ process.on('uncaughtException', f) });
      try {
        eq(actual.message, e.message);
      }catch(err){
        done(err);
        return;
      }
      done();
    });
    f();
  });
};

export var isDeepStrictEqual = function isDeepStrictEqual (actual, expected){
  try{
    eq(actual, expected);
    return true;
  }catch(e){
    return false;
  }
};

export var repeat = function (n, x){
  var out = new Array(n);
  while(n-- > 0){ out[n] = x } //eslint-disable-line
  return out;
};

export var promiseTimeout = function (t, p){
  return Promise.race([
    p,
    new Promise((res, rej) => {
      setTimeout(rej, t, new Error(`Timeout of ${t}ms reached`));
    }),
  ]);
};

export var assertIsFuture = function (x){
  return assert.future(x);
};

export var assertValidFuture = function (x){
  assertIsFuture(x);

  eq(typeof x.extractLeft, 'function');
  eq(x.extractLeft.length, 0);
  eq(Array.isArray(x.extractLeft()), true);

  eq(typeof x.extractRight, 'function');
  eq(x.extractRight.length, 0);
  eq(Array.isArray(x.extractRight()), true);

  eq(typeof x._transform, 'function');
  eq(x._transform.length, 1);

  eq(typeof x._interpret, 'function');
  eq(typeof x._interpret(noop, noop, noop), 'function');
  eq(x._interpret(noop, noop, noop).length, 0);
  eq(x._interpret(noop, noop, noop)(), undefined);

  return true;
};

export var assertEqual = function (a, b){
  return assert.equivalence(a)(b);
};

var assertEqualByErrorMessage = assert.makeEquivalence(a => b => {
  return assert.equality(a.message)(b.message);
});

export var assertCrashed = function (m, x){
  return assertEqualByErrorMessage(m)(crash(x));
};

export var assertRejected = function (m, x){
  return assertEqual(m, reject(x));
};

export var assertResolved = function (m, x){
 return assertEqual(m, resolve(x));
};

export var onceOrError = function (f){
  var called = false;
  return function (){
    if(called){ throw new Error('Function ' + show(f) + ' was called twice') }
    called = true;
    return f.apply(null, arguments);
  };
};

export function assertStackTrace (name, x){
  eq(typeof x, 'string');
  eq(x.slice(0, name.length), name);
  var lines = x.slice(name.length).split('\n');
  eq(lines.length > 0, true);
}
