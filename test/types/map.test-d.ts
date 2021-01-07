import {expectType} from 'tsd';

import * as fl from '../../index.js';

const resolved = fl.resolve (42);
const rejected = fl.reject ('uh-oh');

const resolvedPar = fl.Par (resolved);
const rejectedPar = fl.Par (rejected);

// Standard usage on Future instances.
expectType<fl.FutureInstance<never, string>> (fl.map (String) (resolved));
expectType<fl.FutureInstance<string, string>> (fl.map (String) (rejected));

// Standard usage on ConcurrentFuture instances.
expectType<fl.ConcurrentFutureInstance<never, string>> (fl.map (String) (resolvedPar));
expectType<fl.ConcurrentFutureInstance<string, string>> (fl.map (String) (rejectedPar));

// Usage with pipe on Future instances (https://git.io/JLx3F).
expectType<fl.FutureInstance<never, string>> (resolved .pipe (fl.map (String)));
expectType<fl.FutureInstance<string, string>> (rejected .pipe (fl.map (String)));
