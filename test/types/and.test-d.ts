import {expectType} from 'tsd';

import * as fl from '../../index.js';

const fsn: fl.FutureInstance<string, number> = fl.resolve (42);
const fns: fl.FutureInstance<number, string> = fl.resolve ('a');

expectType<fl.FutureInstance<never, never>> (fl.and (fl.never) (fl.never));
expectType<fl.FutureInstance<string, never>> (fl.and (fl.never) (fl.reject ('a')));
expectType<fl.FutureInstance<never, never>> (fl.and (fl.never) (fl.resolve ('a')));
expectType<fl.FutureInstance<never, never>> (fl.and (fl.reject ('a')) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.and (fl.resolve ('a')) (fl.never));
expectType<fl.FutureInstance<string, never>> (fl.and (fl.resolve (42)) (fl.reject ('a')));
expectType<fl.FutureInstance<string, never>> (fl.and (fl.reject ('a')) (fl.resolve (42)));
expectType<fl.FutureInstance<never, number>> (fl.and (fl.resolve (42)) (fl.resolve (42)));
expectType<fl.FutureInstance<number, never>> (fl.and (fl.reject (42)) (fl.reject (42)));
expectType<fl.FutureInstance<string, number>> (fl.and (fsn) (fsn));
expectType<fl.FutureInstance<string | number, number>> (fl.and (fsn) (fns));
