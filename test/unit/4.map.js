import Either from 'sanctuary-either';
import {map} from '../../index.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, eq, throwing, error} from '../util/util.js';
import {rejected, resolved, resolvedSlow, rejectedSlow} from '../util/futures.js';
import {testFunction, functionArg, functorArg} from '../util/props.js';

testFunction('map', map, [functionArg, functorArg], assertValidFuture);

test('dispatches to Fantasy Land map', function (){
  eq(map(bang)(Either.Right('hello')), Either.Right('hello!'));
});

test('maps the resolution branch with the given function', function (){
  return Promise.all([
    assertRejected(map(bang)(rejected), 'rejected'),
    assertResolved(map(bang)(resolved), 'resolved!'),
    assertCrashed(map(throwing)(resolved), error),
  ]);
});

test('does not resolve after being cancelled', function (done){
  const fail = () => done(error);
  map(fail)(resolvedSlow)._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('does not reject after being cancelled', function (done){
  const fail = () => done(error);
  map(fail)(rejectedSlow)._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('displays correctly as string', function (){
  eq(map(bang)(resolved).toString(), 'map (' + bang.toString() + ') (resolve ("resolved"))');
});
