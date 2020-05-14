import jsv from 'jsverify';
import {Future, resolve, reject, Par, seq, extractLeft, extractRight} from '../index.js';

const noop = () => {};
const show = m => m.toString();

export const nil = jsv.elements([null, undefined]);

const immediatelyResolve = x => {
  const m = Future((rej, res) => { setImmediate(res, x); return noop });
  m.extractRight = () => [x];
  return m;
};

const immediatelyReject = x => {
  const m = Future((rej) => { setImmediate(rej, x); return noop });
  m.extractLeft = () => [x];
  return m;
};

export function AsyncResolvedFutureArb (arb){
  return arb.smap(immediatelyResolve, extractRight, show);
}

export function AsyncRejectedFutureArb (arb){
  return arb.smap(immediatelyReject, extractLeft, show);
}

export function ResolvedFutureArb (arb){
  return arb.smap(resolve, extractRight, show);
}

export function RejectedFutureArb (arb){
  return arb.smap(reject, extractLeft, show);
}

export function FutureArb (larb, rarb){
  return jsv.oneof(
    RejectedFutureArb(larb),
    ResolvedFutureArb(rarb),
    AsyncRejectedFutureArb(larb),
    AsyncResolvedFutureArb(rarb)
  );
}

export const {
  any,
  anyFuture,
  anyRejectedFuture,
  anyResolvedFuture,
  anyNonFuture,
  anyFunction,
} = jsv.letrec(tie => ({
  anyRejectedFuture: jsv.oneof(AsyncRejectedFutureArb(tie('any')), RejectedFutureArb(tie('any'))),
  anyResolvedFuture: jsv.oneof(AsyncResolvedFutureArb(tie('any')), ResolvedFutureArb(tie('any'))),
  anyFuture: jsv.oneof(tie('anyRejectedFuture'), tie('anyResolvedFuture')),
  anyFunction: jsv.fn(tie('any')),
  anyNonFuture: jsv.oneof(
    jsv.number,
    jsv.string,
    jsv.bool,
    jsv.falsy,
    jsv.constant(new Error('Kapot')),
    jsv.constant(Future),
    jsv.constant(Par),
    tie('anyFunction')
  ),
  any: jsv.oneof(
    tie('anyNonFuture'),
    tie('anyFuture')
  ),
}));

export const anyParallel = anyFuture.smap(Par, seq, show);
