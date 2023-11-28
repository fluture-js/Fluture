import {Future, resolve, reject, after} from '../../index.js';
import {pap} from '../../src/pap.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, noop, add} from '../util/util.js';
import {testFunction, futureArg} from '../util/props.js';

testFunction('pap', pap, [futureArg, futureArg], assertValidFuture);

test('crashes when the other does not resolve to a Function', function (){
  var m = pap(resolve(1))(resolve(null));
  return assertCrashed(m, new TypeError(
    'pap expects the second Future to resolve to a Function\n' +
    '  Actual: null'
  ));
});

test('applies the Function on the right to the value on the left', function (){
  return Promise.all([
    assertResolved(pap(resolve(1))(resolve(add(1))), 2),
    assertRejected(pap(resolve(add(1)))(reject('err')), 'err'),
    assertRejected(pap(reject('err'))(resolve(add(1))), 'err'),
    assertResolved(pap(after(20)(1))(resolve(add(1))), 2),
    assertResolved(pap(resolve(1))(after(20)(add(1))), 2),
  ]);
});

test('cancels the left Future if cancel is called while it is running', function (done){
  var left = Future(function (){ return function (){ return done() } });
  var right = resolve(add(1));
  var cancel = pap(left)(right)._interpret(done, noop, noop);
  cancel();
});

test('cancels the right Future if cancel is called while it is running', function (done){
  var left = resolve(1);
  var right = Future(function (){ return function (){ return done() } });
  var cancel = pap(left)(right)._interpret(done, noop, noop);
  cancel();
});
