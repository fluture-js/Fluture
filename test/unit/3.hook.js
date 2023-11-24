import chai from 'chai';
import {Future, hook, resolve, reject} from '../../index.js';
import {test, assertCrashed, assertIsFuture, assertRejected, assertResolved, error, itRaises, K, noop} from '../util/util.js';
import * as F from '../util/futures.js';
import {testFunction, futureArg, functionArg} from '../util/props.js';

var expect = chai.expect;

testFunction('hook', hook, [futureArg, functionArg, functionArg], assertIsFuture);

test('crashes when the disposal function does not return Future', function (){
  var m = hook(F.resolved)(function (){ return 1 })(function (){ return F.resolved });
  return assertCrashed(m, new TypeError(
    'hook() expects the return value from the first function it\'s given to be a valid Future.\n' +
    '  Actual: 1 :: Number\n' +
    '  From calling: function (){ return 1 }\n' +
    '  With: "resolved"'
  ));
});

test('crashes when the disposal function throws', function (){
  var m = hook(F.resolved)(function (){ throw error })(function (){ return F.resolved });
  return assertCrashed(m, error);
});

test('crashes when the computation function does not return Future', function (){
  var m = hook(F.resolved)(function (){ return F.resolved })(function (){ return 1 });
  return assertCrashed(m, new TypeError(
    'hook() expects the return value from the second function it\'s given to be a valid Future.\n' +
    '  Actual: 1 :: Number\n' +
    '  From calling: function (){ return 1 }\n' +
    '  With: "resolved"'
  ));
});

test('crashes when the computation function throws', function (){
  var m = hook(F.resolved)(function (){ return F.resolved })(function (){ throw error });
  return assertCrashed(m, error);
});

test('crashes when the disposal Future rejects', function (){
  var rejected = hook(F.resolved)(function (){ return reject(1) })(function (){ return reject(2) });
  var resolved = hook(F.resolved)(function (){ return reject(1) })(function (){ return resolve(2) });
  return Promise.all([
    assertCrashed(rejected, new Error('The disposal Future rejected with 1')),
    assertCrashed(resolved, new Error('The disposal Future rejected with 1')),
  ]);
});

test('runs the first computation after the second, both with the resource', function (done){
  var ran = false;
  hook(F.resolved)(function (x){
    expect(x).to.equal('resolved');
    return Future(function (rej, res){ res(done(ran ? null : new Error('Second did not run'))); return noop });
  })(function (x){
    expect(x).to.equal('resolved');
    return Future(function (rej, res){ res(ran = true); return noop });
  })._interpret(done, done, noop);
});

test('runs the first even if the second rejects', function (done){
  hook(F.resolved)(function (){
    return Future(function (){ done(); return noop });
  })(function (){
    return reject(2);
  })._interpret(done, noop, noop);
});

test('assumes the state resolve the second if the first resolves', function (){
  var rejected = hook(F.resolved)(function (){ return resolve(1) })(function (){ return reject(2) });
  var resolved = hook(F.resolved)(function (){ return resolve(1) })(function (){ return resolve(2) });
  return Promise.all([
    assertRejected(rejected, 2),
    assertResolved(resolved, 2),
  ]);
});

test('does not hook after being cancelled', function (done){
  const fail = () => done(error);
  hook(F.resolvedSlow)(function (){ return resolve('dispose') })(fail)._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('does not reject after being cancelled', function (done){
  const fail = () => done(error);
  hook(F.rejectedSlow)(function (){ return resolve('dispose') })(fail)._interpret(done, fail, fail)();
  hook(F.resolved)(function (){ return resolve('dispose') })(function (){ return F.rejectedSlow })._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('cancels acquire appropriately', function (done){
  const fail = () => done(error);
  var acquire = Future(function (){ return function (){ return done() } });
  var cancel =
    hook(acquire)(function (){ return resolve('dispose') })(function (){ return resolve('consume') })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 10);
});

test('cancels consume appropriately', function (done){
  const fail = () => done(error);
  var consume = Future(function (){ return function (){ return done() } });
  var cancel =
    hook(F.resolved)(function (){ return resolve('dispose') })(function (){ return consume })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 10);
});

test('cancels delayed consume appropriately', function (done){
  const fail = () => done(error);
  var consume = Future(function (){ return function (){ return done() } });
  var cancel =
    hook(F.resolvedSlow)(function (){ return resolve('dispose') })(function (){ return consume })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 25);
});

test('does not cancel disposal', function (done){
  const fail = () => done(error);
  var dispose = Future(function (){ return function (){ return done(error) } });
  var cancel =
    hook(F.resolved)(function (){ return dispose })(function (){ return resolve('consume') })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 10);
  setTimeout(done, 50);
});

test('does not cancel delayed dispose', function (done){
  const fail = () => done(error);
  var dispose = Future(function (){ return function (){ return done(error) } });
  var cancel =
    hook(F.resolved)(function (){ return dispose })(function (){ return F.resolvedSlow })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 50);
  setTimeout(done, 100);
});

test('runs the disposal Future when cancelled after acquire', function (done){
  const fail = () => done(error);
  var cancel =
    hook(F.resolved)(function (){ return Future(function (){ done(); return noop }) })(function (){ return F.resolvedSlow })
    ._interpret(done, fail, fail);
  setTimeout(cancel, 10);
});

itRaises('exceptions that occur after the Future was unsubscribed', function (done){
  const fail = () => done(error);
  hook(F.resolved)(K(F.crashedSlow))(K(F.resolved))._interpret(function (){
    done(new Error('Exception handler called'));
  }, fail, fail)();
}, error);

test('returns the code which creates the same data-structure when cast to String', function (){
  var a = resolve(1);
  var d = function (){ return resolve(2) };
  var c = function (){ return resolve(3) };
  var m = hook(a)(d)(c);
  var expected = 'hook (' + a.toString() + ') (' + d.toString() + ') (' + c.toString() + ')';
  expect(m.toString()).to.equal(expected);
});
