# Fluture

[![NPM Version](https://badge.fury.io/js/fluture.svg)](https://www.npmjs.com/package/fluture)
[![Dependencies](https://david-dm.org/avaq/fluture.svg)](https://david-dm.org/avaq/fluture)
[![Build Status](https://travis-ci.org/Avaq/Fluture.svg?branch=master)](https://travis-ci.org/Avaq/Fluture)
[![Code Coverage](https://codecov.io/gh/Avaq/Fluture/branch/master/graph/badge.svg)](https://codecov.io/gh/Avaq/Fluture)

Fluture offers a control structure similar to Promises, Tasks, Deferreds, and
what-have-you. Let's call them Futures.

Much like Promises, Futures represent the value arising from the success or
failure of an asynchronous operation (I/O). Though unlike Promises Futures are
*lazy* and *monadic* by design. They conform to the [Fantasy Land][1] algebraic
JavaScript specification.

Fluture boasts the following features:

* Fine-grained control over asynchronous flow through generic monadic
  transformations and an array of control utilities.
* [Cancellation](#future).
* [Resource management utilities](#resource-management).
* Plays nicely with functional libraries such as [Ramda][20] and [Sanctuary][21].
* Provides a pleasant debugging experience through informative error messages.
* Considerable performance benefits over Promises and the likes.

For more information:

* [Wiki: Compare Futures to Promises][22]
* [Wiki: Compare Fluture to similar libraries][15]
* [Video: Monad a Day by @DrBoolean - Futures][23]

## Usage

> `npm install --save fluture` <sup>Requires a node 4.0.0 compatible environment</sup>

```js
const fs = require('fs');
const Future = require('fluture');

const getPackageName = file =>
  Future.node(done => fs.readFile(file, 'utf8', done))
  .chain(Future.encase(JSON.parse))
  .map(x => x.name);

getPackageName('package.json')
.fork(console.error, console.log);
//> "fluture"
```

## Table of contents

- [Usage](#usage)
- [Interoperability](#interoperability)
- [Documentation](#documentation)
  1. [Type signatures](#type-signatures)
  1. [Creating Futures](#creating-futures)
    * [Future](#future)
    * [of](#of)
    * [reject](#reject)
    * [after](#after)
    * [cast](#cast)
    * [try](#try)
    * [encase](#encase)
    * [node](#node)
    * [chainRec](#chainrec)
  1. [Transforming Futures](#transforming-futures)
    * [map](#map)
    * [bimap](#bimap)
    * [chain](#chain)
    * [ap](#ap)
    * [swap](#swap)
  1. [Error handling](#error-handling)
    * [mapRej](#maprej)
    * [chainRej](#chainrej)
    * [fold](#fold)
  1. [Resource management](#resource-management)
    * [hook](#hook)
    * [finally](#finally)
  1. [Consuming Futures](#consuming-futures)
    * [fork](#fork)
    * [value](#value)
    * [then](#then)
  1. [Parallelism](#parallelism)
    * [race](#race)
    * [or](#or)
    * [parallel](#parallel)
  1. [Utility functions](#utility-functions)
    * [isFuture](#isfuture)
    * [isForkable](#isforkable)
    * [cache](#cache)
    * [do](#do)
  1. [Futurization](#futurization)
- [Benchmarks](#benchmarks)
- [The name](#the-name)

## Interoperability

[<img src="https://promisesaplus.com/assets/logo-small.png" align="right" height="82" alt="Promises/A+" />][1]
[<img src="https://raw.github.com/fantasyland/fantasy-land/master/logo.png" align="right" height="82" alt="Fantasy Land" />][27]
[<img src="https://raw.githubusercontent.com/rpominov/static-land/master/logo/logo.png" align="right" height="82" alt="Static Land" />][25]

Fluture implements [FantasyLand 1.x][1] and [Static Land][25] compatible
`Functor`, `Bifunctor`, `Apply`, `Applicative`, `Chain`, `ChainRec` and `Monad`.

## Documentation

### Type signatures

[Hindley-Milner][9] type signatures are used to document functions. Signatures
starting with a `.` refer to "static" functions, whereas signatures starting
with a `#` refer to functions on the prototype.

A list of all types used within the signatures follows:

- **Forkable** - Any Object with a `fork` method that takes at least two
  arguments. This includes instances of Fluture, instances of Task from
  [`data.task`][10] or instances of Future from [`ramda-fantasy`][11].
- **Future** - Instances of Future provided by Fluture.
- **Functor** - Values which conform to the [Fantasy Land Functor specification][12].
- **Bifunctor** - Values which conform to the [Fantasy Land Bifunctor specification][24].
- **Chain** - Values which conform to the [Fantasy Land Chain specification][13].
- **Apply** - Values which conform to the [Fantasy Land Apply specification][14].
- **Iterator** - Objects with `next`-methods which conform to the [Iterator protocol][18].
- **Iteration** - `{done, value}`-Objects as defined by the [Iterator protocol][18].
- **Next** - An incomplete (`{done: false}`) Iteration.
- **Done** - A complete (`{done: true}`) Iteration.
- **Cancel** - The nullary cancellation functions returned from computations.

### Creating Futures

#### Future
##### `Future :: ((a -> ()), (b -> ()) -> Cancel) -> Future a b`

Creates a Future with the given computation. A computation is a function which
takes two callbacks. Both are continuations for the computation. The first is
`reject`, commonly abbreviated to `rej`. The second `resolve`, which abbreviates
to `res`. When the computation is finished (possibly asynchronously) it may call
the appropriate continuation with a failure or success value.

```js
Future(function computation(reject, resolve){
  //Asynchronous work:
  const x = setTimeout(resolve, 3000, 'world');
  //Cancellation:
  return () => clearTimeout(x);
});
```

Additionally, the computation may return a nullary function containing
cancellation logic. This function is executed when the Future is cancelled
after it's [forked](#fork).

#### of
##### `#of :: a -> Future _ a`
##### `.of :: a -> Future _ a`

Creates a Future which immediately resolves with the given value. This function
is compliant with the [Fantasy Land Applicative specification][16] and is
also available on the prototype.

```js
const eventualThing = Future.of('world');
eventualThing.fork(
  console.error,
  thing => console.log(`Hello ${thing}!`)
);
//> "Hello world!"
```

#### reject
##### `.reject :: a -> Future a _`

Creates a Future which immediately rejects with the given value. Just like `of`
but for the rejection branch.

#### after
##### `.after :: Number -> b -> Future a b`

Creates a Future which resolves with the given value after n milliseconds.

```js
const eventualThing = Future.after(500, 'world');
eventualThing.fork(console.error, thing => console.log(`Hello ${thing}!`));
//> "Hello world!"
```

#### cast
##### `.cast :: Forkable a b -> Future a b`

Cast any [Forkable](#type-signatures) to a [Future](#type-signatures).

```js
Future.cast(require('data.task').of('hello')).value(console.log);
//> "hello"
```

#### try
##### `.try :: (() -> !a | b) -> Future a b`

Creates a Future which resolves with the result of calling the given function,
or rejects with the error thrown by the given function.

Sugar for `Future.encase(f, undefined)`.

```js
const data = {foo: 'bar'}
Future.try(() => data.foo.bar.baz)
.fork(console.error, console.log)
//> [TypeError: Cannot read property 'baz' of undefined]
```

#### encase
##### `.encase :: (a -> !e | r) -> a -> Future e r`
##### `.encase2 :: (a, b -> !e | r) -> a -> b -> Future e r`
##### `.encase3 :: (a, b, c -> !e | r) -> a -> b -> c -> Future e r`

Takes a function and a value, and returns a Future which when forked calls the
function with the value and resolves with the result. If the function throws
an exception, it is caught and the Future will reject with the exception:

```js
const data = '{"foo" = "bar"}'
Future.encase(JSON.parse, data)
.fork(console.error, console.log)
//! [SyntaxError: Unexpected token =]
```

Partially applying `encase` with a function `f` allows us to create a "safe"
version of `f`. Instead of throwing exceptions, the encased version always
returns a Future when given the remaining argument(s):

```js
const data = '{"foo" = "bar"}'
const safeJsonParse = Future.encase(JSON.parse)
safeJsonParse(data).fork(console.error, console.log)
//! [SyntaxError: Unexpected token =]
```

Furthermore; `encase2` and `encase3` are binary and ternary versions of
`encase`, applying two or three arguments to the given function respectively.

#### node
##### `.node :: ((a, b -> ()) -> ()) -> Future a b`

Creates a Future which rejects with the first argument given to the function,
or resolves with the second if the first is not present.

This is a convenience for NodeJS users who wish to easily obtain a Future from
a node style callback API. To permanently turn a function into one that returns
a Future, check out [futurization](#futurization).

```js
Future.node(done => fs.readFile('package.json', 'utf8', done))
.fork(console.error, console.log)
//> "{...}"
```

#### chainRec
##### `.chainRec :: ((b -> Next, c -> Done, b) -> Future a Iteration) -> b -> Future a c`

Stack- and memory-safe asynchronous "recursion" based on [FantasyLand ChainRec][26].

Calls the given function with the initial value (as third argument), and expects
a Future of an [Iteration](#type-signatures). If the Iteration is incomplete
(`{done: false}`), then the function is called again with the Iteration value
until it returns a Future of a complete (`{done: true}`) Iteration.

For convenience and interoperability, the first two arguments passed to the
function are functions for creating an incomplete Iteration, and for creating a
complete Iteration, respectively.

```js
Future.chainRec((next, done, x) => Future.of(x < 1000000 ? next(x + 1) : done(x)), 0)
.fork(console.error, console.log);
//> 1000000
```

### Transforming Futures

#### map
##### `#map :: Future a b ~> (b -> c) -> Future a c`
##### `.map :: Functor m => (a -> b) -> m a -> m b`

Transforms the resolution value inside the Future, and returns a new Future with
the transformed value. This is like doing `promise.then(x => x + 1)`, except
that it's lazy, so the transformation will not be applied before the Future is
forked. The transformation is only applied to the resolution branch: If the
Future is rejected, the transformation is ignored. To learn more about the exact
behaviour of `map`, check out its [spec][12].

```js
Future.of(1)
.map(x => x + 1)
.fork(console.error, console.log);
//> 2
```

#### bimap
##### `#bimap :: Future a b ~> (a -> c) -> (b -> d) -> Future c d`
##### `.bimap :: Bifunctor m => (a -> b) -> (c -> d) -> m a c -> m b d`

Maps the left function over the rejection value, or the right function over the
resolution value, depending on which is present.

```js
Future.of(1)
.bimap(x => x + '!', x => x + 1)
.fork(console.error, console.log);
//> 2

Future.reject('error')
.bimap(x => x + '!', x => x + 1)
.fork(console.error, console.log);
//> "error!"
```

#### chain
##### `#chain :: Future a b ~> (b -> Future a c) -> Future a c`
##### `.chain :: Chain m => (a -> m b) -> m a -> m b`

Allows the creation of a new Future based on the resolution value. This is like
doing `promise.then(x => Promise.resolve(x + 1))`, except that it's lazy, so the
new Future will not be created until the other one is forked. The function is
only ever applied to the resolution value; it's ignored when the Future was
rejected. To learn more about the exact behaviour of `chain`, check out its [spec][13].

```js
Future.of(1)
.chain(x => Future.of(x + 1))
.fork(console.error, console.log);
//> 2
```

Note that, due to its lazy nature, the stack and/or heap will slowly fill up as
you chain more over the same structure. It's therefore recommended that you use
[`chainRec`](#chainrec) in cases where you wish to `chain` recursively or
traverse a large list (10000+ items).

#### ap
##### `#ap :: Future a b ~> Future a (b -> c) -> Future a c`
##### `.ap :: Apply m => m (a -> b) -> m a -> m b`

Applies the function contained in the right-hand Future to the value contained
in the left-hand Future. Both Futures involved will run in parallel, and if one
rejects the resulting Future will also be rejected. To learn more about the
exact behaviour of `ap`, check out its [spec][14].

```js
Future.of(1)
.ap(Future.of(x => x + 1))
.fork(console.error, console.log);
//> 2
```

#### swap
##### `#swap :: Future a b ~> Future b a`
##### `.swap :: Future a b -> Future b a`

Resolve with the rejection reason, or reject with the resolution value.

```js
Future.of(new Error('It broke')).swap().fork(console.error, console.log);
//! [It broke]

Future.reject('Nothing broke').swap().fork(console.error, console.log);
//> "Nothing broke"
```

### Error handling

Functions listed under this category allow you to get at or transform the
rejection reason in Futures, or even coerce Futures back into the resolution
branch in several different ways.

#### mapRej
##### `#mapRej :: Future a b ~> (a -> c) -> Future c b`
##### `.mapRej :: (a -> b) -> Future a c -> Future b c`

Map over the **rejection** reason of the Future. This is like `map`, but for the
rejection branch.

```js
Future.reject(new Error('It broke!')).mapRej(err => {
  return new Error('Some extra info: ' + err.message);
})
.fork(console.error, console.log)
//! [Some extra info: It broke!]
```

#### chainRej
##### `#chainRej :: Future a b ~> (a -> Future a c) -> Future a c`
##### `.chainRej :: (a -> Future a c) -> Future a b -> Future a c`

Chain over the **rejection** reason of the Future. This is like `chain`, but for
the rejection branch.

```js
Future.reject(new Error('It broke!')).chainRej(err => {
  console.error(err);
  return Future.of('All is good')
})
.fork(console.error, console.log)
//> "All is good"
```

#### fold
##### `#fold :: Future a b ~> (a -> c), (b -> c) -> Future _ c`
##### `.fold :: (a -> c) -> (b -> c) -> Future a b -> Future _ c`

Applies the left function to the rejection value, or the right function to the
resolution value, depending on which is present, and resolves with the result.

This provides a convenient means to ensure a Future is always resolved. It can
be used with other type constructors, like [`S.Either`][7], to maintain a
representataion of failures:

```js
Future.of('hello')
.fold(S.Left, S.Right)
.value(console.log);
//> Right('hello')

Future.reject('it broke')
.fold(S.Left, S.Right)
.value(console.log);
//> Left('it broke')
```

### Resource management

Functions listed under this category allow for more fine-grained control over
the flow of acquired values.

#### hook
##### `#hook :: Future a b ~> (b -> Future a c) -> (b -> Future a d) -> Future a d`
##### `.hook :: Future a b -> (b -> Future a c) -> (b -> Future a d) -> Future a d`

Much like [`chain`](#chain), but takes a "dispose" operation first, which runs
*after* the second settles (successfully or unsuccessfully). So the signature is
like `hook(acquire, dispose, consume)`, where `acquire` is a Future which might
create connections, open file handlers, etc. `dispose` is a function that takes
the result from `acquire` and should be used to clean up (close connections etc)
and `consume` also takes the result from `acquire`, and may be used to perform
any arbitrary computations using the resource. The resolution value of `dispose`
is ignored.

```js
const withConnection = Future.hook(
  openConnection('localhost'),
  closeConnection
);

withConnection(
  conn => query(conn, 'EAT * cakes FROM bakery')
)
.fork(console.error, console.log)
```

In the case that a hooked Future is *cancelled* after the resource was acquired,
`dispose` will be executed and immediately cancelled. This means that rejections
which may happen during this disposal are **silently ignored**. To ensure that
resources are disposed during cancellation, you might synchronously dispose
resources in the `cancel` function of the disposal Future:

```js
const closeConnection = conn => Future((rej, res) => {

  //We try to dispose gracefully.
  conn.flushGracefully(err => {
    if(err === null){
      conn.close();
      res();
    }else{
      rej(err);
    }
  });

  //On cancel, we force dispose.
  return () => conn.close();

});
```

#### finally
##### `#finally :: Future a b ~> Future a c -> Future a b`
##### `.finally :: Future a c -> Future a b -> Future a b`

Run a second Future after the first settles (successfully or unsuccessfully).
Rejects with the rejection reason from the first or second Future, or resolves
with the resolution value from the first Future.

```js
Future.of('Hello')
.finally(Future.of('All done!').map(console.log))
.fork(console.error, console.log)
//> "All done!"
//> "Hello"
```

Note that the *first* Future is given as the *last* argument to `Future.finally()`:

```js
const program = S.pipe([
  Future.of,
  Future.finally(Future.of('All done!').map(console.log)),
  Future.fork(console.error, console.log)
])

program('Hello')
//> "All done!"
//> "Hello"
```

### Consuming Futures

#### fork
##### `#fork :: Future a b ~> (a -> ()), (b -> ()) -> Cancel`
##### `.fork :: (a -> ()) -> (b -> ()) -> Future a b -> Cancel`

Execute the computation that was passed to the Future at [construction](#future)
using the given `reject` and `resolve` callbacks.

```js
Future.of('world').fork(
  err => console.log(`Oh no! ${err.message}`),
  thing => console.log(`Hello ${thing}!`)
);
//> "Hello world!"

Future.reject(new Error('It broke!')).fork(
  err => console.log(`Oh no! ${err.message}`),
  thing => console.log(`Hello ${thing}!`)
);
//> "Oh no! It broke!"

const consoleFork = Future.fork(console.error, console.log);
consoleFork(Future.of('Hello'));
//> "Hello"
```

After you `fork` a Future, the computation will start running. If you wish to
cancel the computation, you may use the function returned by `fork`:

```js
const fut = Future.after(300, 'hello');
const cancel = fut.fork(console.error, console.log);
cancel();
//Nothing will happen. The Future was cancelled before it could settle.
```

#### value
##### `#value :: Future a b ~> (b -> ()) -> Cancel`
##### `.value :: (b -> ()) -> Future a b -> Cancel`

Extracts the value from a resolved Future by forking it. Only use this function
if you are sure the Future is going to be resolved, for example; after using
`.fold()`. If the Future rejects and `value` was used, an (likely uncatchable)
`Error` will be thrown.

```js
Future.reject(new Error('It broke'))
.fold(S.Left, S.Right)
.value(console.log)
//> Left([Error: It broke])
```

Just like [fork](#fork), `value` returns the `Cancel` function:

```js
Future.after(300, 'hello').value(console.log)();
//Nothing will happen. The Future was cancelled before it could settle.
```

#### then
##### `#then :: Future a b ~> PromiseCallback -> PromiseCallback -> Future a b`

Returns a [cached Future](#cache) which is automatically run in the next tick.
Optionally takes a rejection handler and/or a resolution handler whose return
values influence the state of the returned Future according to the
[Promises/A+][27] specification.

Its intended use is to provide a standardized interface for extracting the value
of the Future, allowing third-parties to extract the value without having to
know about `fork`. **It is not** the proper way to extract the Future value as
it takes away many benefits of using Futures:

* Using this method puts the Future in *eager* mode, losing all benefits of
  laziness in all derived Futures.
* It causes the Future and all derived Futures to run their effects without
  enforcing a way to handle the continuations.
* The ability to *immediately* cancel is lost, as `then` will cause the Future
  to run in the next tick.
* PromiseCallbacks will be called regardless of the Future having been canceled.

On other words; The method only really exists to make Fluture compatible with
`Promises/A+`-expecting API's and should not be used manually.

```js
Promise.resolve().then(() => Future.of('Hello')).then(console.log);
//> "Hello"

Future.reject(new Error('Kaputt!!!')).then(console.log);
/* sound of silence */
```

### Parallelism

#### race
##### `#race :: Future a b ~> Future a b -> Future a b`
##### `.race :: Future a b -> Future a b -> Future a b`

Race two Futures against each other. Creates a new Future which resolves or
rejects with the resolution or rejection value of the first Future to settle.

```js
Future.after(100, 'hello')
.race(Future.after(50, 'bye'))
.fork(console.error, console.log)
//> "bye"

const first = futures => futures.reduce(race);
first([
  after(100, 'hello'),
  after(50, 'bye'),
  Future(rej => setTimeout(rej, 25, 'nope'))
])
.fork(console.error, console.log)
//! "nope"
```

#### or
##### `#or :: Future a b ~> Future a b -> Future a b`
##### `.or :: Future a b -> Future a b -> Future a b`

Logical or for Futures.

Returns a new Future which either resolves with the first resolution value, or
rejects with the last rejection value once and if both Futures reject.

This behaves analogues to how JavaScript's or operator does, except both
Futures run simultaneously, so it is *not* short-circuited. That means that
if the second has side-effects, they will run even if the first resolves.

```js
//An asynchronous version of:
//const result = planA() || planB();
const result = planA().or(planB());

const program = S.pipe([
  reject,
  or(of('second chance')),
  value(console.log)
]);
program('first chance')
> "second chance"
```

In the example, assume both plans return Futures. Both plans are executed in
parallel. If `planA` resolves, the returned Future will resolve with its value.
If `planA` fails there is always `planB`. If both plans fail then the returned
Future will also reject using the rejection reason of `planB`.

#### parallel
##### `.parallel :: PositiveInteger -> Array (Future a b) -> Future a (Array b)`

Creates a Future which when forked runs all Futures in the given `array` in
parallel, ensuring no more than `limit` Futures are running at once.

```js
const tenFutures = Array.from(Array(10).keys()).map(Future.after(20));

//Runs all Futures in sequence:
Future.parallel(1, tenFutures).fork(console.error, console.log);
//after about 200ms:
//> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

//Runs upto five Futures in parallel:
Future.parallel(5, tenFutures).fork(console.error, console.log);
//after about 40ms:
//> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

//Runs all Futures in parallel:
Future.parallel(Infinity, tenFutures).fork(console.error, console.log);
//after about 20ms:
//> [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

If you want to settle all Futures, even if some may fail, you can use this in
combination with [fold](#fold):

```js
const fourInstableFutures = Array.from(Array(4).keys()).map(
  i => Future(
    (rej, res) => setTimeout(
      () => Math.random() > 0.8 ? rej('failed') : res(i),
      20
    )
  )
);

const stabalizedFutures = fourInstableFutures.map(Future.fold(S.Left, S.Right))

Future.parallel(2, stabalizedFutures).fork(console.error, console.log);
//after about 40ms:
//> [ Right(0), Left("failed"), Right(2), Right(3) ]
```

### Utility functions

#### isFuture
##### `.isFuture :: a -> Boolean`

Returns true for [Futures](#type-signatures) and false for everything else. This
function (and [`S.is`][17]) also return `true` for instances of Future that were
created within other contexts. It is therefore recommended to use this over
`instanceof`, unless your intent is to explicitly check for Futures created
using the exact `Future` constructor you're testing against.

```js
const Future1 = require('/path/to/fluture');
const Future2 = require('/other/path/to/fluture');

const m1 = Future1(noop);
Future1.isFuture(m1) === (m1 instanceof Future1);

const m2 = Future2(noop);
Future1.isFuture(m2) !== (m2 instanceof Future1);
```

#### isForkable
##### `.isForkable :: a -> Boolean`

Returns true for [Forkables](#type-signatures) and false for everything else.

#### cache
##### `.cache :: Future a b -> Future a b`

Returns a Future which caches the resolution value of the given Future so that
whenever it's forked, it can load the value from cache rather than reexecuting
the chain.

```js
const eventualPackage = Future.cache(
  Future.node(done => {
    console.log('Reading some big data');
    fs.readFile('package.json', 'utf8', done)
  })
);

eventualPackage.fork(console.error, console.log);
//> "Reading some big data"
//> "{...}"

eventualPackage.fork(console.error, console.log);
//> "{...}"
```

#### do
##### `.do :: (() -> Iterator) -> Future a b`

A specialized version of [fantasy-do][19] which works only for Futures, but has
the advantage of type-checking and not having to pass `Future.of`. Another
advantage is that the returned Future can be forked multiple times, as opposed
to with a general `fantasy-do` solution, where forking the Future a second time
behaves erroneously.

Takes a function which returns an [Iterator](#type-signatures), commonly a
generator-function, and chains every produced Future over the previous.

This allows for writing sequential asynchronous code without the pyramid of
doom. It's known as "coroutines" in Promise land, and "do-notation" in Haskell
land.

```js
Future.do(function*(){
  const thing = yield Future.after(300, 'world');
  const message = yield Future.after(300, 'Hello ' + thing);
  return message + '!';
})
.fork(console.error, console.log)
//After 600ms:
//> "Hello world!"
```

Error handling is slightly different in do-notation, you need to [`fold`](#fold)
the error into your control domain, I recommend folding into an [`Either`][7]:

```js
const attempt = Future.fold(S.Left, S.Right);
const ajaxGet = url => Future.reject('Failed to load ' + url);
Future.do(function*(){
  const e = yield attempt(ajaxGet('/message'));
  return S.either(
    e => `Oh no! ${e}`,
    x => `Yippee! ${x}`,
    e
  );
})
.fork(console.error, console.log);
//> "Oh no! Failed to load /message"
```

### Futurization

To reduce the boilerplate of making Node or Promise functions return Futures
instead, one might use the [Futurize][6] library:

```js
const Future = require('fluture');
const futurize = require('futurize').futurize(Future);
const readFile = futurize(require('fs').readFile);
readFile('README.md', 'utf8')
.map(text => text.split('\n'))
.map(lines => lines[0])
.fork(console.error, console.log);
//> "# Fluture"
```

## Benchmarks

Simply run `node ./bench/<file>` to see how a specific method compares to
implementations in `data.task`, `ramda-fantasy.Future` and `Promise`*.

\* Promise is not included in all benchmarks because it tends to make the
  process run out of memory.

## The name

A conjunction of the acronym to Fantasy Land (FL) and Future. Also "fluture"
means butterfly in Romanian; A creature you might expect to see in Fantasy Land.

----

[MIT licensed](LICENSE)

<!-- References -->

[1]:  https://github.com/fantasyland/fantasy-land
[2]:  http://sanctuary.js.org/#pipe
[3]:  http://ramdajs.com/docs/#map
[4]:  http://ramdajs.com/docs/#chain
[5]:  http://ramdajs.com/docs/#ap
[6]:  https://github.com/futurize/futurize
[7]:  http://sanctuary.js.org/#either-type
[8]:  https://github.com/fantasyland/fantasy-land/pull/124
[9]:  https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch7.html
[10]: https://github.com/folktale/data.task
[11]: https://github.com/ramda/ramda-fantasy
[12]: https://github.com/fantasyland/fantasy-land#functor
[13]: https://github.com/fantasyland/fantasy-land#chain
[14]: https://github.com/fantasyland/fantasy-land#apply
[15]: https://github.com/Avaq/Fluture/wiki/Comparison-of-Future-Implementations
[16]: https://github.com/fantasyland/fantasy-land#applicative
[17]: http://sanctuary.js.org/#is
[18]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator
[19]: https://github.com/russellmcc/fantasydo
[20]: http://ramdajs.com/
[21]: http://sanctuary.js.org/
[22]: https://github.com/Avaq/Fluture/wiki/Comparison-to-Promises
[23]: https://vimeo.com/106008027
[24]: https://github.com/fantasyland/fantasy-land#bifunctor
[25]: https://github.com/rpominov/static-land
[26]: https://github.com/fantasyland/fantasy-land#chainrec
[27]: https://promisesaplus.com/
