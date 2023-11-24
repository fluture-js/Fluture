import Either from 'sanctuary-either';
import {chain, resolve, reject} from '../../index.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, eq, throwing, error} from '../util/util.js';
import {rejected, resolved, resolvedSlow} from '../util/futures.js';
import {testFunction, functionArg, chainArg} from '../util/props.js';

testFunction('chain', chain, [functionArg, chainArg], assertValidFuture);

test('dispatches to Fantasy Land chain', function (){
  eq(chain(Either.Left)(Either.Right(42)), Either.Left(42));
});

test('crashes when the given function does not return Future', function (){
  return assertCrashed(chain(bang)(resolved), new TypeError(
    'chain expects the return value from the function it\'s given to be a valid Future.\n' +
    '  Actual: "resolved!" :: String\n' +
    '  When called with: "resolved"'
  ));
});

test('calls the function with the resolution value and sequences the returned Future', function (){
  return Promise.all([
    assertRejected(chain(reject)(resolved), 'resolved'),
    assertRejected(chain(reject)(resolvedSlow), 'resolvedSlow'),
    assertResolved(chain(resolve)(resolved), 'resolved'),
    assertRejected(chain(resolve)(rejected), 'rejected'),
    assertCrashed(chain(throwing)(resolved), error),
  ]);
});

test('displays correctly as string', function (){
  eq(chain(resolve)(resolved).toString(), 'chain (' + resolve.toString() + ') (resolve ("resolved"))');
});
