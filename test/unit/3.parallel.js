import chai from 'chai';
import {Future, parallel, resolve, reject, after} from '../../index.js';
import {test, promiseTimeout, assertCrashed, assertRejected, assertResolved, assertValidFuture, error, noop, repeat, STACKSIZE} from '../util/util.js';
import * as F from '../util/futures.js';
import {testFunction, positiveIntegerArg, futureArrayArg} from '../util/props.js';

var expect = chai.expect;

testFunction('parallel', parallel, [positiveIntegerArg, futureArrayArg], assertValidFuture);

test('crashes when one resolve the Futures crash', function (){
  return assertCrashed(parallel(2)([F.resolved, F.crashed]), error);
});

test('crashes when one resolve the Futures crash', function (){
  return assertCrashed(parallel(2)([F.resolved, F.resolved, F.resolved, F.resolved, F.resolved, F.crashed]), error);
});

test('throws when the Array contains something other than Futures', function (){
  var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
  var fs = xs.map(function (x){ return function (){ return parallel(1)([x])._interpret(noop, noop, noop) } });
  fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/u) });
});

test('parallelizes execution', function (){
  var actual = parallel(5)([
    after(20)('a'),
    after(20)('b'),
    after(20)('c'),
    after(20)('d'),
    after(20)('e'),
  ]);
  return promiseTimeout(70, assertResolved(actual, ['a', 'b', 'c', 'd', 'e']));
});

test('limits parallelism to the given number', function (){
  var running = 0;
  var m = Future(function (rej, res){
    running++;
    if(running > 2){ return void rej(new Error('More than two running in parallel')) }
    setTimeout(function (){
      running--;
      res('a');
    }, 20);
    return noop;
  });
  var actual = parallel(2)(repeat(8, m));
  return assertResolved(actual, repeat(8, 'a'));
});

test('runs all in parallel when given number larger than the array length', function (){
  var actual = parallel(10)([
    after(20)('a'),
    after(20)('b'),
    after(20)('c'),
    after(20)('d'),
    after(20)('e'),
  ]);
  return promiseTimeout(70, assertResolved(actual, ['a', 'b', 'c', 'd', 'e']));
});

test('can deal with synchronously resolving futures', function (){
  return assertResolved(parallel(5)(repeat(10, resolve(1))), [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
});

test('interprets the synchronous futures in the provided sequence', function (done){
  var ns = Array.from({length: 10}, function (_, i){ return i });
  var xs = [];
  var ms = ns.map(function (i){
    return Future(function (rej, res){
      xs.push(i);
      res(i);
      return noop;
    });
  });
  parallel(5)(ms)._interpret(done, noop, function (out){
    expect(out).to.deep.equal(ns);
    expect(xs).to.deep.equal(ns);
    done();
  });
});

test('interprets the asynchronous futures in the provided sequence', function (done){
  var ns = Array.from({length: 10}, function (_, i){ return i });
  var xs = [];
  var ms = ns.map(function (i){
    return Future(function (rej, res){
      xs.push(i);
      setTimeout(res, 10, i);
      return noop;
    });
  });
  parallel(5)(ms)._interpret(done, noop, function (out){
    expect(out).to.deep.equal(ns);
    expect(xs).to.deep.equal(ns);
    done();
  });
});

test('resolves to an empty array when given an empty array', function (){
  return assertResolved(parallel(1)([]), []);
});

test('runs all in parallel when given Infinity', function (){
  var actual = parallel(Infinity)([
    after(20)('a'),
    after(20)('b'),
    after(20)('c'),
    after(20)('d'),
    after(20)('e'),
  ]);
  return promiseTimeout(70, assertResolved(actual, ['a', 'b', 'c', 'd', 'e']));
});

test('rejects if one resolve the input rejects', function (){
  var actual = parallel(2)([F.resolved, reject('err')]);
  return assertRejected(actual, 'err');
});

test('rejects with the first rejection value', function (){
  return Promise.all([
    assertRejected(parallel(2)([F.rejectedSlow, F.rejected]), 'rejected'),
    assertRejected(parallel(2)([F.rejected, F.rejectedSlow]), 'rejected'),
  ]);
});

test('cancels Futures when cancelled', function (done){
  var m = Future(function (){ return function (){ return done() } });
  var cancel = parallel(1)([m])._interpret(done, noop, noop);
  setTimeout(cancel, 20);
});

test('cancels only running Futures when cancelled', function (done){
  var i = 0, j = 0;
  var m = Future(function (rej, res){
    var x = setTimeout(function (x){ j += 1; res(x) }, 20, 1);

    return function (){
      i += 1;
      clearTimeout(x);
    };
  });
  var cancel = parallel(2)([m, m, m, m])._interpret(done, noop, noop);
  setTimeout(function (){
    cancel();
    expect(i).to.equal(2);
    expect(j).to.equal(2);
    done();
  }, 30);
});

test('does not interpret any computations after one rejects', function (done){
  var m = Future(function (){ done(error) });
  parallel(2)([F.rejected, m])._interpret(done, noop, noop);
  done();
});

test('automatically cancels running computations when one rejects', function (done){
  var m = Future(function (){ return function (){ done() } });
  parallel(2)([m, F.rejected])._interpret(done, noop, noop);
});

test('does not cancel settled computations (#123)', function (done){
  var m1 = Object.create(F.mock);
  var m2 = Object.create(F.mock);

  m1._interpret = function (_, rej, res){
    setTimeout(res, 10, 1);
    return function (){ return done(error) };
  };

  m2._interpret = function (_, rej){
    setTimeout(rej, 50, 2);
    return function (){ return done(error) };
  };

  parallel(2)([m1, m2])._interpret(done, noop, noop);
  setTimeout(done, 100, null);
});

test('does not resolve after being cancelled', function (done){
  const fail = () => done(error);
  const cancel = parallel(1)([F.resolvedSlow, F.resolvedSlow])
  ._interpret(done, fail, fail);
  cancel();
  setTimeout(done, 100);
});

test('does not reject after being cancelled', function (done){
  const fail = () => done(error);
  const cancel = parallel(1)([F.rejectedSlow, F.rejectedSlow])
  ._interpret(done, fail, fail);
  cancel();
  setTimeout(done, 100);
});

test('is stack safe (#130)', function (){
  var ms = Array.from({length: STACKSIZE}, (_, i) => resolve(i));
  var expected = Array.from({length: STACKSIZE}, (_, i) => i);
  return assertResolved(parallel(1)(ms), expected);
});

test('returns the code to create the Parallel when cast to String', function (){
  var m1 = parallel(Infinity)([resolve(1), resolve(2)]);
  var m2 = parallel(2)([resolve(1), resolve(2)]);
  var s1 = 'parallel (Infinity) ([resolve (1), resolve (2)])';
  var s2 = 'parallel (2) ([resolve (1), resolve (2)])';
  expect(m1.toString()).to.equal(s1);
  expect(m2.toString()).to.equal(s2);
});
