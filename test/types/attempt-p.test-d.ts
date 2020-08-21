import {expectType} from 'tsd';

import * as fl from '../../index.js';

expectType<fl.FutureInstance<never, number>> (fl.attemptP (() => Promise.resolve (42)));
expectType<fl.FutureInstance<unknown, never>> (fl.attemptP (() => Promise.reject ('a')));
