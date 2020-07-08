import {expectType, expectError} from 'tsd';

import * as fl from '../../index.js';

const mx = fl.resolve (42);
const mf = fl.resolve ((x: number) => x + 1);

const msx: fl.FutureInstance<string, number> = fl.resolve (42);
const mnx: fl.FutureInstance<number, number> = fl.resolve (42);
const msf: fl.FutureInstance<string, (x: number) => number> = fl.resolve ((x: number) => x + 1);

expectType<fl.FutureInstance<never, number>> (fl.ap (mx) (mf));
expectType<fl.FutureInstance<string, number>> (fl.ap (msx) (msf));
expectType<fl.FutureInstance<string | number, number>> (fl.ap (mnx) (msf));

expectType<fl.FutureInstance<never, never>> (fl.ap (fl.never) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.ap (mx) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.ap (fl.never) (mf));

expectType<fl.FutureInstance<never, never>> (fl.ap (fl.reject ('a')) (fl.never));
expectType<fl.FutureInstance<string, never>> (fl.ap (fl.never) (fl.reject ('a')));

expectType<fl.FutureInstance<string, never>> (fl.ap (fl.reject ('a')) (mf));
expectType<fl.FutureInstance<string, never>> (fl.ap (mx) (fl.reject ('a')));
expectType<fl.FutureInstance<number, never>> (fl.ap (fl.reject (42)) (fl.reject (42)));
expectType<fl.FutureInstance<number, never>> (fl.ap (fl.reject ('a')) (fl.reject (42)));

expectError (fl.ap (mx) (mx));
expectError (fl.ap (mf) (mf));

const cmx = fl.Par (fl.resolve (42));
const cmf = fl.Par (fl.resolve ((x: number) => x + 1));

const cmsx: fl.ConcurrentFutureInstance<string, number> = fl.Par (fl.resolve (42));
const cmnx: fl.ConcurrentFutureInstance<number, number> = fl.Par (fl.resolve (42));
const cmsf: fl.ConcurrentFutureInstance<string, (x: number) => number> = fl.Par (fl.resolve ((x: number) => x + 1));

expectType<fl.ConcurrentFutureInstance<never, number>> (fl.ap (cmx) (cmf));
expectType<fl.ConcurrentFutureInstance<string, number>> (fl.ap (cmsx) (cmsf));
expectType<fl.ConcurrentFutureInstance<string | number, number>> (fl.ap (cmnx) (cmsf));

expectType<fl.ConcurrentFutureInstance<never, never>> (fl.ap (fl.Par (fl.never)) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<never, never>> (fl.ap (cmx) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<never, never>> (fl.ap (fl.Par (fl.never)) (cmf));

expectType<fl.ConcurrentFutureInstance<string, never>> (fl.ap (fl.Par (fl.reject ('a'))) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<string, never>> (fl.ap (fl.Par (fl.never)) (fl.Par (fl.reject ('a'))));

expectType<fl.ConcurrentFutureInstance<string, never>> (fl.ap (fl.Par (fl.reject ('a'))) (cmf));
expectType<fl.ConcurrentFutureInstance<string, never>> (fl.ap (cmx) (fl.Par (fl.reject ('a'))));
expectType<fl.ConcurrentFutureInstance<number, never>> (fl.ap (fl.Par (fl.reject (42))) (fl.Par (fl.reject (42))));
expectType<fl.ConcurrentFutureInstance<string | number, never>> (fl.ap (fl.Par (fl.reject ('a'))) (fl.Par (fl.reject (42))));

expectError (fl.ap (cmx) (cmx));
expectError (fl.ap (cmf) (cmf));
