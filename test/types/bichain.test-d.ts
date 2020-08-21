import {expectType, expectError} from 'tsd';

import * as fl from '../../index.js';

const frej = (x: string) => fl.reject (x + '!');
const fres = (x: string) => fl.resolve (x + '!');
const grej = (y: number) => fl.reject (y + 1);
const gres = (y: number) => fl.resolve (y + 1);

const msx = fl.reject ('a');
const mxn = fl.resolve (42);
const msn: fl.FutureInstance<string, number> = fl.resolve (42);

expectType<fl.FutureInstance<string, never>> (fl.bichain (frej) (grej) (msx));
expectType<fl.FutureInstance<never, string>> (fl.bichain (fres) (gres) (msx));

expectType<fl.FutureInstance<number, never>> (fl.bichain (frej) (grej) (mxn));
expectType<fl.FutureInstance<never, number>> (fl.bichain (fres) (gres) (mxn));

expectType<fl.FutureInstance<string | number, never>> (fl.bichain (frej) (grej) (msn));
expectType<fl.FutureInstance<never, string | number>> (fl.bichain (fres) (gres) (msn));
expectType<fl.FutureInstance<number, string>> (fl.bichain (fres) (grej) (msn));
expectType<fl.FutureInstance<string, number>> (fl.bichain (frej) (gres) (msn));

expectType<fl.FutureInstance<never, never>> (fl.bichain (frej) (grej) (fl.never));
expectType<fl.FutureInstance<never, never>> (fl.bichain (fres) (gres) (fl.never));

expectError (fl.bichain (frej) (grej) (fl.reject (42)));
expectError (fl.bichain (frej) (grej) (fl.resolve ('a')));
expectError (fl.bichain (fres) (gres) (fl.reject (42)));
expectError (fl.bichain (fres) (gres) (fl.resolve ('a')));
