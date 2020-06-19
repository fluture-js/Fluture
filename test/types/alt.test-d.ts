import {expectType} from 'tsd';

import * as fl from '../../index.js';

const fsn: fl.FutureInstance<string, number> = fl.resolve (42);
const fns: fl.FutureInstance<number, string> = fl.resolve ('a');

expectType<fl.FutureInstance<never, never>> (fl.alt (fl.never) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.alt (fl.reject ('a')) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.alt (fl.resolve ('a')) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.alt (fl.never) (fl.reject ('a')));
expectType<fl.FutureInstance<never, string>> (fl.alt (fl.never) (fl.resolve ('a')));
expectType<fl.FutureInstance<never, number>> (fl.alt (fl.reject ('a')) (fl.resolve (42)));
expectType<fl.FutureInstance<never, number>> (fl.alt (fl.resolve (42)) (fl.reject ('a')));
expectType<fl.FutureInstance<never, number>> (fl.alt (fl.resolve (42)) (fl.resolve (42)));
expectType<fl.FutureInstance<number, never>> (fl.alt (fl.reject (42)) (fl.reject (42)));
expectType<fl.FutureInstance<never, number>> (fl.alt (fl.resolve ('a')) (fl.resolve (42)));
expectType<fl.FutureInstance<string, never>> (fl.alt (fl.reject ('a')) (fl.reject (42)));
expectType<fl.FutureInstance<string, number | string>> (fl.alt (fsn) (fns));

const csn: fl.ConcurrentFutureInstance<string, number> = fl.Par (fl.resolve (42));
const cns: fl.ConcurrentFutureInstance<number, string> = fl.Par (fl.resolve ('a'));

expectType<fl.ConcurrentFutureInstance<never, never>> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<string, never>> (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<never, string>> (fl.alt (fl.Par (fl.resolve ('a'))) (fl.Par (fl.never)));
expectType<fl.ConcurrentFutureInstance<string, never>> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.reject ('a'))));
expectType<fl.ConcurrentFutureInstance<never, string>> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.resolve ('a'))));
expectType<fl.ConcurrentFutureInstance<string, number>> (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.resolve (42))));
expectType<fl.ConcurrentFutureInstance<string, number>> (fl.alt (fl.Par (fl.resolve (42))) (fl.Par (fl.reject ('a'))));
expectType<fl.ConcurrentFutureInstance<never, number>> (fl.alt (fl.Par (fl.resolve (42))) (fl.Par (fl.resolve (42))));
expectType<fl.ConcurrentFutureInstance<number, never>> (fl.alt (fl.Par (fl.reject (42))) (fl.Par (fl.reject (42))));
expectType<fl.ConcurrentFutureInstance<never, number | string>> (fl.alt (fl.Par (fl.resolve ('a'))) (fl.Par (fl.resolve (42))));
expectType<fl.ConcurrentFutureInstance<string | number, never>> (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.reject (42))));
expectType<fl.ConcurrentFutureInstance<string | number, number | string>> (fl.alt (csn) (cns));
