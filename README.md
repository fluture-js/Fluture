# Fluture

[<img src="https://raw.github.com/fantasyland/fantasy-land/master/logo.png" align="right" width="116" height="116" alt="Fantasy Land" />][1]

[![NPM Version](https://badge.fury.io/js/fluture.svg)](https://www.npmjs.com/package/fluture)
[![Dependencies](https://david-dm.org/avaq/fluture.svg)](https://david-dm.org/avaq/fluture)
[![Build Status](https://travis-ci.org/Avaq/Fluture.svg?branch=master)](https://travis-ci.org/Avaq/Fluture)
[![Code Coverage](https://codecov.io/gh/Avaq/Fluture/branch/master/graph/badge.svg)](https://codecov.io/gh/Avaq/Fluture)

Futures are containers which represent some eventual value as a result of an
asynchronous computation, much like Promises. Unlike Promises, however, Futures
are *lazy* and *logical* by design. They have a predictable API governed by the
[Fantasy Land][1] algebraic JavaScript specification.

> `npm install --save fluture` <sup>Requires a node 5.0.0 compatible environment
  like modern browsers, transpilers or Node 5+</sup>

## Table of contents

- [Table of contents](#table-of-contents)
- [Usage](#usage)
- [Motivation and Features](#motivation-and-features)
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
  1. [Consuming Futures](#consuming-futures)
    * [fork](#fork)
    * [value](#value)
    * [promise](#promise)
  1. [Transforming Futures](#transforming-futures)
    * [map](#map)
    * [mapRej](#maprej)
    * [bimap](#bimap)
    * [chain](#chain)
    * [chainRej](#chainrej)
    * [ap](#ap)
    * [fold](#fold)
  1. [Parallelism](#parallelism)
    * [race](#race)
    * [or](#or)
    * [parallel](#parallel)
  1. [Utility functions](#utility-functions)
    * [isFuture](#isfuture)
    * [isForkable](#isforkable)
    * [do](#do)
  1. [Futurization](#futurization)
- [Benchmarks](#benchmarks)
- [The name](#the-name)

## Usage

```js
const Future = require('fluture');
const program = file =>
  Future.node(done => fs.readFile(file, 'utf8', done))
  .chain(Future.encase(JSON.parse))
  .map(x => x.name)
  .fork(console.error, console.log);
program('package.json');
//> "fluture"
```

## Motivation and Features

Existing implementations of Future are a pain to debug. This library was made in
an effort to provide **great error messages** when something goes wrong. Other
features include:

* Plenty of async control utilites like [Future.parallel](#parallel) and [Future#race](#race).
* High performance.

To learn more about the differences between Fluture and other Future
implementations, take a look at [this wiki page][15].

## Documentation

### Type signatures

[Hindley-Milner][9] type signatures are used to document functions. A list of
all types used within these signatures follows:

- **Forkable** - Any Object with a `fork` method that takes at least two
  arguments. This includes instances of Fluture, instances of Task from
  [`data.task`][10] or instances of Future from [`ramda-fantasy`][11].
- **Future** - Instances of Future provided by Fluture.
- **Functor** - Any object with a `map` method which satisfies the
  [Fantasy Land Functor specification][12].
- **Chain** - Any object with a `chain` method which satisfies the
  [Fantasy Land Chain specification][13].
- **Apply** - Any object with an `ap` method which satisfies the
  [Fantasy Land Apply specification][14].
- **Iterator** - Any object which conforms to the [Iterator protocol][18].

### Creating Futures

#### Future
##### `Future :: ((a -> Void), (b -> Void) -> Void) -> Future a b`

The Future constructor. Creates a new instance of Future by taking a single
parameter `fork`: A function which takes two callbacks. Both are continuations
for an asynchronous computation. The first is `reject`, commonly abbreviated to
`rej`. The second `resolve`, which abbreviates to `res`. The `fork` function is
expected to call `rej` once an error occurs, or `res` with the result of the
asynchronous computation.

```js
const eventualThing = Future((rej, res) => {
  setTimeout(res, 500, 'world');
});

eventualThing.fork(
  console.error,
  thing => console.log(`Hello ${thing}!`)
);
//> "Hello world!"
```

#### of
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
##### `.try :: (Void -> !a | b) -> Future a b`

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

Creates a Future which resolves with the result of calling the given function
with the given value, or rejects with the error thrown by the function.

```js
const data = '{"foo" = "bar"}';
const parseJson = Future.encase(JSON.parse);
parseJson('a').fork(console.error, console.log)
//> [SyntaxError: Unexpected token =]
```

#### node
##### `.node :: ((a, b -> Void) -> Void) -> Future a b`

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

### Consuming Futures

#### fork
##### `#fork :: Future a b ~> (a -> Void), (b -> Void) -> Void`
##### `.fork :: (a -> Void) -> (b -> Void) -> Future a b -> Void`

Execute the Future by calling the `fork` function that was passed to it at
[construction](#creation) with the `reject` and `resolve` callbacks. Futures are
*lazy*, which means even if you've `map`ped or `chain`ed over them, they'll do
*nothing* if you don't eventually fork them.

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

#### value
##### `#value :: Future a b ~> (b -> Void) -> Void`
##### `.value :: (b -> Void) -> Future a b -> Void`

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

#### promise
##### `#promise :: Future a b ~> Promise b a`
##### `.promise :: Future a b -> Promise b a`

An alternative way to `fork` the Future. This eagerly forks the Future and
returns a Promise of the result. This is useful if some API wants you to give it
a Promise. It's the only method which forks the Future without a forced way to
handle the rejection branch, which means it's considered dangerous to use.

```js
Future.of('Hello').promise().then(console.log);
//> "Hello"
```

### Transforming Futures

#### map
##### `#map :: Future a b ~> (b -> c) -> Future a c`
##### `.map :: Functor m => (a -> b) -> m a -> m b`

Transforms the resolution value inside the Future, and returns a new Future with
the transformed value. This is like doing `promise.then(x => x + 1)`, except
that it's lazy, so the transformation will not be applied before the Future is
forked. The transformation is only applied to the resolution branch. So if the
Future is rejected, the transformation is ignored. To learn more about the exact
behaviour of `map`, check out its [spec][12].

```js
Future.of(1)
.map(x => x + 1)
.fork(console.error, console.log);
//> 2
```

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
only ever applied to the resolution value, so is ignored when the Future was
rejected. To learn more about the exact behaviour of `chain`, check out its [spec][13].

```js
Future.of(1)
.chain(x => Future.of(x + 1))
.fork(console.error, console.log);
//> 2
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

#### ap
##### `#ap :: Future a (b -> c) ~> Future a b -> Future a c`
##### `.ap :: Apply m => m (a -> b) -> m a -> m b`

Apply the resolution value, which is expected to be a function (as in
`Future.of(a_function)`), to the resolution value in the given Future. Both
Futures involved will run in parallel, and if one rejects the resulting Future
will also be rejected. To learn more about the exact behaviour of `ap`, check
out its [spec][14].

```js
Future.of(x => x + 1)
.ap(Future.of(1))
.fork(console.error, console.log);
//> 2
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
