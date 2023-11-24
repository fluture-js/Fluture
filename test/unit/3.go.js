import chai from 'chai';
import {Future, go, resolve, after} from '../../index.js';
import {test, assertCrashed, assertResolved, assertValidFuture, error, noop, STACKSIZE} from '../util/util.js';
import * as F from '../util/futures.js';
import {testFunction, functionArg} from '../util/props.js';

var expect = chai.expect;

testFunction('go', go, [functionArg], assertValidFuture);

test('crashes when the given function throws an error', function (){
  var m = go(function (){ throw error });
  return assertCrashed(m, error);
});

test('crashes when the given function does not return an interator', function (){
  var m = go(function (){ return null });
  return assertCrashed(m, new TypeError(
    'go() expects its first argument to return an iterator, maybe you forgot the "*".\n' +
    '  Actual: null :: Null'
  ));
});

test('crashes when iterator.next() throws an error', function (){
  var m = go(function (){ return {next: () => { throw error }} });
  return assertCrashed(m, error);
});

test('crashes when the returned iterator does not return a valid iteration', function (){
  var m = go(function (){ return {next: () => { return null }} });
  return assertCrashed(m, new TypeError(
    'The iterator did not return a valid iteration from iterator.next()\n' +
    '  Actual: null'
  ));
});

test('crashes when the returned iterator produces something other than a Future', function (){
  var m = go(function (){ return {next: () => { return {done: false, value: null} }} });
  return assertCrashed(m, new TypeError(
    'go() expects the value produced by the iterator to be a valid Future.\n' +
    '  Actual: null :: Null\n' +
    '  Tip: If you\'re using a generator, make sure you always yield a Future'
  ));
});

test('crashes when the yielded Future crashes', function (){
  var m = go(function*(){ yield F.crashed });
  return assertCrashed(m, error);
});

test('handles synchronous Futures', function (){
  return assertResolved(go(function*(){
    var a = yield resolve(1);
    var b = yield resolve(2);
    return a + b;
  }), 3);
});

test('handles asynchronous Futures', function (){
  return assertResolved(go(function*(){
    var a = yield after(10)(1);
    var b = yield after(10)(2);
    return a + b;
  }), 3);
});

test('does not mix state over multiple interpretations', function (){
  var m = go(function*(){
    var a = yield resolve(1);
    var b = yield after(10)(2);
    return a + b;
  });
  return Promise.all([
    assertResolved(m, 3),
    assertResolved(m, 3),
  ]);
});

test('is stack safe', function (){
  var gen = function*(){
    var i = 0;
    while(i < STACKSIZE + 1){ yield resolve(i++) }
    return i;
  };

  var m = go(gen);
  return assertResolved(m, STACKSIZE + 1);
});

test('cancels the running operation when cancelled', function (done){
  var cancel = go(function*(){
    yield resolve(1);
    yield Future(function (){ return function (){ return done() } });
  })._interpret(done, noop, noop);
  cancel();
});

test('returns the code to create the Go when cast to String', function (){
  var f = function*(){};
  var m = go(f);
  var s = 'go (' + f.toString() + ')';
  expect(m.toString()).to.equal(s);
});
