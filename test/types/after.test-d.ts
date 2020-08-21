import {expectType} from 'tsd';

import * as fl from '../../index.js';

expectType<fl.FutureInstance<never, number>> (fl.after (1) (42));
expectType<fl.FutureInstance<never, string>> (fl.after (1) ('a'));
