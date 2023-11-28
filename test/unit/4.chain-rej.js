import {chainRej, resolve, reject} from '../../index.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, throwing, error, eq} from '../util/util.js';
import {rejected, resolved, rejectedSlow} from '../util/futures.js';
import {testFunction, functionArg, futureArg} from '../util/props.js';

testFunction('chainRej', chainRej, [functionArg, futureArg], assertValidFuture);

test('crashes when the given function does not return Future', function (){
  return assertCrashed(chainRej(bang)(rejected), new TypeError(
    'chainRej expects the return value from the function it\'s given to be a valid Future.\n' +
    '  Actual: "rejected!" :: String\n' +
    '  When called with: "rejected"'
  ));
});

test('calls the function with the rejection reason and sequences the returned Future', function (){
  return Promise.all([
    assertResolved(chainRej(resolve)(rejected), 'rejected'),
    assertResolved(chainRej(resolve)(rejectedSlow), 'rejectedSlow'),
    assertResolved(chainRej(reject)(resolved), 'resolved'),
    assertRejected(chainRej(reject)(rejected), 'rejected'),
    assertCrashed(chainRej(throwing)(rejected), error),
  ]);
});

test('displays correctly as string', function (){
  eq(chainRej(resolve)(resolved).toString(), 'chainRej (' + resolve.toString() + ') (resolve ("resolved"))');
});
