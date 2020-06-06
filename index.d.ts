/// <reference lib="es2015.generator" />
/// <reference lib="es2015.iterable" />

export interface RecoverFunction {
  (exception: Error): void
}

export interface RejectFunction<L> {
  (error: L): void
}

export interface ResolveFunction<R> {
  (value: R): void
}

export interface Cancel {
  (): void
}

export interface Nodeback<E, R> {
  (err: E | null, value?: R): void
}

export interface ConcurrentFutureInstance<L, R> {
  sequential: FutureInstance<L, R>
  'fantasy-land/ap'<A, B>(this: ConcurrentFutureInstance<L, (value: A) => B>, right: ConcurrentFutureInstance<L, A>): ConcurrentFutureInstance<L, B>
  'fantasy-land/map'<RB>(mapper: (value: R) => RB): ConcurrentFutureInstance<L, RB>
  'fantasy-land/alt'(right: ConcurrentFutureInstance<L, R>): ConcurrentFutureInstance<L, R>
}

export interface FutureInstance<L, R> {

  /** The Future constructor */
  constructor: FutureTypeRep

  /** Apply a function to this Future. See https://github.com/fluture-js/Fluture#pipe */
  pipe<T>(fn: (future: FutureInstance<L, R>) => T): T

  /** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
  extractLeft(): Array<L>

  /** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
  extractRight(): Array<R>

  'fantasy-land/ap'<A, B>(this: FutureInstance<L, (value: A) => B>, right: FutureInstance<L, A>): FutureInstance<L, B>
  'fantasy-land/map'<RB>(mapper: (value: R) => RB): FutureInstance<L, RB>
  'fantasy-land/alt'(right: FutureInstance<L, R>): FutureInstance<L, R>
  'fantasy-land/bimap'<LB, RB>(lmapper: (reason: L) => LB, rmapper: (value: R) => RB): FutureInstance<LB, RB>
  'fantasy-land/chain'<LB, RB>(mapper: (value: R) => FutureInstance<LB, RB>): FutureInstance<L | LB, RB>

}

/** Creates a Future which resolves after the given duration with the given value. See https://github.com/fluture-js/Fluture#after */
export function after(duration: number): <R>(value: R) => FutureInstance<never, R>

/** Logical and for Futures. See https://github.com/fluture-js/Fluture#and */
export function and<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, any>) => FutureInstance<L, R>

/** Logical or for Futures. See https://github.com/fluture-js/Fluture#alt */
export function alt<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

/** Race two ConcurrentFutures. See https://github.com/fluture-js/Fluture#alt */
export function alt<L, R>(left: ConcurrentFutureInstance<L, R>): (right: ConcurrentFutureInstance<L, R>) => ConcurrentFutureInstance<L, R>

/** Apply the function in the right Future to the value in the left Future. See https://github.com/fluture-js/Fluture#ap */
export function ap<L, RA>(value: FutureInstance<L, RA>): <RB>(apply: FutureInstance<L, (value: RA) => RB>) => FutureInstance<L, RB>

/** Apply the function in the right ConcurrentFuture to the value in the left ConcurrentFuture. See https://github.com/fluture-js/Fluture#ap */
export function ap<L, RA>(value: ConcurrentFutureInstance<L, RA>): <RB>(apply: ConcurrentFutureInstance<L, (value: RA) => RB>) => ConcurrentFutureInstance<L, RB>

/** Apply the function in the right Future to the value in the left Future in parallel. See https://github.com/fluture-js/Fluture#pap */
export function pap<L, RA>(value: FutureInstance<L, RA>): <RB>(apply: FutureInstance<L, (value: RA) => RB>) => FutureInstance<L, RB>

/** Create a Future which resolves with the return value of the given function, or rejects with the error it throws. See https://github.com/fluture-js/Fluture#attempt */
export function attempt<L, R>(fn: () => R): FutureInstance<L, R>

/** Convert a Promise-returning function to a Future. See https://github.com/fluture-js/Fluture#attemptP */
export function attemptP<L, R>(fn: () => Promise<R>): FutureInstance<L, R>

