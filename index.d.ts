declare module 'fluture' {

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

  export interface ConcurrentFuture<L, R> {
    sequential: Future<L, R>
  }

  export interface Future<L, R> {

    /** Logical and for Futures. See https://github.com/fluture-js/Fluture#and */
    and<RB>(right: Future<L, RB>): Future<L, RB>

    /** Apply the function in this Future to the value in another. See https://github.com/fluture-js/Fluture#ap */
    ap<A, B>(this: Future<L, (value: A) => B>, right: Future<L, A>): Future<L, B>

    /** Map over both branches of the Future at once. See https://github.com/fluture-js/Fluture#bimap */
    bimap<LB, RB>(lmapper: (reason: L) => LB, rmapper: (value: R) => RB): Future<LB, RB>

    /** Wait for this Future and the given one in parallel. See https://github.com/fluture-js/Fluture#both */
    both<RB>(right: Future<L, RB>): Future<L, [R, RB]>

    /** Use the resolution value in this Future to create the next Future. See https://github.com/fluture-js/Fluture#chain */
    chain<RB>(mapper: (value: R) => Future<L, RB>): Future<L, RB>

    /** Use the rejection reason in this Future to create the next Future. See https://github.com/fluture-js/Fluture#chainrej */
    chainRej<LB>(mapper: (reason: L) => Future<LB, R>): Future<LB, R>

    /** The Future constructor */
    constructor: Fluture

    /** Fork the Future into a Node-style callback. See https://github.com/fluture-js/Fluture#done */
    done(callback: Nodeback<L, R>): Cancel

    /** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
    extractLeft(): Array<L>

    /** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
    extractRight(): Array<R>

    /** Set up a cleanup Future to run after this one is done. See https://github.com/fluture-js/Fluture#finally */
    finally(cleanup: Future<L, any>): Future<L, R>

    /** Fold both branches into the resolution branch. See https://github.com/fluture-js/Fluture#fold */
    fold<RB>(lmapper: (reason: L) => RB, rmapper: (value: R) => RB): Future<never, RB>

    /** Fork the Future into the two given continuations. See https://github.com/fluture-js/Fluture#fork */
    fork(reject: RejectFunction<L>, resolve: ResolveFunction<R>): Cancel

    /** Set up a cleanup Future to run after this one is done. See https://github.com/fluture-js/Fluture#finally */
    lastly(cleanup: Future<L, any>): Future<L, R>

    /** Map over the resolution value in this Future. See https://github.com/fluture-js/Fluture#map */
    map<RB>(mapper: (value: R) => RB): Future<L, RB>

    /** Map over the rejection reason in this Future. See https://github.com/fluture-js/Fluture#maprej */
    mapRej<LB>(mapper: (reason: L) => LB): Future<LB, R>

    /** Logical or for Futures. See https://github.com/fluture-js/Fluture#or */
    or(right: Future<L, R>): Future<L, R>

    /** Fork the Future into a Promise. See https://github.com/fluture-js/Fluture#promise */
    promise(): Promise<R>

    /** Race this Future against another one. See https://github.com/fluture-js/Fluture#race */
    race(right: Future<L, R>): Future<L, R>

    /** Swap the rejection reason and the resolotion value. See https://github.com/fluture-js/Fluture#swap */
    swap(): Future<R, L>

    /** Fork this Future into the given continuation. See https://github.com/fluture-js/Fluture#value */
    value(this: Future<never, R>, resolve: ResolveFunction<R>): Cancel

  }

  /** Creates a Future which resolves after the given duration with the given value. See https://github.com/fluture-js/Fluture#after */
  export function after<R>(duration: number, value: R): Future<never, R>
  export function after<R>(duration: number): (value: R) => Future<never, R>

  /** Logical and for Futures. See https://github.com/fluture-js/Fluture#and */
  export function and<L, R>(left: Future<L, any>, right: Future<L, R>): Future<L, R>
  export function and<L, R>(left: Future<L, any>): (right: Future<L, R>) => Future<L, R>

  /** Race two ConcurrentFutures. See https://github.com/fluture-js/Fluture#alt */
  export function alt<L, R>(left: ConcurrentFuture<L, R>, right: ConcurrentFuture<L, R>): ConcurrentFuture<L, R>
  export function alt<L, R>(left: ConcurrentFuture<L, R>): (right: ConcurrentFuture<L, R>) => ConcurrentFuture<L, R>

  /** Apply the function in the left Future to the value in the right Future. See https://github.com/fluture-js/Fluture#ap */
  export function ap<L, RA, RB>(apply: Future<L, (value: RA) => RB>, value: Future<L, RA>): Future<L, RB>
  export function ap<L, RA, RB>(apply: Future<L, (value: RA) => RB>): (value: Future<L, RA>) => Future<L, RB>

  /** Apply the function in the left ConcurrentFuture to the value in the right ConcurrentFuture. See https://github.com/fluture-js/Fluture#ap */
  export function ap<L, RA, RB>(apply: ConcurrentFuture<L, (value: RA) => RB>, value: ConcurrentFuture<L, RA>): ConcurrentFuture<L, RB>
  export function ap<L, RA, RB>(apply: ConcurrentFuture<L, (value: RA) => RB>): (value: ConcurrentFuture<L, RA>) => ConcurrentFuture<L, RB>

  /** Create a Future which resolves with the return value of the given function, or rejects with the error it throws. See https://github.com/fluture-js/Fluture#try */
  export function attempt<L, R>(fn: () => R): Future<L, R>

  /** Map over both branched of the given Bifunctor at once. See https://github.com/fluture-js/Fluture#bimap */
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB, rmapper: (value: RA) => RB, source: Future<LA, RA>): Future<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB, rmapper: (value: RA) => RB): (source: Future<LA, RA>) => Future<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB): (rmapper: (value: RA) => RB, source: Future<LA, RA>) => Future<LB, RB>
  export function bimap<LA, LB, RA, RB>(lmapper: (reason: LA) => LB): (rmapper: (value: RA) => RB) => (source: Future<LA, RA>) => Future<LB, RB>

  /** Wait for both Futures to resolve in parallel. See https://github.com/fluture-js/Fluture#both */
  export function both<L, A, B>(left: Future<L, A>, right: Future<L, B>): Future<L, [A, B]>
  export function both<L, A, B>(left: Future<L, A>): (right: Future<L, B>) => Future<L, [A, B]>

  /** Cache the outcome of the given Future. See https://github.com/fluture-js/Fluture#cache */
  export function cache<L, R>(source: Future<L, R>): Future<L, R>

  /** Create a Future using the resolution value of the given Future. See https://github.com/fluture-js/Fluture#chain */
  export function chain<L, RA, RB>(mapper: (value: RA) => Future<L, RB>, source: Future<L, RA>): Future<L, RB>
  export function chain<L, RA, RB>(mapper: (value: RA) => Future<L, RB>): (source: Future<L, RA>) => Future<L, RB>

  /** Create a Future using the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#chain */
  export function chainRej<LA, LB, R>(mapper: (reason: LA) => Future<LA, R>, source: Future<LA, R>): Future<LB, R>
  export function chainRej<LA, LB, R>(mapper: (reason: LA) => Future<LA, R>): (source: Future<LA, R>) => Future<LB, R>

  /** Fork the given Future into a Node-style callback. See https://github.com/fluture-js/Fluture#done */
  export function done<L, R>(callback: Nodeback<L, R>, source: Future<L, R>): Cancel
  export function done<L, R>(callback: Nodeback<L, R>): (source: Future<L, R>) => Cancel

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase<L, R, A>(fn: (a: A) => R, a: A): Future<L, R>
  export function encase<L, R, A>(fn: (a: A) => R): (a: A) => Future<L, R>

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R, a: A, b: B): Future<L, R>
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R, a: A): (b: B) => Future<L, R>
  export function encase2<L, R, A, B>(fn: (a: A, b: B) => R): AwaitingTwo<A, B, Future<L, R>>

  /** Encase the given function such that it returns a Future of its return value. See https://github.com/fluture-js/Fluture#encase */
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A, b: B, c: C): Future<L, R>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A, b: B): (c: C) => Future<L, R>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R, a: A): AwaitingTwo<B, C, Future<L, R>>
  export function encase3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => R): AwaitingThree<A, B, C, Future<L, R>>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN<L, R, A>(fn: (a: A, callback: Nodeback<L, R>) => void, a: A): Future<L, R>
  export function encaseN<L, R, A>(fn: (a: A, callback: Nodeback<L, R>) => void): (a: A) => Future<L, R>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void, a: A, b: B): Future<L, R>
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void, a: A): (b: B) => Future<L, R>
  export function encaseN2<L, R, A, B>(fn: (a: A, b: B, callback: Nodeback<L, R>) => void): AwaitingTwo<A, B, Future<L, R>>

  /** Encase the given Node-style function such that it returns a Future of its result. See https://github.com/fluture-js/Fluture#encasen */
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A, b: B, c: C): Future<L, R>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A, b: B): (c: C) => Future<L, R>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void, a: A): AwaitingTwo<B, C, Future<L, R>>
  export function encaseN3<L, R, A, B, C>(fn: (a: A, b: B, c: C, callback: Nodeback<L, R>) => void): AwaitingThree<A, B, C, Future<L, R>>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP<L, R, A>(fn: (a: A) => Promise<R>, a: A): Future<L, R>
  export function encaseP<L, R, A>(fn: (a: A) => Promise<R>): (a: A) => Future<L, R>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>, a: A, b: B): Future<L, R>
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>, a: A): (b: B) => Future<L, R>
  export function encaseP2<L, R, A, B>(fn: (a: A, b: B) => Promise<R>): AwaitingTwo<A, B, Future<L, R>>

  /** Encase the given Promise-returning function such that it returns a Future of its resolution value. See https://github.com/fluture-js/Fluture#encasep */
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A, b: B, c: C): Future<L, R>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A, b: B): (c: C) => Future<L, R>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>, a: A): AwaitingTwo<B, C, Future<L, R>>
  export function encaseP3<L, R, A, B, C>(fn: (a: A, b: B, c: C) => Promise<R>): AwaitingThree<A, B, C, Future<L, R>>

  /** Attempt to extract the rejection reason. See https://github.com/fluture-js/Fluture#extractleft */
  export function extractLeft<L, R>(source: Future<L, R>): Array<L>

  /** Attempt to extract the resolution value. See https://github.com/fluture-js/Fluture#extractright */
  export function extractRight<L, R>(source: Future<L, R>): Array<R>

  /** Fold both branches into the resolution branch. See https://github.com/fluture-js/Fluture#fold */
  export function fold<LA, RA, RB>(lmapper: (left: LA) => RA, rmapper: (right: RA) => RB, source: Future<LA, RA>): Future<never, RB>
  export function fold<LA, RA, RB>(lmapper: (left: LA) => RA, rmapper: (right: RA) => RB): (source: Future<LA, RA>) => Future<never, RB>
  export function fold<LA, RA, RB>(lmapper: (left: LA) => RA): AwaitingTwo<(right: RA) => RB, Future<LA, RA>, Future<never, RB>>

  /** Fork the given Future into the given continuations. See https://github.com/fluture-js/Fluture#fork */
  export function fork<L, R>(reject: RejectFunction<L>, resolve: ResolveFunction<R>, source: Future<L, R>): Cancel
  export function fork<L, R>(reject: RejectFunction<L>, resolve: ResolveFunction<R>): (source: Future<L, R>) => Cancel
  export function fork<L, R>(reject: RejectFunction<L>): AwaitingTwo<ResolveFunction<R>, Future<L, R>, Cancel>

  /** Build a coroutine using Futures. See https://github.com/fluture-js/Fluture#go */
  export function go<L, R>(generator: Generator<Future<L, any>, R>): Future<L, R>

  /** Manage resources before and after the computation that needs them. See https://github.com/fluture-js/Fluture#hook */
  export function hook<L, H, R>(acquire: Future<L, H>, dispose: (handle: H) => Future<L, any>, consume: (handle: H) => Future<L, R>): Future<L, R>
  export function hook<L, H, R>(acquire: Future<L, H>, dispose: (handle: H) => Future<L, any>): (consume: (handle: H) => Future<L, R>) => Future<L, R>
  export function hook<L, H, R>(acquire: Future<L, H>): AwaitingTwo<(handle: H) => Future<L, any>, (handle: H) => Future<L, R>, Future<L, R>>

  /** Returns true for Futures. See https://github.com/fluture-js/Fluture#isfuture */
  export function isFuture(value: any): boolean

  /** Returns true for Futures that will certainly never settle. See https://github.com/fluture-js/Fluture#isnever */
  export function isNever(value: any): boolean

  /** Set up a cleanup Future to run after the given action has settled. See https://github.com/fluture-js/Fluture#lastly */
  export function lastly<L, R>(cleanup: Future<L, any>, action: Future<L, R>): Future<L, R>
  export function lastly<L, R>(cleanup: Future<L, any>): (action: Future<L, R>) => Future<L, R>

  /** Map over the resolution value of the given Future. See https://github.com/fluture-js/Fluture#map */
  export function map<L, RA, RB>(mapper: (value: RA) => RB, source: Future<L, RA>): Future<L, RB>
  export function map<L, RA, RB>(mapper: (value: RA) => RB): (source: Future<L, RA>) => Future<L, RB>

  /** Map over the resolution value of the given ConcurrentFuture. See https://github.com/fluture-js/Fluture#map */
  export function map<L, RA, RB>(mapper: (value: RA) => RB, source: ConcurrentFuture<L, RA>): ConcurrentFuture<L, RB>
  export function map<L, RA, RB>(mapper: (value: RA) => RB): (source: ConcurrentFuture<L, RA>) => ConcurrentFuture<L, RB>

  /** Map over the rejection reason of the given Future. See https://github.com/fluture-js/Fluture#maprej */
  export function mapRej<LA, LB, R>(mapper: (reason: LA) => LB, source: Future<LA, R>): Future<LB, R>
  export function mapRej<LA, LB, R>(mapper: (reason: LA) => LB): (source: Future<LA, R>) => Future<LB, R>

  /** A Future that never settles. See https://github.com/fluture-js/Fluture#never */
  export var never: Future<never, never>

  /** Create a Future using a provided Node-style callback. See https://github.com/fluture-js/Fluture#node */
  export function node<L, R>(fn: (done: Nodeback<L, R>) => void): Future<L, R>

  /** Create a Future with the given resolution value. See https://github.com/fluture-js/Fluture#of */
  export function of<R>(value: R): Future<never, R>

  /** Logical or for Futures. See https://github.com/fluture-js/Fluture#or */
  export function or<L, R>(left: Future<L, R>, right: Future<L, R>): Future<L, R>
  export function or<L, R>(left: Future<L, R>): (right: Future<L, R>) => Future<L, R>

  /** Run an Array of Futures in parallel, under the given concurrency limit. See https://github.com/fluture-js/Fluture#parallel */
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>, Future<L, R9>, Future<L, R10>]): Future<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>, Future<L, R9>, Future<L, R10>]) => Future<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8, R9>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>, Future<L, R9>]): Future<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8, R9>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>, Future<L, R9>]) => Future<L, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>]): Future<L, [R1, R2, R3, R4, R5, R6, R7, R8]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7, R8>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>, Future<L, R8>]) => Future<L, [R1, R2, R3, R4, R5, R6, R7, R8]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>]): Future<L, [R1, R2, R3, R4, R5, R6, R7]>
  export function parallel<L, R1, R2, R3, R4, R5, R6, R7>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>, Future<L, R7>]) => Future<L, [R1, R2, R3, R4, R5, R6, R7]>
  export function parallel<L, R1, R2, R3, R4, R5, R6>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>]): Future<L, [R1, R2, R3, R4, R5, R6]>
  export function parallel<L, R1, R2, R3, R4, R5, R6>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>, Future<L, R6>]) => Future<L, [R1, R2, R3, R4, R5, R6]>
  export function parallel<L, R1, R2, R3, R4, R5>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>]): Future<L, [R1, R2, R3, R4, R5]>
  export function parallel<L, R1, R2, R3, R4, R5>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>, Future<L, R5>]) => Future<L, [R1, R2, R3, R4, R5]>
  export function parallel<L, R1, R2, R3, R4>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>]): Future<L, [R1, R2, R3, R4]>
  export function parallel<L, R1, R2, R3, R4>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>, Future<L, R4>]) => Future<L, [R1, R2, R3, R4]>
  export function parallel<L, R1, R2, R3>(concurrency: number, values: [Future<L, R1>, Future<L, R2>, Future<L, R3>]): Future<L, [R1, R2, R3]>    
  export function parallel<L, R1, R2, R3>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>, Future<L, R3>]) => Future<L, [R1, R2, R3]>  
  export function parallel<L, R1, R2>(concurrency: number, values: [Future<L, R1>, Future<L, R2>]): Future<L, [R1, R2]>
  export function parallel<L, R1, R2>(concurrency: number): (values: [Future<L, R1>, Future<L, R2>]) => Future<L, [R1, R2]>
  export function parallel<L, R>(concurrency: number, futures: Array<Future<L, R>>): Future<L, Array<R>>
  export function parallel<L, R>(concurrency: number): (futures: Array<Future<L, R>>) => Future<L, Array<R>>

  /** Convert a Future to a Promise. See https://github.com/fluture-js/Fluture#promise */
  export function promise<R>(source: Future<any, R>): Promise<R>

  /** Race two Futures against one another. See https://github.com/fluture-js/Fluture#race */
  export function race<L, R>(left: Future<L, R>, right: Future<L, R>): Future<L, R>
  export function race<L, R>(left: Future<L, R>): (right: Future<L, R>) => Future<L, R>

  /** Create a Future with the given rejection reason. See https://github.com/fluture-js/Fluture#reject */
  export function reject<L>(reason: L): Future<L, never>

  /** Creates a Future which rejects after the given duration with the given reason. See https://github.com/fluture-js/Fluture#rejectafter */
  export function rejectAfter<L>(duration: number, reason: L): Future<L, never>
  export function rejectAfter<L>(duration: number): (reason: L) => Future<L, never>

  /** Convert a ConcurrentFuture to a regular Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
  export function seq<L, R>(source: ConcurrentFuture<L, R>): Future<L, R>

  /** Swap the rejection reason and the resolution value. See https://github.com/fluture-js/Fluture#swap */
  export function swap<L, R>(source: Future<L, R>): Future<R, L>

  /** Convert a Promise-returning function to a Future. See https://github.com/fluture-js/Fluture#tryP */
  export function tryP<L, R>(fn: () => Promise<R>): Future<L, R>

  /** Fork the Future into the given continuation. See https://github.com/fluture-js/Fluture#value */
  export function value<R>(resolve: ResolveFunction<R>, source: Future<never, R>): Cancel
  export function value<R>(resolve: ResolveFunction<R>): (source: Future<never, R>) => Cancel

  export interface Fluture {

    /** Create a Future from a possibly cancellable computation. See https://github.com/fluture-js/Fluture#future */
    <L, R>(computation: (
      reject: RejectFunction<L>,
      resolve: ResolveFunction<R>
    ) => Cancel | void): Future<L, R>

    /** Create a Future from a possibly cancellable computation. See https://github.com/fluture-js/Fluture#future */
    new <L, R>(computation: (
      reject: RejectFunction<L>,
      resolve: ResolveFunction<R>
    ) => Cancel | void): Future<L, R>

    /** Implementation of Fantasy Land ChainRec. */
    chainRec<L, I, R>(iterator: (next: (value: I) => Next<I>, done: (value: R) => Done<R>, value: I) => Future<L, Next<I> | Done<R>>, initial: I): Future<L, R>

    ap: typeof ap
    bimap: typeof bimap
    chain: typeof chain
    map: typeof map
    of: typeof of
    reject: typeof reject

    '@@type': string

  }

  export var Future: Fluture
  export default Future

  export interface Par {

    /** Create a ConcurrentFuture using a Future. See https://github.com/fluture-js/Fluture#concurrentfuture */
    <L, R>(source: Future<L, R>): ConcurrentFuture<L, R>

    of<R>(value: R): ConcurrentFuture<never, R>
    zero(): ConcurrentFuture<never, never>

    ap: typeof ap
    map: typeof map
    alt: typeof alt

    '@@type': string

  }

  export var Par: Par

}
