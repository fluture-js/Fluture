import {expectType} from 'tsd';

import * as fl from '../../index.js';

expectType<fl.FutureInstance<unknown, number>> (fl.attempt (() => 42));
expectType<fl.FutureInstance<unknown, never>> (fl.attempt (() => { throw new Error }));
