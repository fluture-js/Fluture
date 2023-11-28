import {mapRej} from '../../index.js';
import {test, assertCrashed, assertRejected, assertResolved, assertValidFuture, bang, throwing, error, eq} from '../util/util.js';
import {rejected, resolved, resolvedSlow, rejectedSlow} from '../util/futures.js';
import {testFunction, functionArg, futureArg} from '../util/props.js';

testFunction('mapRej', mapRej, [functionArg, futureArg], assertValidFuture);

test('maps the rejection branch with the given function', function (){
  return Promise.all([
    assertRejected(mapRej(bang)(rejected), 'rejected!'),
    assertResolved(mapRej(bang)(resolved), 'resolved'),
    assertCrashed(mapRej(throwing)(rejected), error),
  ]);
});

test('does not resolve after being cancelled', function (done){
  const fail = () => done(error);
  mapRej(fail)(resolvedSlow)._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('does not reject after being cancelled', function (done){
  const fail = () => done(error);
  mapRej(fail)(rejectedSlow)._interpret(done, fail, fail)();
  setTimeout(done, 25);
});

test('displays correctly as string', function (){
  eq(mapRej(bang)(rejected).toString(), 'mapRej (' + bang.toString() + ') (reject ("rejected"))');
});
