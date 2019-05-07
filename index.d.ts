declare module 'fluture' {

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

  export interface Next<T> {
    done: boolean
    value: T
  }

  export interface Done<T> {
    done: boolean
    value: T
  }

  export interface Iterator<N, D> {
    next(value?: N): Next<N> | Done<D>
  }

  export interface Generator<Y, R> {
    (): Iterator<Y, R>
  }

  /** The function is waiting for two more arguments. */
  export interface AwaitingTwo<A, B, R> {
    (a: A, b: B): R
    (a: A): (b: B) => R
  }

  /** The function is waiting for three more arguments. */
  export interface AwaitingThree<A, B, C, R> {
    (a: A, b: B, c: C): R
    (a: A, b: B): (c: C) => R
    (a: A): AwaitingTwo<B, C, R>
  }

  export interface ConcurrentFutureInstance<L, R> {
    sequential: FutureInstance<L, R>
  }

  export interface FutureInstance<L, R> {

    /** Apply a function to this Future. See https://github.com/fluture-js/Fluture#pipe */
    pipe<T>(fn: (future: FutureInstance<L, R>) => T): T

    /** Logical and for Futures. See https://github.com/fluture-js/Fluture#and */
    and<RB>(right: FutureInstance<L, RB>): FutureInstance<L, RB>

    /** Logical or for Futures. See https://github.com/fluture-js/Fluture#alt */
    alt(right: FutureInstance<L, R>): FutureInstance<L, R>

    /** Apply the function in this Future to the value in another. See https://github.com/fluture-js/Fluture#ap */
    ap<A, B>(this: FutureInstance<L, (value: A) => B>, right: FutureInstance<L, A>): FutureInstance<L, B>

    /** Map over both branches of the Future at once. See https://github.com/fluture-js/Fluture#bimap */
    bimap<LB, RB>(lmapper: (reason: L) => LB, rmapper: (value: R) => RB): FutureInstance<LB, RB>

    /** Wait for this Future and the given one in parallel. See https://github.com/fluture-js/Fluture#both */
    both<RB>(right: FutureInstance<L, RB>): FutureInstance<L, [R, RB]>

    /** Use the resolution value in this Future to create the next Future. See https://github.com/fluture-js/Fluture#chain */
    chain<RB>(mapper: (value: R) => FutureInstance<L, RB>): FutureInstance<L, RB>

    /** Use the rejection reason in this Future to create the next Future. See https://github.com/fluture-js/Fluture#chainrej */
    chainRej<LB>(mapper: (reason: L) => FutureInstance<LB, R>): FutureInstance<LB, R>

    /** The Future constructor */
    constructor: FutureTypeRep

    /** Fork the Future into a Node-style callback. See https://github.com/fluture-js/Fluture#done */
    done(callback: Nodeback<L, R>): Cancel

    /** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
    extractLeft(): Array<L>

    /** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
    extractRight(): Array<R>

    /** Set up a cleanup Future to run after this one is done. See https://github.com/fluture-js/Fluture#finally */
    finally(cleanup: FutureInstance<L, any>): FutureInstance<L, R>

    /** Fold both branches into the resolution branch. See https://github.com/fluture-js/Fluture#fold */
    fold<LA, RA, LB, RB>(lmapper: (reason: LA) => RB, rmapper: (value: RA) => RB): FutureInstance<LB, RB>

    /** Fork the Future into the two given continuations. See https://github.com/fluture-js/Fluture#fork */
    fork(reject: RejectFunction<L>, resolve: ResolveFunction<R>): Cancel

    /** Fork with exception recovery. See https://github.com/fluture-js/Fluture#forkCatch */
    forkCatch(recover: RecoverFunction, reject: RejectFunction<L>, resolve: ResolveFunction<R>): Cancel

    /** Set up a cleanup Future to run after this one is done. See https://github.com/fluture-js/Fluture#finally */
    lastly(cleanup: FutureInstance<L, any>): FutureInstance<L, R>

    /** Map over the resolution value in this Future. See https://github.com/fluture-js/Fluture#map */
    map<RB>(mapper: (value: R) => RB): FutureInstance<L, RB>

    /** Map over the rejection reason in this Future. See https://github.com/fluture-js/Fluture#maprej */
    mapRej<LB>(mapper: (reason: L) => LB): FutureInstance<LB, R>

    /** Logical or for Futures. See https://github.com/fluture-js/Fluture#alt */
    or(right: FutureInstance<L, R>): FutureInstance<L, R>

    /** Fork the Future into a Promise. See https://github.com/fluture-js/Fluture#promise */
    promise(): Promise<R>

    /** Race this Future against another one. See https://github.com/fluture-js/Fluture#race */
    race(right: FutureInstance<L, R>): FutureInstance<L, R>

    /** Swap the rejection reason and the resolotion value. See https://github.com/fluture-js/Fluture#swap */
    swap(): FutureInstance<R, L>

    /** Fork this Future into the given continuation. See https://github.com/fluture-js/Fluture#value */
    value(this: FutureInstance<never, R>, resolve: ResolveFunction<R>): Cancel

  }

  /** Creates a Future which resolves after the given duration with the given value. See https://github.com/fluture-js/Fluture#after */
  export function after<L, R>(duration: number, value: R): FutureInstance<L, R>
  export function after<L, R>(duration: number): (value: R) => FutureInstance<L, R>

  /** Logical and for Futures. See https://github.com/fluture-js/Fluture#and */
  export function and<L, R>(left: FutureInstance<L, any>, right: FutureInstance<L, R>): FutureInstance<L, R>
  export function and<L, R>(left: FutureInstance<L, any>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

  /** Logical or for Futures. See https://github.com/fluture-js/Fluture#alt */
  export function alt<L, R>(left: FutureInstance<L, R>, right: FutureInstance<L, R>): FutureInstance<L, R>
  export function alt<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

  /** Race two ConcurrentFutures. See https://github.com/fluture-js/Fluture#alt */
  export function alt<L, R>(left: ConcurrentFutureInstance<L, R>, right: ConcurrentFutureInstance<L, R>): ConcurrentFutureInstance<L, R>
  export function alt<L, R>(left: ConcurrentFutureInstance<L, R>): (right: ConcurrentFutureInstance<L, R>) => ConcurrentFutureInstance<L, R>

  /** Apply the function in the left Future to the value in the right Future. See https://github.com/fluture-js/Fluture#ap */
  export function ap<L, RA, RB>(apply: FutureInstance<L, (value: RA) => RB>, value: FutureInstance<L, RA>): FutureInstance<L, RB>
  export function ap<L, RA, RB>(apply: FutureInstance<L, (value: RA) => RB>): (value: FutureInstance<L, RA>) => FutureInstance<L, RB>

  /** Apply the function in the left ConcurrentFuture to the value in the right ConcurrentFuture. See https://github.com/fluture-js/Fluture#ap */
  export function ap<L, RA, RB>(apply: ConcurrentFutureInstance<L, (value: RA) => RB>, value: ConcurrentFutureInstance<L, RA>): ConcurrentFutureInstance<L, RB>
  export function ap<L, RA, RB>(apply: ConcurrentFutureInstance<L, (value: RA) => RB>): (value: ConcurrentFutureInstance<L, RA>) => ConcurrentFutureInstance<L, RB>

  /** Create a Future which resolves with the return value of the given function, or rejects with the error it throws. See https://github.com/fluture-js/Fluture#try */
  export function attempt<L, R>(fn: () => R): FutureInstance<L, R>

  /** Map over both branched of the given Bifunctor at once. See https://github.com/fluture-js/Fluture#bimap */
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB, rmapper: (value: RA) => RB, source: FutureInstance<LA, RA>): FutureInstance<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB, rmapper: (value: RA) => RB): (source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB): (rmapper: (value: RA) => RB, source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB): (rmapper: (value: RA) => RB) => (source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>

  /** Wait for both Futures to resolve in parallel. See https://github.com/fluture-js/Fluture#both */
  export function both<L, A, B>(left: FutureInstance<L, A>, right: FutureInstance<L, B>): FutureInstance<L, [A, B]>
  export function both<L, A, B>(left: FutureInstance<L, A>): (right: FutureInstance<L, B>) => FutureInstance<L, [A, B]>

  /** Cache the outcome of the given Future. See https://github.com/fluture-js/Fluture#cache */
  export function cache<L, R>(source: FutureInstance<L, R>): FutureInstance<L, R>

  /** Create a Future using the resolution value of the given Future. See https://github.com/fluture-js/Fluture#chain */
  export function chain<L, RA, RB>(mapper: (value: RA) => FutureInstance<L, RB>, source: FutureInstance<L, RA>): FutureInstance<L, RB>
  export function chain<L, RA, RB>(mapper: (value: RA) => FutureInstance<L, RB>): (source: FutureInstance<L, RA>) => FutureInstance<L, RB>

  /** Create a Future using the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#chain */
  export function chainRej<LA, LB, R>(mapper: (reason: LA) => FutureInstance<LB, R>, source: FutureInstance<LA, R>): FutureInstance<LB, R>
  export function chainRej<LA, LB, R>(mapper: (reason: LA) => FutureInstance<LB, R>): (source: FutureInstance<LA, R>) => FutureInstance<LB, R>

  /** Fork the given Future into a Node-style callback. See https://github.com/fluture-js/Fluture#done */
  export function done<L, R>(callback: Nodeback<L, R>, source: FutureInstance<L, R>): Cancel
  export function done<L, R>(callback: Nodeback<L, R>): (source: FutureInstance<L, R>) => Cancel

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase<L, R, A>(fn: (a: A) => R, a: A): FutureInstance<L, R>
  export function encase<L, R, A>(fn: (a: A) => R): (a: A) => FutureInstance<L, R>

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R, a: A, b: B): FutureInstance<L, R>
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R, a: A): (b: B) => FutureInstance<L, R>
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R): AwaitingTwo<A, B, FutureInstance<L, R>>

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A, b: B, c: C): FutureInstance<L, R>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A, b: B): (c: C) => FutureInstance<L, R>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A): AwaitingTwo<B, C, FutureInstance<L, R>>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R): AwaitingThree<A, B, C, FutureInstance<L, R>>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN<L, R, A>(fn: (a: A, callback: Nodeback<L, R>) => void, a: A): FutureInstance<L, R>
  export function encaseN<L, R, A>(fn: (a: A, callback: Nodeback<L, R>) => void): (a: A) => FutureInstance<L, R>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void, a: A, b: B): FutureInstance<L, R>
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void, a: A): (b: B) => FutureInstance<L, R>
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void): AwaitingTwo<A, B, FutureInstance<L, R>>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A, b: B, c: C): FutureInstance<L, R>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A, b: B): (c: C) => FutureInstance<L, R>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A): AwaitingTwo<B, C, FutureInstance<L, R>>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void): AwaitingThree<A, B, C, FutureInstance<L, R>>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP<L, R, A>(fn: (a: A) => Promise<R>, a: A): FutureInstance<L, R>
  export function encaseP<L, R, A>(fn: (a: A) => Promise<R>): (a: A) => FutureInstance<L, R>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>, a: A, b: B): FutureInstance<L, R>
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>, a: A): (b: B) => FutureInstance<L, R>
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>): AwaitingTwo<A, B, FutureInstance<L, R>>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A, b: B, c: C): FutureInstance<L, R>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A, b: B): (c: C) => FutureInstance<L, R>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A): AwaitingTwo<B, C, FutureInstance<L, R>>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>): AwaitingThree<A, B, C, FutureInstance<L, R>>

  /** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
  export function extractLeft<L, R>(source: FutureInstance<L, R>): Array<L>

  /** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
  export function extractRight<L, R>(source: FutureInstance<L, R>): Array<R>

  /** Fold both branches into the resolution branch. See https://github.com/fluture-js/Fluture#fold */
  export function fold<LA, RA, LB, RB>(lmapper: (left: LA) => RB, rmapper: (right: RA) => RB, source: FutureInstance<LA, RA>): FutureInstance<LB, RB>
  export function fold<LA, RA, LB, RB>(lmapper: (left: LA) => RB, rmapper: (right: RA) => RB): (source: FutureInstance<LA, RA>) => FutureInstance<LB, RB>
  export function fold<LA, RA, LB, RB>(lmapper: (left: LA) => RB): AwaitingTwo<(right: RA) => RB, FutureInstance<LA, RA>, FutureInstance<LB, RB>>

  /** Fork the given Future into the given continuations. See https://github.com/fluture-js/Fluture#fork */
  export function fork<L, R>(reject: RejectFunction<L>, resolve: ResolveFunction<R>, source: FutureInstance<L, R>): Cancel
  export function fork<L, R>(reject: RejectFunction<L>, resolve: ResolveFunction<R>): (source: FutureInstance<L, R>) => Cancel
  export function fork<L, R>(reject: RejectFunction<L>): AwaitingTwo<ResolveFunction<R>, FutureInstance<L, R>, Cancel>

  /** Fork with exception recovery. See https://github.com/fluture-js/Fluture#forkCatch */
  export function forkCatch<L, R>(recover: RecoverFunction, reject: RejectFunction<L>, resolve: ResolveFunction<R>, source: FutureInstance<L, R>): Cancel
  export function forkCatch<L, R>(recover: RecoverFunction, reject: RejectFunction<L>, resolve: ResolveFunction<R>): (source: FutureInstance<L, R>) => Cancel
  export function forkCatch<L, R>(recover: RecoverFunction, reject: RejectFunction<L>): AwaitingTwo<ResolveFunction<R>, FutureInstance<L, R>, Cancel>
  export function forkCatch<L, R>(recover: RecoverFunction): AwaitingThree<RejectFunction<L>, ResolveFunction<R>, FutureInstance<L, R>, Cancel>

  /** Build a coroutine using Futures. See https://github.com/fluture-js/Fluture#go */
  export function go<L, R>(generator: Generator<FutureInstance<L, any>, R>): FutureInstance<L, R>

  /** Manage resources before and after the computation that needs them. See https://github.com/fluture-js/Fluture#hook */
  export function hook<L, H, R>(acquire: FutureInstance<L, H>, dispose: (handle: H) => FutureInstance<any, any>, consume: (handle: H) => FutureInstance<L, R>): FutureInstance<L, R>
  export function hook<L, H, R>(acquire: FutureInstance<L, H>, dispose: (handle: H) => FutureInstance<any, any>): (consume: (handle: H) => FutureInstance<L, R>) => FutureInstance<L, R>
  export function hook<L, H, R>(acquire: FutureInstance<L, H>): AwaitingTwo<(handle: H) => FutureInstance<any, any>, (handle: H) => FutureInstance<L, R>, FutureInstance<L, R>>

  /** Returns true for Futures. See https://github.com/fluture-js/Fluture#isfuture */
  export function isFuture(value: any): boolean

  /** Returns true for Futures that will certainly never settle. See https://github.com/fluture-js/Fluture#isnever */
  export function isNever(value: any): boolean

  /** Set up a cleanup Future to run after the given action has settled. See https://github.com/fluture-js/Fluture#lastly */
  export function lastly<L, R>(cleanup: FutureInstance<L, any>, action: FutureInstance<L, R>): FutureInstance<L, R>
  export function lastly<L, R>(cleanup: FutureInstance<L, any>): (action: FutureInstance<L, R>) => FutureInstance<L, R>

  /** Map over the resolution value of the given Future. See https://github.com/fluture-js/Fluture#map */
  export function map<L, RA, RB>(mapper: (value: RA) => RB, source: FutureInstance<L, RA>): FutureInstance<L, RB>
  export function map<L, RA, RB>(mapper: (value: RA) => RB): (source: FutureInstance<L, RA>) => FutureInstance<L, RB>

  /** Map over the resolution value of the given ConcurrentFuture. See https://github.com/fluture-js/Fluture#map */
  export function map<L, RA, RB>(mapper: (value: RA) => RB, source: ConcurrentFutureInstance<L, RA>): ConcurrentFutureInstance<L, RB>
  export function map<L, RA, RB>(mapper: (value: RA) => RB): (source: ConcurrentFutureInstance<L, RA>) => ConcurrentFutureInstance<L, RB>

  /** Map over the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#maprej */
  export function mapRej<LA, LB, R>(mapper: (reason: LA) => LB, source: FutureInstance<LA, R>): FutureInstance<LB, R>
  export function mapRej<LA, LB, R>(mapper: (reason: LA) => LB): (source: FutureInstance<LA, R>) => FutureInstance<LB, R>

  /** A Future that never settles. See https://github.com/fluture-js/Fluture#never */
  export var never: FutureInstance<never, never>

  /** Create a Future using a provided Node-style callback. See https://github.com/fluture-js/Fluture#node */
  export function node<L, R>(fn: (done: Nodeback<L, R>) => void): FutureInstance<L, R>

  /** Create a Future with the given resolution value. See https://github.com/fluture-js/Fluture#of */
  export function of<L, R>(value: R): FutureInstance<L, R>

  /** Create a Future with the given resolution value. See https://github.com/fluture-js/Fluture#of */
  export function resolve<L, R>(value: R): FutureInstance<L, R>

  /** Logical or for Futures. See https://github.com/fluture-js/Fluture#alt */
  export function or<L, R>(left: FutureInstance<L, R>, right: FutureInstance<L, R>): FutureInstance<L, R>
  export function or<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

  /** Run an Array of Futures in parallel, under the given concurrency limit. See https://github.com/fluture-js/Fluture#parallel */
  export function parallel<L, R>(concurrency: number, futures: Array<FutureInstance<L, R>>): FutureInstance<L, Array<R>>
  export function parallel<L, R>(concurrency: number): (futures: Array<FutureInstance<L, R>>) => FutureInstance<L, Array<R>>

  /** Convert a Future to a Promise. See https://github.com/fluture-js/Fluture#promise */
  export function promise<R>(source: FutureInstance<any, R>): Promise<R>

  /** Race two Futures against one another. See https://github.com/fluture-js/Fluture#race */
  export function race<L, R>(left: FutureInstance<L, R>, right: FutureInstance<L, R>): FutureInstance<L, R>
  export function race<L, R>(left: FutureInstance<L, R>): (right: FutureInstance<L, R>) => FutureInstance<L, R>

  /** Create a Future with the given rejection reason. See https://github.com/fluture-js/Fluture#reject */
  export function reject<L, R>(reason: L): FutureInstance<L, R>

  /** Creates a Future which rejects after the given duration with the given reason. See https://github.com/fluture-js/Fluture#rejectafter */
  export function rejectAfter<L, R>(duration: number, reason: L): FutureInstance<L, R>
  export function rejectAfter<L, R>(duration: number): (reason: L) => FutureInstance<L, R>

  /** Convert a ConcurrentFuture to a regular Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
  export function seq<L, R>(source: ConcurrentFutureInstance<L, R>): FutureInstance<L, R>

  /** Swap the rejection reason and the resolution value. See https://github.com/fluture-js/Fluture#swap */
  export function swap<L, R>(source: FutureInstance<L, R>): FutureInstance<R, L>

  /** Convert a Promise-returning function to a Future. See https://github.com/fluture-js/Fluture#tryP */
  export function tryP<L, R>(fn: () => Promise<R>): FutureInstance<L, R>

  /** Fork the Future into the given continuation. See https://github.com/fluture-js/Fluture#value */
  export function value<R>(resolve: ResolveFunction<R>, source: FutureInstance<never, R>): Cancel
  export function value<R>(resolve: ResolveFunction<R>): (source: FutureInstance<never, R>) => Cancel

  /** Enable or disable debug mode. See https://github.com/fluture-js/Fluture#debugmode */
  export function debugMode(debug: boolean): void;

  export interface FutureTypeRep {

    /** Create a Future from a possibly cancellable computation. See https://github.com/fluture-js/Fluture#future */
    <L, R>(computation: (
      reject: RejectFunction<L>,
      resolve: ResolveFunction<R>
    ) => Cancel | void): FutureInstance<L, R>

    /** Create a Future from a possibly cancellable computation. See https://github.com/fluture-js/Fluture#future */
    new <L, R>(computation: (
      reject: RejectFunction<L>,
      resolve: ResolveFunction<R>
    ) => Cancel | void): FutureInstance<L, R>

    /** Implementation of Fantasy Land ChainRec. */
    chainRec<L, I, R>(iterator: (next: (value: I) => Next<I>, done: (value: R) => Done<R>, value: I) => FutureInstance<L, Next<I> | Done<R>>, initial: I): FutureInstance<L, R>

    ap: typeof ap
    alt: typeof alt
    bimap: typeof bimap
    chain: typeof chain
    map: typeof map
    of: typeof resolve
    resolve: typeof resolve
    reject: typeof reject

    '@@type': string

  }

  export var Future: FutureTypeRep
  export default Future

  export interface ConcurrentFutureTypeRep {

    /** Create a ConcurrentFuture using a Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
    <L, R>(source: FutureInstance<L, R>): ConcurrentFutureInstance<L, R>

    of<L, R>(value: R): ConcurrentFutureInstance<L, R>
    zero<L, R>(): ConcurrentFutureInstance<L, R>

    ap: typeof ap
    map: typeof map
    alt: typeof alt

    '@@type': string

  }

  export var Par: ConcurrentFutureTypeRep

}
