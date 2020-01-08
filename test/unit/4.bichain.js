import {bichain} from '../../index.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, eq, throwing, error} from '../util/util.js';
import {testFunction, functionArg, futureArg} from '../util/props.js';
import {resolvedSlow, resolved, rejected, rejectedSlow} from '../util/futures.js';
import {resolve, reject} from '../../index.js';

testFunction('bichain', bichain, [functionArg, functionArg, futureArg], assertValidFuture);

test('runs a bichain transformation on Futures', function (){
  return Promise.all([
    assertResolved(bichain(reject)(resolve)(resolved), 'resolved'),
    assertResolved(bichain(reject)(resolve)(resolvedSlow), 'resolvedSlow'),
    assertRejected(bichain(resolve)(reject)(resolved), 'resolved'),
    assertRejected(bichain(resolve)(reject)(resolvedSlow), 'resolvedSlow'),
    assertResolved(bichain(resolve)(reject)(rejected), 'rejected'),
    assertResolved(bichain(resolve)(reject)(rejectedSlow), 'rejectedSlow'),
    assertRejected(bichain(reject)(resolve)(rejected), 'rejected'),
    assertRejected(bichain(reject)(resolve)(rejectedSlow), 'rejectedSlow'),
    assertCrashed(bichain(throwing)(reject)(rejected), error),
    assertCrashed(bichain(resolve)(throwing)(resolved), error),
  ]);
});

test('displays correctly as string', function (){
  eq(bichain(resolve)(reject)(resolved).toString(), 'bichain (' + resolve.toString() + ') (' + reject.toString() + ') (resolve ("resolved"))');
});
