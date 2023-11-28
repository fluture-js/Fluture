import chai from 'chai';
import {Future, cache, resolve, reject, after, rejectAfter} from '../../index.js';
import {Crashed, Rejected, Resolved} from '../../src/cache.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, error, noop, onceOrError} from '../util/util.js';
import * as F from '../util/futures.js';
import {testFunction, futureArg} from '../util/props.js';

var expect = chai.expect;

testFunction('cache', cache, [futureArg], assertValidFuture);

test('interpret crashes if the underlying computation crashes', function (){
  return assertCrashed(cache(F.crashed), error);
});

test('interpret resolves with the resolution value resolve the given Future', function (){
  return assertResolved(cache(resolve(1)), 1);
});

test('interpret rejects with the rejection reason resolve the given Future', function (){
  return assertRejected(cache(reject(error)), error);
});

test('interpret only interprets its given Future once', function (){
  var m = cache(Future(onceOrError(function (rej, res){ res(1); return noop })));
  m._interpret(noop, noop, noop);
  m._interpret(noop, noop, noop);
  return assertResolved(m, 1);
});

test('interpret crashes all consumers once a delayed crash happens', function (){
  var m = cache(F.crashedSlow);
  var a = assertCrashed(m, error);
  var b = assertCrashed(m, error);
  var c = assertCrashed(m, error);
  return Promise.all([a, b, c]);
});

test('interpret resolves all consumers once a delayed resolution happens', function (){
  var m = cache(after(200)(1));
  var a = assertResolved(m, 1);
  var b = assertResolved(m, 1);
  var c = assertResolved(m, 1);
  return Promise.all([a, b, c]);
});

test('interpret rejects all consumers once a delayed rejection happens', function (){
  var m = cache(rejectAfter(20)(error));
  var a = assertRejected(m, error);
  var b = assertRejected(m, error);
  var c = assertRejected(m, error);
  return Promise.all([a, b, c]);
});

test('interpret crashes all new consumers after a crash happened', function (){
  var m = cache(F.crashed);
  m._interpret(noop, noop, noop);
  return assertCrashed(m, error);
});

test('interpret rejects all new consumers after a rejection happened', function (){
  var m = cache(reject('err'));
  m._interpret(noop, noop, noop);
  return assertRejected(m, 'err');
});

test('interpret it iinterpret nterprets the internal Future again when interpreted after having been cancelled', function (done){
  var m = cache(Future(function (rej, res){
    var o = {cancelled: false};
    var id = setTimeout(res, 20, o);
    return function (){ o.cancelled = true; clearTimeout(id) };
  }));
  var clear = m._interpret(done, noop, noop);
  setTimeout(function (){
    clear();
    m._interpret(done, noop, function (v){ return (expect(v).to.have.property('cancelled', false), done()) });
  }, 10);
});

test('interpret does not reset when one resolve multiple listeners is cancelled', function (done){
  var m = cache(Future(function (rej, res){
    setTimeout(res, 5, 1);
    return function (){ return done(new Error('Reset happened')) };
  }));
  var cancel = m._interpret(done, noop, noop);
  m._interpret(done, noop, noop);
  cancel();
  setTimeout(done, 20);
});

test('interpret does not change when cancelled after settled', function (done){
  var m = cache(Future(function (rej, res){
    res(1);
    return function (){ return done(new Error('Cancelled after settled')) };
  }));
  var cancel = m._interpret(done, noop, noop);
  setTimeout(function (){
    cancel();
    done();
  }, 5);
});

test('crash sets state to Crashed', function (){
  var m = cache(Future(noop));
  m.crash(1);
  expect(m._state).to.equal(Crashed);
});

test('crash does nothing when state is resolved', function (){
  var m = cache(Future(noop));
  m.resolve(1);
  m.crash(2);
  expect(m._state).to.equal(Resolved);
});

test('resolve does nothing when state is rejected', function (){
  var m = cache(Future(noop));
  m.reject(1);
  m.resolve(2);
  expect(m._state).to.equal(Rejected);
});

test('reject does nothing when state is resolved', function (){
  var m = cache(Future(noop));
  m.resolve(1);
  m.reject(2);
  expect(m._state).to.equal(Resolved);
});

test('_addToQueue does nothing when state is settled', function (){
  var m = cache(Future(noop));
  m.resolve(1);
  m._addToQueue(noop, noop);
  expect(m._queued).to.equal(0);
});

test('_drainQueue is idempotent', function (){
  var m = cache(resolve(1));
  m._drainQueue();
  m._drainQueue();
  m._interpret(noop, noop, noop);
  m._drainQueue();
  m._drainQueue();
});

test('run is idempotent', function (){
  var m = cache(resolve(1));
  m.run();
  m.run();
});

test('reset is idempotent', function (){
  var m = cache(resolve(1));
  m.reset();
  m._interpret(noop, noop, noop);
  m.reset();
  m.reset();
});

test('reset cancels the underlying computation', function (done){
  var m = cache(Future(function (){ return function (){ done() } }));
  m.run();
  m.reset();
});

test('returns the code to create the Cache when cast to String', function (){
  var m = cache(resolve(1));
  var s = 'cache (resolve (1))';
  expect(m.toString()).to.equal(s);
});

test('extractLeft returns empty array for cold Cacheds', function (){
  expect(cache(reject(1)).extractLeft()).to.deep.equal([]);
});

test('extractLeft returns array with reason for rejected Cacheds', function (){
  var m = cache(reject(1));
  m.run();
  expect(m.extractLeft()).to.deep.equal([1]);
});

test('extractRight returns empty array for cold Cacheds', function (){
  expect(cache(resolve(1)).extractRight()).to.deep.equal([]);
});

test('extractRight returns array with value for resolved Cacheds', function (){
  var m = cache(resolve(1));
  m.run();
  expect(m.extractRight()).to.deep.equal([1]);
});