/** Create a Future using the inner value of the given Future. See https://github.com/fluture-js/Fluture#bichain */
export function bichain<LA, LB, RB>(lmapper: (reason: LA) => FutureInstance<LB, RB>): <RA>(rmapper: (value: RA) => FutureInstance<LB, RB>) => (source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>

/** Map over both branches of the given Bifunctor at once. See https://github.com/fluture-js/Fluture#bimap */
export function bimap<LA, LB>(lmapper: (reason: LA) => LB): <RA, RB>(rmapper: (value: RA) => RB) => (source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>

/** Wait for both Futures to resolve in parallel. See https://github.com/fluture-js/Fluture#both */
export function both<L, A>(left: FutureInstance<L, A>): <B>(right: FutureInstance<L, B>) => FutureInstance<L, [A, B]>

/** Cache the outcome of the given Future. See https://github.com/fluture-js/Fluture#cache */
export function cache<L, R>(source: FutureInstance<L, R>): FutureInstance<L, R>

/** Create a Future using the resolution value of the given Future. See https://github.com/fluture-js/Fluture#chain */
export function chain<LB, RA, RB>(mapper: (value: RA) => FutureInstance<LB, RB>): <LA>(source: FutureInstance<LA, RA>) => FutureInstance<LA | LB, RB>

/** Create a Future using the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#chain */
export function chainRej<LA, LB, RB>(mapper: (reason: LA) => FutureInstance<LB, RB>): <RA>(source: FutureInstance<LA, RA>) => FutureInstance<LB, RA | RB>

/** Fork the given Future into a Node-style callback. See https://github.com/fluture-js/Fluture#done */
export function done<L, R>(callback: Nodeback<L, R>): (source: FutureInstance<L, R>) => Cancel

/** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
export function encase<L, R, A>(fn: (a: A) => R): (a: A) => FutureInstance<L, R>

/** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
export function encaseP<L, R, A>(fn: (a: A) => Promise<R>): (a: A) => FutureInstance<L, R>

/** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
export function extractLeft<L, R>(source: FutureInstance<L, R>): Array<L>

/** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
export function extractRight<L, R>(source: FutureInstance<L, R>): Array<R>

/** Coalesce both branches into the resolution branch. See https://github.com/fluture-js/Fluture#coalesce */
export function coalesce<LA, R>(lmapper: (left: LA) => R): <RA>(rmapper: (right: RA) => R) => (source: FutureInstance<LA, RA>) => FutureInstance<never, R>

/** Fork the given Future into the given continuations. See https://github.com/fluture-js/Fluture#fork */
export function fork<L>(reject: RejectFunction<L>): <R>(resolve: ResolveFunction<R>) => (source: FutureInstance<L, R>) => Cancel

/** Fork with exception recovery. See https://github.com/fluture-js/Fluture#forkCatch */
export function forkCatch(recover: RecoverFunction): <L>(reject: RejectFunction<L>) => <R>(resolve: ResolveFunction<R>) => (source: FutureInstance<L, R>) => Cancel

/** Build a coroutine using Futures. See https://github.com/fluture-js/Fluture#go */
export function go<L, R>(generator: () => Generator<FutureInstance<L, any>, R, any>): FutureInstance<L, R>

/** Manage resources before and after the computation that needs them. See https://github.com/fluture-js/Fluture#hook */
export function hook<L, H>(acquire: FutureInstance<L, H>): (dispose: (handle: H) => FutureInstance<any, any>) => <R>(consume: (handle: H) => FutureInstance<L, R>) => FutureInstance<L, R>

/** Returns true for Futures. See https://github.com/fluture-js/Fluture#isfuture */
export function isFuture(value: any): boolean

/** Returns true for Futures that will certainly never settle. See https://github.com/fluture-js/Fluture#isnever */
export function isNever(value: any): boolean

/** Set up a cleanup Future to run after the given action has settled. See https://github.com/fluture-js/Fluture#lastly */
export function lastly<L>(cleanup: FutureInstance<L, any>): <R>(action: FutureInstance<L, R>) => FutureInstance<L, R>

/** Map over the resolution value of the given Future or ConcurrentFuture. See https://github.com/fluture-js/Fluture#map */
export function map<RA, RB>(mapper: (value: RA) => RB): <T extends FutureInstance<any, RA> | ConcurrentFutureInstance<any, RA>>(source: T) =>
  T extends FutureInstance<infer L, RA> ?
  FutureInstance<L, RB> :
  T extends ConcurrentFutureInstance<infer L, RA> ?
  ConcurrentFutureInstance<L, RB> :
  never;

/** Map over the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#maprej */
export function mapRej<LA, LB>(mapper: (reason: LA) => LB): <R>(source: FutureInstance<LA, R>) => FutureInstance<LB, R>

/** A Future that never settles. See https://github.com/fluture-js/Fluture#never */
export var never: FutureInstance<never, never>

/** Create a Future using a provided Node-style callback. See https://github.com/fluture-js/Fluture#node */
export function node<L, R>(fn: (done: Nodeback<L, R>) => void): FutureInstance<L, R>

/** Create a Future with the given resolution value. See https://github.com/fluture-js/Fluture#of */
export function resolve<R>(value: R): FutureInstance<never, R>

/** Run an Array of Futures in parallel, under the given concurrency limit. See https://github.com/fluture-js/Fluture#parallel */
export function parallel(concurrency: number): <L, R>(futures: Array<FutureInstance<L, R>>) => FutureInstance<L, Array<R>>

/** Convert a Future to a Promise. See https://github.com/fluture-js/Fluture#promise */
export function promise<R>(source: FutureInstance<Error, R>): Promise<R>

/** Race two Futures against one another. See https://github.com/fluture-js/Fluture#race */
export function race<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

/** Create a Future with the given rejection reason. See https://github.com/fluture-js/Fluture#reject */
export function reject<L>(reason: L): FutureInstance<L, never>

/** Creates a Future which rejects after the given duration with the given reason. See https://github.com/fluture-js/Fluture#rejectafter */
export function rejectAfter(duration: number): <L>(reason: L) => FutureInstance<L, never>

/** Convert a ConcurrentFuture to a regular Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
export function seq<L, R>(source: ConcurrentFutureInstance<L, R>): FutureInstance<L, R>

/** Swap the rejection reason and the resolution value. See https://github.com/fluture-js/Fluture#swap */
export function swap<L, R>(source: FutureInstance<L, R>): FutureInstance<R, L>

/** Fork the Future into the given continuation. See https://github.com/fluture-js/Fluture#value */
export function value<R>(resolve: ResolveFunction<R>): (source: FutureInstance<never, R>) => Cancel

/** Enable or disable debug mode. See https://github.com/fluture-js/Fluture#debugmode */
export function debugMode(debug: boolean): void;

export interface FutureTypeRep {

  /** Create a Future from a possibly cancellable computation. See https://github.com/fluture-js/Fluture#future */
  <L, R>(computation: (
    reject: RejectFunction<L>,
    resolve: ResolveFunction<R>
  ) => Cancel): FutureInstance<L, R>

  'fantasy-land/chainRec'<L, I, R>(iterator: (next: (value: I) => IteratorYieldResult<I>, done: (value: R) => IteratorReturnResult<R>, value: I) => FutureInstance<L, IteratorResult<I, R>>, initial: I): FutureInstance<L, R>
  'fantasy-land/of': typeof resolve

  '@@type': string

}

export var Future: FutureTypeRep
export default Future

export interface ConcurrentFutureTypeRep {

  /** Create a ConcurrentFuture using a Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
  <L, R>(source: FutureInstance<L, R>): ConcurrentFutureInstance<L, R>

  'fantasy-land/of'<L, R>(value: R): ConcurrentFutureInstance<L, R>
  'fantasy-land/zero'<L, R>(): ConcurrentFutureInstance<L, R>

  '@@type': string

}

export var Par: ConcurrentFutureTypeRep
