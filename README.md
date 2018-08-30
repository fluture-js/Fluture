# [![Fluture](logo.png)](#butterfly)

[![Build Status][]](https://travis-ci.org/fluture-js/Fluture)
[![Code Coverage][]](https://codecov.io/gh/fluture-js/Fluture/branch/master)
[![Greenkeeper Enabled][]](https://greenkeeper.io)
[![Dependency Status][]](https://david-dm.org/fluture-js/Fluture)
[![NPM Releases][]](https://www.npmjs.com/package/fluture?activeTab=versions)
[![NPM Downloads][]](https://www.npmjs.com/package/fluture)
[![Gitter Chat][]](https://gitter.im/fluture-js/Fluture)
[![StackOverflow Questions][]](https://stackoverflow.com/questions/tagged/fluture)

[Build Status]: https://img.shields.io/travis/fluture-js/Fluture/master.svg
[Code Coverage]: https://img.shields.io/codecov/c/github/fluture-js/Fluture/master.svg
[Greenkeeper Enabled]: https://badges.greenkeeper.io/fluture-js/Fluture.svg
[Dependency Status]: https://img.shields.io/david/fluture-js/Fluture.svg
[NPM Releases]: https://img.shields.io/npm/v/fluture.svg
[NPM Downloads]: https://img.shields.io/npm/dm/fluture.svg
[Gitter Chat]: https://img.shields.io/gitter/room/fluture-js/Fluture.svg
[StackOverflow Questions]: https://img.shields.io/stackexchange/stackoverflow/t/fluture.svg

Fluture offers a control structure similar to Promises, Tasks, Deferreds, and
what-have-you. Let's call them Futures.

Much like Promises, Futures represent the value arising from the success or
failure of an asynchronous operation (I/O). Though unlike Promises, Futures are
*lazy* and adhere to [the *monadic* interface](#interoperability).

Some of the features provided by Fluture include:

* [Cancellation](#cancellation).
* [Resource management utilities](#resource-management).
* [Stack safe composition and recursion](#stack-safety).
* [Integration](#sanctuary) with [Sanctuary][S].
* A pleasant debugging experience through informative error messages.

For more information:

* [API documentation](#documentation)
* [Wiki: Compare Futures to Promises][wiki:promises]
* [Article: Why Promises shouldn't be used][10]
* [Wiki: Compare Fluture to similar libraries][wiki:similar]
* [Video: Monad a Day - Futures by @DrBoolean][5]

## Usage

> `npm install --save fluture`

Fluture is written for EcmaScript version 5.

For older environments you may need to polyfill one or more of the following
functions: [`Object.create`][JS:Object.create],
[`Object.assign`][JS:Object.assign] and [`Array.isArray`][JS:Array.isArray].

### CommonJS Module

<!-- eslint-disable no-var -->
<!-- eslint-disable padding-line-between-statements -->
```js
var fs = require('fs');
var Future = require('fluture');

var getPackageName = function(file){
  return Future.node(function(done){ fs.readFile(file, 'utf8', done) })
  .chain(Future.encase(JSON.parse))
  .map(function(x){ return x.name });
};

getPackageName('package.json')
.fork(console.error, console.log);
//> "fluture"
```

### EcmaScript Module

The `package.json` sets a `module`-field for build-tools like [Rollup][]. The
module version also has TypeScript definitions.

```js
import {readFile} from 'fs';
import {node, encase} from 'fluture';

var getPackageName = file =>
  node(done => { readFile(file, 'utf8', done) })
  .chain(encase(JSON.parse))
  .map(x => x.name);

getPackageName('package.json')
.fork(console.error, console.log);
//> "fluture"
```

### Global Bundle (CDN)

Fluture is hosted in full with all of its dependencies at
https://rawgit.com/fluture-js/Fluture/master/dist/bundle.js.

This script will add `Fluture` to the global scope.

## Interoperability

[<img src="https://raw.github.com/fantasyland/fantasy-land/master/logo.png" align="right" width="82" height="82" alt="Fantasy Land" />][FL]
[<img src="https://raw.githubusercontent.com/rpominov/static-land/master/logo/logo.png" align="right" height="82" alt="Static Land" />][6]

* `Future` implements [Fantasy Land][FL] and [Static Land][6] -compatible
  `Bifunctor`, `Monad` and `ChainRec` (`of`, `ap`, `map`, `bimap`, `chain`, `chainRec`).
  All versions of Fantasy Land are supported.
* `Future.Par` implements [Fantasy Land 3][FL] and [Static Land][6] -compatible
  `Alternative` (`of`, `zero`, `map`, `ap`, `alt`).
* The Future and ConcurrentFuture representatives contain `@@type` properties
  for [Sanctuary Type Identifiers][STI].
* The Future and ConcurrentFuture instances contain `@@show` properties for
  [Sanctuary Show][SS].

## Butterfly

The name "Fluture" is a conjunction of "FL" (the acronym to [Fantasy Land][FL])
and "future". Fluture means butterfly in Romanian: A creature one might expect
to see in Fantasy Land.

Credit goes to Erik Fuente for styling the logo, and [WEAREREASONABLEPEOPLE][9]
for sponsoring the project.

## Documentation

### Table of contents

<details open><summary>General</summary>

- [How to read the type signatures](#type-signatures)
- [How cancellation works](#cancellation)
- [On stack safety](#stack-safety)
- [Usage with Sanctuary](#sanctuary)
- [Using multiple versions of Fluture](#casting-futures)

</details>

<details><summary>Creating new Futures</summary>

- [`Future`: Create a possibly cancellable Future](#future)
- [`of`: Create a resolved Future](#of)
- [`reject`: Create a rejected Future](#reject)
- [`after`: Create a Future that resolves after a timeout](#after)
- [`rejectAfter`: Create a Future that rejects after a timeout](#rejectafter)
- [`do`: Create a "coroutine" using a generator function](#do)
- [`try`: Create a Future using a possibly throwing function](#try)
- [`tryP`: Create a Future using a Promise-returning function](#tryp)
- [`node`: Create a Future using a Node-style callback](#node)
- [`encase`: Convert a possibly throwing function to a Future function](#encase)
- [`encaseP`: Convert a Promise-retuning function to a Future function](#encasep)
- [`encaseN`: Convert a Nodeback function to a Future function](#encasen)

</details>

<details><summary>Converting between Nodeback APIs and Futures</summary>

- [`node`: Create a Future using a Node-style callback](#node)
- [`encaseN`: Convert a Nodeback function to a Future function](#encasen)
- [`done`: Consume a Future by providing a Nodeback](#done)

</details>

<details><summary>Converting between Promises and Futures</summary>

- [`tryP`: Create a Future using a Promise-returning function](#tryp)
- [`encaseP`: Convert a Promise-retuning function to a Future function](#encasep)
- [`promise`: Convert a Future to a Promise](#promise)

</details>

<details><summary>Transforming and combining Futures</summary>

- [`map`: Synchronously process the success value in a Future](#map)
- [`bimap`: Synchronously process the success or failure value in a Future](#bimap)
- [`chain`: Asynchronously process the success value in a Future](#chain)
- [`swap`: Swap the success with the failure value](#swap)
- [`mapRej`: Synchronously process the failure value in a Future](#maprej)
- [`chainRej`: Asynchronously process the failure value in a Future](#chainrej)
- [`fold`: Coerce success and failure values into the same success value](#fold)
- [`ap`: Combine the success values of multiple Futures using a function](#ap)
- [`and`: Logical *and* for Futures](#and)
- [`or`: Logical *or* for Futures](#or)
- [`assume`: Continue with another Future after the previous settles](#assume)
- [`race`: Race two Futures against each other](#race)
- [`both`: Await both success values from two Futures](#both)
- [`parallel`: Await all success values from many Futures](#parallel)

</details>

<details><summary>Consuming/forking Futures</summary>

- [`fork`: Standard way to run a Future and get at its result](#fork)
- [`forkCatch`: Fork with exception recovery](#forkcatch)
- [`value`: Shorter variant of `fork` for Futures sure to succeed](#value)
- [`done`: Nodeback style `fork`](#done)
- [`promise`: Convert a Future to a Promise](#promise)

</details>

<details><summary>Concurrency related utilities and data structures</summary>

- [`race`: Race two Futures against each other](#race)
- [`both`: Await both success values from two Futures](#both)
- [`parallel`: Await all success values from many Futures](#parallel)
- [`ConcurrentFuture`: A separate data-type for doing algebraic concurrency](#concurrentfuture)

</details>

<details><summary>Resource management and utilities</summary>

- [`hook`: Safely create and dispose resources](#hook)
- [`cache`: Cache a Future so that it can be forked multiple times](#cache)
- [`isFuture`: Determine whether a value is a Fluture compatible Future](#isfuture)
- [`never`: A Future that never settles](#never)

</details>

### Type signatures

The various function signatures are provided in a small language referred to as
Hindley-Milner notation. Read about [Hindley-Milner in JavaScript][Guide:HM]
here. On top of the basic Hindley-Milner notation, we use a few additions to
describe the JavaScript-specific stuff, like [methods](#squiggly-arrows)
or functions that take [multiple arguments at once](#brackets).

#### Squiggly Arrows

In order to document *methods*, we use the squiggly arrow (`~>`). This
separates the implicit `this` argument from the other, explicit, arguments.
For example, the following line signifies a method, as indicated by the
squiggly arrow:

```hs
Future.prototype.map :: Future a b ~> (b -> c) -> Future a c
```

For comparison, the following example shows a regular function:

```hs
map :: (b -> c) -> Future a b -> Future a c
```

#### Brackets

Most functions exposed by Fluture are curried. This is reflected in their type
signatures by using an arrow at each step where partial application is
possible. For example, the following line signifies a *curried* function,
because it has an arrow after each function argument:

```hs
add :: Number -> Number -> Number
```

We could have chosen to write the above line with "groups of one argument", but
we usually leave the grouping brackets out for brevity:

```hs
add :: (Number) -> (Number) -> Number
```

In order to document functions and methods that are *not* curried, we use
grouping to show which arguments have to be provided at the same time:

```hs
add :: (Number, Number) -> Number
```

#### Types

The concrete types you will encounter throughout this documentation:

- **Future** - Instances of Future provided by [compatible versions](#casting-futures) of Fluture.
- **ConcurrentFuture** - [Concurrified][concurrify] Futures ([`Future.Par`](#concurrentfuture)).
- **Promise** - Values which conform to the [Promises/A+ specification][7].
- **Nodeback a b** - A Node-style callback; A function of signature `(a | Nil, b) -> x`.
- **Pair a b** - An array with exactly two elements: `[a, b]`.
- **Iterator** - Objects with `next`-methods which conform to the [Iterator protocol][3].
- **Cancel** - The nullary [cancellation](#cancellation) functions returned from computations.
- **Catchable e f** - A function `f` which may throw an exception `e`.

#### Type classes

Some signatures contain [constrained type variables][Guide:constraints].
Generally, these constraints express that some value must conform to a
[Fantasy Land][FL]-specified interface.

- **Functor** - [Fantasy Land Functor][FL:functor] conformant values.
- **Bifunctor** - [Fantasy Land Bifunctor][FL:bifunctor] conformant values.
- **Chain** - [Fantasy Land Chain][FL:chain] conformant values.
- **Apply** - [Fantasy Land Apply][FL:apply] conformant values.
- **Alt** - [Fantasy Land Alt][FL:alt] conformant values.

### Cancellation

Cancellation is a system whereby running Futures get an opportunity stop what
they're doing and release resources that they were holding, when the consumer
indicates it is no longer interested in the result.

To cancel a Future, it must be unsubscribed from. Most of the
[consumption functions](#consuming-futures) return an `unsubscribe` function.
Calling it signals that we are no longer interested in the result. After
calling `unsubscribe`, Fluture guarantees that our callbacks will not be
called; but more importantly: a cancellation signal is sent upstream.

The cancellation signal travels all the way back to the source (with the
exception of cached Futures - see [`cache`](#cache)), allowing all parties
along the way to clean up.

With the [`Future` constructor](#future), we can provide a the cancellation
handler by returning it from the computation. Let's see what this looks like:

```js
// We use the Future constructor to create a Future instance.
var eventualAnswer = Future(function computeTheAnswer(rej, res){

  // We give the computer time to think about the answer, which is 42.
  var timeoutId = setTimeout(res, 60000, 42);

  // Here is how we handle cancellation. This signal is received when nobody
  // is interested in the answer any more.
  return function onCancel(){
    // Clearing the timeout releases the resources we were holding.
    clearTimeout(timeoutId);
  };

});

// Now, let's fork our computation and wait for an answer. Forking gives us
// the unsubscribe function.
var unsubscribe = eventualAnswer.fork(console.error, console.log);

// After some time passes, we might not care about the answer any more.
// Calling unsubscribe will send a cancellation signal back to the source,
// and trigger the onCancel function.
unsubscribe();
```

Many natural sources in Fluture have cancellation handlers of their own.
[`after`](#after), for example, does exactly what we've done just now: calling
`clearTimeout`.

Finally, Fluture unsubscribes from Futures that it forks *for us*, when it no
longer needs the result. For example, both Futures passed into [race](#race)
are forked, but once one of them produces a result, the other is unsubscribed
from, triggering cancellation. This means that generally, unsubscription and
cancellation is fully managed for us behind the scenes.

### Stack safety

Fluture interprets our transformations in a stack safe way.
This means that none of the following operations result in a
`RangeError: Maximum call stack size exceeded`:

```js
var add1 = x => x + 1;
var m = Future.of(1);

for(var i = 0; i < 100000; i++){
  m = m.map(add1);
}

m.fork(console.error, console.log);
//> 100001
```

```js
var m = (function recur(x){
  var mx = Future.of(x + 1);
  return x < 100000 ? mx.chain(recur) : mx;
}(1));

m.fork(console.error, console.log);
//> 100001
```

To learn more about memory and stack usage under different types of recursion,
see (or execute) [`scripts/test-mem`](scripts/test-mem).

### Sanctuary

When using this module with [Sanctuary Def][$] (and [Sanctuary][S] by
extension) one might run into the following issue:

```js
var S = require('sanctuary');
var Future = require('fluture');
S.I(Future.of(1));
//! Since there is no type of which all the above values are members,
//! the type-variable constraint has been violated.
```

This happens because Sanctuary Def needs to know about the types created by
Fluture to determine whether the type-variables are consistent.

To let Sanctuary know about these types, we can obtain the type definitions
from [`fluture-sanctuary-types`][FST] and pass them to [`S.create`][S:create]:

```js
var {create, env} = require('sanctuary');
var {env: flutureEnv} = require('fluture-sanctuary-types');
var Future = require('fluture');

var S = create({checkTypes: true, env: env.concat(flutureEnv)});

S.I(Future.of(1));
//> Future.of(1)
```

### Casting Futures

Sometimes we may need to convert one Future to another, for example when the
Future was created by another package, or an incompatible version of Fluture.

When [`isFuture`](#isfuture) returns `false`, a conversion is necessary.
Usually the most concise way of doing this is as follows:

```js
var NoFuture = require('incompatible-future');
var incompatible = NoFuture.of('Hello');

//Cast the incompatible Future to our version of Future:
var compatible = Future(incompatible.fork.bind(incompatible));

compatible.both(Future.of('world')).value(console.log);
//> ["Hello", "world"]
```

### Creating Futures

#### Future

<details><summary><code>Future :: ((a -> Undefined, b -> Undefined) -> Cancel) -> Future a b</code></summary>

```hs
Future :: ((a -> Undefined, b -> Undefined) -> Cancel) -> Future a b
```

</details>

Creates a Future with the given computation. A computation is a function which
takes two callbacks. Both are continuations for the computation. The first is
`reject`, commonly abbreviated to `rej`; The second is `resolve`, or `res`.
When the computation is finished (possibly asynchronously) it may call the
appropriate continuation with a failure or success value.

Additionally, the computation may return a nullary function containing
cancellation logic. See [Cancellation](#cancellation).

```js
Future(function computation(reject, resolve){
  setTimeout(resolve, 3000, 'world');
});
```

#### of

<details><summary><code>of :: b -> Future a b</code></summary>

```hs
of        :: b -> Future a b
Future.of :: b -> Future a b
```

</details>

Creates a Future which immediately resolves with the given value.

```js
var eventualThing = Future.of('world');
eventualThing.fork(
  console.error,
  thing => console.log(`Hello ${thing}!`)
);
//> "Hello world!"
```

#### reject

<details><summary><code>reject :: a -> Future a b</code></summary>

```hs
reject        :: a -> Future a b
Future.reject :: a -> Future a b
```

</details>

Creates a Future which immediately rejects with the given value.

```js
var eventualFailure = Future.reject('I got so far!');
eventualFailure.fork(
  e => console.error('I tried so hard!', e),
  console.log
);
//! "I tried so hard! I got so far!"
```

#### after

<details><summary><code>after :: Number -> b -> Future a b</code></summary>

```hs
after :: Number -> b -> Future a b
```

</details>

Creates a Future which resolves with the given value after the given number of
milliseconds.

```js
var eventualThing = Future.after(500, 'world');
eventualThing.fork(console.error, thing => console.log(`Hello ${thing}!`));
//> "Hello world!"
```

#### rejectAfter

<details><summary><code>rejectAfter :: Number -> a -> Future a b</code></summary>

```hs
rejectAfter :: Number -> a -> Future a b
```

</details>

Creates a Future which rejects with the given reason after the given number of
milliseconds.

```js
var eventualError = Future.rejectAfter(500, new Error('Kaputt!'));
eventualError.fork(err => console.log('Oh no - ' + err.message), console.log);
//! Oh no - Kaputt!
```

#### do

<details><summary><code>do :: (() -> Iterator) -> Future a b</code></summary>

```hs
do :: (() -> Iterator) -> Future a b
go :: (() -> Iterator) -> Future a b
```

</details>

A way to do `async`/`await` with Futures, similar to Promise Coroutines or
Haskell Do-notation.

Takes a function which returns an [Iterator](#types), commonly a
generator-function, and chains every produced Future over the previous.

This function has an alias `go`, for environments where `do` is reserved.

```js
var eventualMessage = Future.do(function*(){
  var thing = yield Future.after(300, 'world');
  var message = yield Future.after(300, 'Hello ' + thing);
  return message + '!';
});

eventualMessage.fork(console.error, console.log);
//After 600ms:
//> "Hello world!"
```

To handle errors inside a `do` procedure, we need to [`fold`](#fold) the error
into our control domain, I recommend folding into an [`Either`][S:Either]:

```js
var attempt = Future.fold(S.Left, S.Right);
var ajaxGet = url => Future.reject('Failed to load ' + url);

var eventualMessage = Future.do(function*(){
  var e = yield attempt(ajaxGet('/message'));
  return S.either(
    e => `Oh no! ${e}`,
    x => `Yippee! ${x}`,
    e
  );
});

eventualMessage.fork(console.error, console.log);
//> "Oh no! Failed to load /message"
```

#### try

<details><summary><code>try :: Catchable e (() -> r) -> Future e r</code></summary>

```hs
try     :: Catchable e (() -> r) -> Future e r
attempt :: Catchable e (() -> r) -> Future e r
```

</details>

Creates a Future which resolves with the result of calling the given function,
or rejects with the error thrown by the given function.

Short for [`Future.encase(f, undefined)`](#encase).

This function has an alias `attempt`, for environments where `try` is reserved.

```js
var data = {foo: 'bar'};
Future.try(() => data.foo.bar.baz)
.fork(console.error, console.log);
//> [TypeError: Cannot read property 'baz' of undefined]
```

#### tryP

<details><summary><code>tryP :: (() -> Promise e r) -> Future e r</code></summary>

```hs
tryP :: (() -> Promise e r) -> Future e r
```

</details>

Create a Future which when forked spawns a Promise using the given function and
resolves with its resolution value, or rejects with its rejection reason.

Short for [`Future.encaseP(f, undefined)`](#encasep).

```js
Future.tryP(() => Promise.resolve('Hello'))
.fork(console.error, console.log);
//> "Hello"
```

#### node

<details><summary><code>node :: (Nodeback e r -> x) -> Future e r</code></summary>

```hs
node :: (Nodeback e r -> x) -> Future e r
```

</details>

Creates a Future which rejects with the first argument given to the function,
or resolves with the second if the first is not present.

Note that this function **does not support cancellation**.

Short for [`Future.encaseN(f, undefined)`](#encasen).

```js
Future.node(done => {
  done(null, 'Hello');
})
.fork(console.error, console.log);
//> "Hello"
```

#### encase

<details><summary><code>encase :: (Catchable e (a -> r)) -> a -> Future e r</code></summary>

```hs
encase  :: (Catchable e ((a      ) -> r)) -> a ->           Future e r
encase2 :: (Catchable e ((a, b   ) -> r)) -> a -> b ->      Future e r
encase3 :: (Catchable e ((a, b, c) -> r)) -> a -> b -> c -> Future e r
```

</details>

Takes a function and a value, and returns a Future which when forked calls the
function with the value and resolves with the result. If the function throws
an exception, it is caught and the Future will reject with the exception:

Partially applying `encase` with a function `f` allows us to create a "safe"
version of `f`. Instead of throwing exceptions, the encased version always
returns a Future when given the remaining argument(s):

Furthermore; `encase2` and `encase3` are binary and ternary versions of
`encase`, applying two or three arguments to the given function respectively.

```js
var data = '{"foo" = "bar"}';
var safeJsonParse = Future.encase(JSON.parse);
safeJsonParse(data).fork(console.error, console.log);
//! [SyntaxError: Unexpected token =]
```

#### encaseP

<details><summary><code>encaseP  :: ((a) -> Promise e r) -> a -> Future e r</code></summary>

```hs
encaseP  :: ((a) ->       Promise e r) -> a ->           Future e r
encaseP2 :: ((a, b) ->    Promise e r) -> a -> b ->      Future e r
encaseP3 :: ((a, b, c) -> Promise e r) -> a -> b -> c -> Future e r
```

</details>

Allows Promise-returning functions to be turned into Future-returning
functions.

Takes a function which returns a Promise, and a value, and returns a Future.
When forked, the Future calls the function with the value to produce the
Promise, and resolves with its resolution value, or rejects with its rejection
reason.

Furthermore; `encaseP2` and `encaseP3` are binary and ternary versions of
`encaseP`, applying two or three arguments to the given function respectively.

```js
var fetchf = Future.encaseP(fetch);

fetchf('https://api.github.com/users/Avaq')
.chain(res => Future.tryP(_ => res.json()))
.map(user => user.name)
.fork(console.error, console.log);
//> "Aldwin Vlasblom"
```

#### encaseN

<details><summary><code>encaseN  :: ((a, Nodeback e r) -> x) -> a -> Future e r</code></summary>

```hs
encaseN  :: ((a,       Nodeback e r) -> x) -> a ->           Future e r
encaseN2 :: ((a, b,    Nodeback e r) -> x) -> a -> b ->      Future e r
encaseN3 :: ((a, b, c, Nodeback e r) -> x) -> a -> b -> c -> Future e r
```

</details>

Allows [continuation-passing-style][1] functions to be turned into
Future-returning functions.

Takes a function which accepts as its last parameter a [Nodeback](#types), and
a value, and returns a Future. When forked, the Future calls the function with
the value and a Nodeback and resolves the second argument passed to the
Nodeback, or or rejects with the first argument.

Furthermore; `encaseN2` and `encaseN3` are binary and ternary versions of
`encaseN`, applying two or three arguments to the given function respectively.

```js
var fs = require('fs');

var read = Future.encaseN2(fs.readFile);

read('README.md', 'utf8')
.map(text => text.split('\n'))
.map(lines => lines[0])
.fork(console.error, console.log);
//> "# [![Fluture](logo.png)](#butterfly)"
```

#### chainRec

<details><summary><code>Future.chainRec :: ((a -> Next a, b -> Done b, a) -> Future e (Next a | Done b), a) -> Future e b</code></summary>

```hs
Future.chainRec :: ((a -> Next a, b -> Done b, a) -> Future e (Next a | Done b), a) -> Future e b
```

</details>

Implementation of [Fantasy Land ChainRec][FL:chainrec]. Since Fluture 6.0
introduced [stack safety](#stack-safety) there should be no need to use this
function directly. Instead it's recommended to use [`chain(rec)`](#chain).

### Transforming Futures

#### map

<details><summary><code>map :: Functor m => (a -> b) -> m a -> m b</code></summary>

```hs
map                  :: Functor m  => (a -> b) -> m a -> m        b
Future.map           :: Functor m  => (a -> b) -> m a -> m        b
Par.map              :: Functor m  => (a -> b) -> m a -> m        b
Future.prototype.map :: Future e a ~> (a -> b)        -> Future e b
```

</details>

Transforms the resolution value inside the Future, and returns a Future with
the new value. The transformation is only applied to the resolution branch: if
the Future is rejected, the transformation is ignored.

See also [`chain`](#chain) and [`mapRej`](#maprej).

```js
Future.of(1)
.map(x => x + 1)
.fork(console.error, console.log);
//> 2
```

For comparison, the equivalent with Promises is:

```js
Promise.resolve(1)
.then(x => x + 1)
.then(console.log, console.error);
```

#### bimap

<details><summary><code>bimap :: Bifunctor m => (a -> c) -> (b -> d) -> m a b -> m c d</code></summary>

```hs
bimap                  :: Bifunctor m => (a -> c) -> (b -> d) -> m a b -> m      c d
Future.bimap           :: Bifunctor m => (a -> c) -> (b -> d) -> m a b -> m      c d
Future.prototype.bimap :: Future a b  ~> (a -> c,     b -> d)          -> Future c d
```

</details>

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
//! "error!"
```

For comparison, the equivalent with Promises is:

```js
Promise.resolve(1)
.then(x => x + 1, x => x + '!')
.then(console.log, console.error);
```

#### chain

<details><summary><code>chain :: Chain m => (a -> m b) -> m a -> m b</code></summary>

```hs
chain                  :: Chain m    => (a -> m        b) -> m a -> m        b
Future.chain           :: Chain m    => (a -> m        b) -> m a -> m        b
Future.prototype.chain :: Future e a ~> (a -> Future e b) ->        Future e b
```

</details>

Sequence a new Future using the resolution value from another. Similarly to
[`map`](#map), `chain` expects a function to transform the resolution value of
a Future. But instead of returning the new *value*, chain expects a Future to
be returned.

The transformation is only applied to the resolution branch: if the Future is
rejected, the transformation is ignored.

See also [`chainRej`](#chainrej).

```js
Future.of(1)
.chain(x => Future.of(x + 1))
.fork(console.error, console.log);
//> 2
```

For comparison, the equivalent with Promises is:

```js
Promise.resolve(1)
.then(x => Promise.resolve(x + 1))
.then(console.log, console.error);
```

#### swap

<details><summary><code>swap :: Future a b -> Future b a</code></summary>

```hs
swap                  :: Future a b -> Future b a
Future.prototype.swap :: Future a b ~> Future b a
```

</details>

Resolve with the rejection reason, or reject with the resolution value.

```js
Future.of(new Error('It broke')).swap().fork(console.error, console.log);
//! [It broke]

Future.reject('Nothing broke').swap().fork(console.error, console.log);
//> "Nothing broke"
```

#### mapRej

<details><summary><code>mapRej :: (a -> c) -> Future a b -> Future c b</code></summary>

```hs
mapRej                  ::               (a -> c) -> Future a b -> Future c b
Future.prototype.mapRej :: Future a b ~> (a -> c)               -> Future c b
```

</details>

Map over the **rejection** reason of the Future. This is like [`map`](#map),
but for the rejection branch.

```js
Future.reject(new Error('It broke!'))
.mapRej(err => new Error('Oh No! ' + err.message))
.fork(console.error, console.log);
//! [Oh No! It broke!]
```

For comparison, the equivalent with Promises is:

```js
Promise.resolve(1)
.then(null, err => Promise.reject(new Error('Oh No! ' + err.message)))
.then(console.log, console.error);
```

#### chainRej

<details><summary><code>chainRej :: (a -> Future c b) -> Future a b -> Future c b</code></summary>

```hs
chainRej                  ::               (a -> Future c b) -> Future a b -> Future c b
Future.prototype.chainRej :: Future a b ~> (a -> Future c b)               -> Future c b
```

</details>

Chain over the **rejection** reason of the Future. This is like
[`chain`](#chain), but for the rejection branch.

```js
Future.reject(new Error('It broke!'))
.chainRej(err => Future.of(err.message + ' But it\'s all good.'))
.fork(console.error, console.log);
//> "It broke! But it's all good."
```

For comparison, the equivalent with Promises is:

```js
Promise.reject(new Error('It broke!'))
.then(null, err => err.message + ' But it\'s all good.')
.then(console.log, console.error);
```

#### fold

<details><summary><code>fold :: (a -> c) -> (b -> c) -> Future a b -> Future d c</code></summary>

```hs
fold                  ::               (a -> c) -> (b -> c) -> Future a b -> Future d c
Future.prototype.fold :: Future a b ~> (a -> c,     b -> c)               -> Future d c
```

</details>

Applies the left function to the rejection value, or the right function to the
resolution value, depending on which is present, and resolves with the result.

This provides a convenient means to ensure a Future is always resolved. It can
be used with other type constructors, like [`S.Either`][S:Either], to maintain
a representation of failure.

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

For comparison, the equivalent with Promises is:

```js
Promise.resolve('hello')
.then(S.Right, S.Left)
.then(console.log);
```

### Combining Futures

#### ap

<details><summary><code>ap :: Apply m => m (a -> b) -> m a -> m b</code></summary>

```hs
ap                  :: Apply m => m        (a -> b) -> m        a -> m        b
Future.ap           :: Apply m => m        (a -> b) -> m        a -> m        b
Par.ap              :: Apply m => m        (a -> b) -> m        a -> m        b
Future.prototype.ap ::            Future e (a -> b) ~> Future e a -> Future e b
```

</details>

Applies the function contained in the left-hand Future or Apply to the value
contained in the right-hand Future or Apply. If one of the Futures rejects the
resulting Future will also be rejected.

```js
Future.of(x => y => x + y)
.ap(Future.of(1))
.ap(Future.of(2))
.fork(console.error, console.log);
//> 3
```

#### and

<details><summary><code>and :: Future a b -> Future a c -> Future a c</code></summary>

```hs
and                  :: Future a b -> Future a c -> Future a c
Future.prototype.and :: Future a b ~> Future a c -> Future a c
```

</details>

Logical *and* for Futures.

Returns a new Future which either rejects with the first rejection reason, or
resolves with the last resolution value once and if both Futures resolve. We
can use it if we want a computation to run only after another has succeeded.

See also [`or`](#or) and [`assume`](#assume).

```js
Future.after(300, null)
.and(Future.of('hello'))
.fork(console.error, console.log);
//> "hello"
```

With good old `reduce`, we can turn this into an asynchronous `all` function,
where the resulting Future will be the leftmost to reject, or the rightmost to
resolve.

```js
var all = ms => ms.reduce(Future.and, Future.of(0));
all([Future.after(20, 1), Future.of(2)]).value(console.log);
//> 2
```

#### or

<details><summary><code>or :: Future a b -> Future a b -> Future a b</code></summary>

```hs
or                  :: Future a b -> Future a b -> Future a b
Future.prototype.or :: Future a b ~> Future a b -> Future a b
```

</details>

Logical *or* for Futures.

Returns a new Future which either resolves with the first resolution value, or
rejects with the last rejection value once and if both Futures reject. We can
use it if we want a computation to run only if another has failed.

See also [`and`](#and) and [`assume`](#assume).

```js
Future.rejectAfter(300, new Error('Failed'))
.or(Future.of('hello'))
.fork(console.error, console.log);
//> "hello"
```

With good old `reduce`, we can turn this into an asynchronous `any` function,
where the resulting Future will be the leftmost to resolve, or the rightmost
to reject.

```js
var any = ms => ms.reduce(Future.or, Future.reject('empty list'));
any([Future.reject(1), Future.after(20, 2), Future.of(3)]).value(console.log);
//> 2
```

#### assume

<details><summary><code>assume :: Future c d -> Future a b -> Future c d</code></summary>

```hs
assume                  ::               Future c d -> Future a b -> Future c d
Future.prototype.assume :: Future a b ~> Future c d               -> Future c d
```

</details>

Run a second Future after the first settles (successfully or unsuccessfully),
assuming its state.

See also [`and`](#and) and [`or`](#or).

```js
Future.of('Hello')
.assume(Future.of('World!'))
.fork(console.error, console.log);
//> "World!"

Future.reject('Hello')
.assume(Future.of('World!'))
.fork(console.error, console.log);
//> "World!"
```

Note that the *first* Future is given as the *last* argument to `Future.assume()`:

```js
var program = S.pipe([
  Future.of,
  Future.assume(Future.of('World!')),
  Future.fork(console.error, console.log)
]);

program('Hello');
//> "World!"
```

### Consuming Futures

#### fork

<details><summary><code>fork :: (a -> Any) -> (b -> Any) -> Future a b -> Cancel</code></summary>

```hs
fork                  ::               (a -> Any) -> (b -> Any) -> Future a b -> Cancel
Future.prototype.fork :: Future a b ~> (a -> Any,     b -> Any)               -> Cancel
```

</details>

Execute the computation represented by a Future, passing `reject` and `resolve`
callbacks to continue once there is a result.

This function is called `fork` because it literally represents a fork in our
program: a point where a single code-path splits in two. It is recommended to
keep the number of calls to `fork` at a minimum for this reason. The more
forks, the higher the code complexity.

Generally, one only needs to call `fork` in a single place in the entire
program.

After we `fork` a Future, the computation will start running. If the program
decides halfway through that it's no longer interested in the result of the
computation, it can call the `unsubscribe` function returned by `fork()`. See
[Cancellation](#cancellation).

Note that if an exception was encountered during the computation, it will be
thrown and likely not be catchable. If the computation ran in isolation, we may
want to use [`forkCatch`](#forkcatch) instead to recover from exceptions.

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
//! "Oh no! It broke!"

var consoleFork = Future.fork(console.error, console.log);
consoleFork(Future.of('Hello'));
//> "Hello"
```

#### forkCatch

<details><summary><code>forkCatch :: (Error -> Any) -> (a -> Any) -> (b -> Any) -> Future a b -> Cancel</code></summary>

```hs
forkCatch                  ::               (Error -> Any) -> (a -> Any) -> (b -> Any) -> Future a b -> Cancel
Future.prototype.forkCatch :: Future a b ~> (Error -> Any,     a -> Any,     b -> Any)               -> Cancel
```

</details>

An advanced version of [fork](#fork) that allows us to recover in the event
that an error was `throw`n during the executation of the computation.

The recovery function will always be called with an instance of Error,
independent of what was thrown.

**Using this function is a trade-off;**

Generally it's best to let a program crash and restart when an unexpected
exception occurs. Restarting is the surest way to restore the memory that was
allocated by the program to an expected state.

By using `forkCatch`, we might be able to keep our program alive longer, which
can be very beneficial when the program is being used by multiple clients.
However, we also forego the certainty that our program will be in a valid state
after this happens. The more isolated the memory consumed by the particular
computation was, the more certain we will be that recovery is safe.

```js
var fut = Future.after(300, null).map(x => x.foo);
fut.forkCatch(console.error, console.error, console.log);
//! Error: TypeError occurred while running a computation for a Future:
//!   Cannot read property 'foo' of null
```

#### value

<details><summary><code>value :: (b -> x) -> Future a b -> Cancel</code></summary>

```hs
value                  ::               (b -> x) -> Future a b -> Cancel
Future.prototype.value :: Future a b ~> (b -> x)               -> Cancel
```

</details>

Extracts the value from a resolved Future by forking it. Only use this function
if you are sure the Future is going to be resolved, for example; after using
[`fold`](#fold). If the Future rejects and `value` was used, an uncatchable
`Error` will be thrown.

```js
Future.reject(new Error('It broke'))
.fold(S.Left, S.Right)
.value(console.log);
//> Left([Error: It broke])
```

As with [`fork`](#fork), `value` returns an `unsubscribe` function. See
[Cancellation](#cancellation).

#### done

<details><summary><code>done :: Nodeback a b -> Future a b -> Cancel</code></summary>

```hs
done                  ::               Nodeback a b -> Future a b -> Cancel
Future.prototype.done :: Future a b ~> Nodeback a b               -> Cancel
```

</details>

Fork the Future into a [Nodeback](#types).

This is like [`fork`](#fork), but instead of taking two unary functions, it
takes a single binary function.

As with [`fork`](#fork), `done` returns an `unsubscribe` function. See
[Cancellation](#cancellation).

```js
Future.of('hello').done((err, val) => console.log(val));
//> "hello"
```

#### promise

<details><summary><code>promise :: Future a b -> Promise b a</code></summary>

```hs
promise                  :: Future a b -> Promise b a
Future.prototype.promise :: Future a b ~> Promise b a
```

</details>

An alternative way to [`fork`](#fork) the Future. Returns a Promise which
resolves with the resolution value, or rejects with the rejection reason of
the Future.

Note that if an exception was encountered during the computation, it will be
thrown and likely not be catchable.

```js
Future.of('Hello').promise().then(console.log);
//> "Hello"
```

This is a convenience function which provides a "quick and dirty" way to create
a Promise from a Future. You should only use it in scenarios where you're not
interested in [cancellation](#cancellation), nor interested in recovering from
exceptions. For example in a test runner that wants you to give it a Promise.
In any other scenario, if you *really* want a Promise, you should probably
make a custom wrapper around [`forkCatch`](#forkcatch) to create your Promise,
for example:

```js
const eventualThing = Future.after(300, 'World');

new Promise((res, rej) => {

  // We've decided that an exception should go to the rejection branch, and
  // we're wrapping the failure or success values to not lose information.
  const cancel = eventualThing.forkCatch(rej, reason => {
    res({success: false, reason: reason, value: null});
  }, value => {
    res({success: true, reason: null, value: value});
  });

  // We're also handling cancellation here.
  process.on('SIGINT', cancel);

});
```

### Parallelism

#### race

<details><summary><code>race :: Future a b -> Future a b -> Future a b</code></summary>

```hs
race                  :: Future a b -> Future a b -> Future a b
Future.prototype.race :: Future a b ~> Future a b -> Future a b
```

</details>

Race two Futures against each other. Creates a new Future which resolves or
rejects with the resolution or rejection value of the first Future to settle.

When one Future settles, the other gets cancelled automatically.

```js
Future.after(100, 'hello')
.race(Future.after(50, 'bye'))
.fork(console.error, console.log);
//> "bye"
```

With good old `reduce`, we can turn this into a `first` function, where the
resulting Future will be the first to resolve, or the first to reject.

```js
var first = futures => futures.reduce(Future.race, Future.never);
first([
  Future.after(100, 'hello'),
  Future.after(50, 'bye'),
  Future.rejectAfter(25, 'nope')
])
.fork(console.error, console.log);
//! "nope"
```

#### both

<details><summary><code>both :: Future a b -> Future a c -> Future a (Pair b c)</code></summary>

```hs
both                  :: Future a b -> Future a c -> Future a (Pair b c)
Future.prototype.both :: Future a b ~> Future a c -> Future a (Pair b c)
```

</details>

Run two Futures in parallel and get a [`Pair`](#types) of the results. When
either Future rejects, the other Future will be cancelled and the resulting
Future will reject.

```js
var a = Future.of('a');
var b = Future.of('b');

Future.both(a, b).fork(console.error, console.log);
//> ['a', 'b']
```

#### parallel

<details><summary><code>parallel :: PositiveInteger -> Array (Future a b) -> Future a (Array b)</code></summary>

```hs
parallel :: PositiveInteger -> Array (Future a b) -> Future a (Array b)
```

</details>

Creates a Future which when forked runs all Futures in the given Array in
parallel, ensuring no more than `limit` Futures are running at once.

When one Future rejects, all currently running Futures will be cancelled and
the resulting Future will reject.

```js
var tenFutures = Array.from(Array(10).keys()).map(Future.after(20));

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
var unstableFutures = Array.from({length: 4}, (_, i) =>
  Future.node(done => done(Math.random() > 0.75 ? 'failed' : null, i))
);

var stabalizedFutures = unstableFutures.map(Future.fold(S.Left, S.Right));

Future.parallel(Infinity, stabalizedFutures).fork(console.error, console.log);
//> [ Right(0), Left("failed"), Right(2), Right(3) ]
```

#### ConcurrentFuture

The `ConcurrentFuture` type is the result of applying
[`concurrify`][concurrify] to `Future`. It provides a mechanism for
constructing a [Fantasy Land `Alternative`][FL:alternative] from a member of
`Future`. This allows Futures to benefit from the Alternative Interface, which
includes parallel `ap`, `zero` and `alt`.

The idea is that we can switch back and forth between `Future` and
`ConcurrentFuture`, using [`Par`](#par) and [`seq`](#seq), to get sequential or
concurrent behaviour respectively. It's a useful type to pass to abstractions
that don't know about Future-specific functions like [`parallel`](#parallel) or
[`race`](#race), but *do* know how to operate on Apply and Alternative.

```js
var {of, ap, sequence} = require('sanctuary');
var {Future, Par, seq} = require('fluture');

//Some dummy values
var x = 1;
var f = a => a + 1;

//The following two are equal ways to construct a ConcurrentFuture
var parx = of(Par, x);
var parf = Par(of(Future, f));

//We can make use of parallel apply
seq(ap(parx, parf)).value(console.log);
//> 2

//Or concurrent sequencing
seq(sequence(Par, [parx, parf])).value(console.log);
//> [x, f]
```

##### Par

Converts a Future to a ConcurrentFuture.

<details><summary><code>Par :: Future a b -> ConcurrentFuture a b</code></summary>

```hs
Par :: Future a b -> ConcurrentFuture a b
```

</details>

##### Par.of

Constructs a ConcurrentFuture with the given resolution value.

<details><summary><code>Par.of :: b -> ConcurrentFuture a b</code></summary>

```hs
Par.of :: b -> ConcurrentFuture a b
```

</details>

##### Par.zero

Constructs a ConcurrentFuture which will never resolve or reject with anything.

<details><summary><code>Par.zero :: () -> ConcurrentFuture a a</code></summary>

```hs
Par.zero :: () -> ConcurrentFuture a a
```

</details>

##### seq

Converts a ConcurrentFuture to a Future.

<details><summary><code>seq :: ConcurrentFuture a b -> Future a b</code></summary>

```hs
seq :: ConcurrentFuture a b -> Future a b
```

</details>

##### alt

Select one of two [Alts](#types). In terms of the `ConcurrentFuture`
type, this means racing the two against one another with the same
semantics as [`race`](#race).

<details><summary><code>alt :: Alt f => f a -> f a -> f a</code></summary>

```hs
alt     :: Alt f => f a -> f a -> f a
Par.alt :: Alt f => f a -> f a -> f a
```

</details>

```js
import {Future, Par, seq, alt} from 'fluture';

seq(alt(Par.zero, Par.of(1))).value(console.log);
//> 1

seq(alt(Par(Future.after(20, 1)), Future.after(10, 2))).value(console.log);
//> 2
```

### Resource management

Functions listed under this category allow for more fine-grained control over
the flow of acquired values.

#### hook

<details><summary><code>hook :: Future a b -> (b -> Future a c) -> (b -> Future a d) -> Future a d</code></summary>

```hs
hook :: Future a b -> (b -> Future a c) -> (b -> Future a d) -> Future a d
```

</details>

Allows a Future-returning function to be decorated with resource acquisition
and disposal. The signature is like `hook(acquire, dispose, consume)`, where
`acquire` is a Future which might create connections, open file handlers, etc.
`dispose` is a function that takes the result from `acquire` and should be used
to clean up (close connections etc) and `consume` also takes the result from
`acquire`, and may be used to perform any arbitrary computations using the
resource. The resolution value of `dispose` is ignored.

<!-- eslint-disable no-undef -->
```js
var withConnection = Future.hook(
  openConnection('localhost'),
  closeConnection
);

withConnection(
  conn => query(conn, 'EAT * cakes FROM bakery')
)
.fork(console.error, console.log);
```

When a hooked Future is cancelled while acquiring its resource, nothing else
will happen. However, once the resource has been acquired, the `dispose`
Future is guaranteed to run.

In the case where the consumption Future settles, the disposal is forked and
awaited. If the disposal Future rejects or encounters an exception, it will
replace the state of the consumption Future. Otherwise the rejection reason or
resolution value of the consumption Future will determine the final outcome.

In the case where an exception is encountered during consumption, the disposal
Future will run, but its results are ignored.

In the case where the consumption or disposal Future is cancelled from outside,
the disposal Future will start and/or finish its computation, but the results
will be ignored.

### Utility functions

#### cache

<details><summary><code>cache :: Future a b -> Future a b</code></summary>

```hs
cache :: Future a b -> Future a b
```

</details>

Returns a Future which caches the resolution value or rejection reason of the
given Future so that whenever it's forked, it can load the value from cache
rather than re-executing the underlying computation.

This essentially turns a unicast Future into a multicast Future, allowing
multiple consumers to subscribe to the same result. The underlying computation
is never [cancelled](#cancellation) unless *all* consumers unsubscribe before
it completes.

There is a glaring drawback to using `cache`, which is that returned Futures
are no longer referentially transparent, making reasoning about them more
difficult and refactoring code that uses them harder.

```js
var {readFile} = require('fs');
var eventualPackage = Future.cache(
  Future.node(done => {
    console.log('Reading some big data');
    readFile('package.json', 'utf8', done);
  })
);

eventualPackage.fork(console.error, console.log);
//> "Reading some big data"
//> "{...}"

eventualPackage.fork(console.error, console.log);
//> "{...}"
```

#### isFuture

<details><summary><code>isFuture :: a -> Boolean</code></summary>

```hs
isFuture :: a -> Boolean
```

</details>

Returns true for [Futures](#types) and false for everything else. This function
(and [`S.is`][S:is]) also return `true` for instances of Future that were
created within other contexts. It is therefore recommended to use this over
`instanceof`, unless your intent is to explicitly check for Futures created
using the exact `Future` constructor you're testing against.

<!-- eslint-disable no-unused-expressions -->
```js
var Future1 = require('/path/to/fluture');
var Future2 = require('/other/path/to/fluture');
var noop = () => {};

var m1 = Future1(noop);
Future1.isFuture(m1) === (m1 instanceof Future1);
//> true

var m2 = Future2(noop);
Future1.isFuture(m2) === (m2 instanceof Future1);
//> false
```

#### never

<details><summary><code>never :: Future a a</code></summary>

```hs
never :: Future a a
```

</details>

A Future that never settles. Can be useful as an initial value when reducing
with [`race`](#race), for example.

#### isNever

<details><summary><code>isNever :: a -> Boolean</code></summary>

```hs
isNever :: a -> Boolean
```

</details>

Returns `true` if the given input is a `never`.

#### extractLeft

<details><summary><code>extractLeft :: Future a b -> Array a</code></summary>

```hs
extractLeft                  :: Future a b       -> Array a
Future.prototype.extractLeft :: Future a b ~> () -> Array a
```

</details>

Returns an array whose only element is the rejection reason of the Future.
In many cases it will be impossible to extract this value; In those cases, the
array will be empty. This function is meant to be used for type introspection:
it is **not** the correct way to [consume a Future](#consuming-futures).

#### extractRight

<details><summary><code>extractRight :: Future a b -> Array b</code></summary>

```hs
extractRight                  :: Future a b       -> Array b
Future.prototype.extractRight :: Future a b ~> () -> Array b
```

</details>

Returns an array whose only element is the resolution value of the Future.
In many cases it will be impossible to extract this value; In those cases, the
array will be empty. This function is meant to be used for type introspection:
it is **not** the correct way to [consume a Future](#consuming-futures).

## License

[MIT licensed](LICENSE)

<!-- References -->

[wiki:similar]:         https://github.com/fluture-js/Fluture/wiki/Comparison-of-Future-Implementations
[wiki:promises]:        https://github.com/fluture-js/Fluture/wiki/Comparison-to-Promises

[FL]:                   https://github.com/fantasyland/fantasy-land
[FL:alt]:               https://github.com/fantasyland/fantasy-land#alt
[FL:alternative]:       https://github.com/fantasyland/fantasy-land#alternative
[FL:functor]:           https://github.com/fantasyland/fantasy-land#functor
[FL:chain]:             https://github.com/fantasyland/fantasy-land#chain
[FL:apply]:             https://github.com/fantasyland/fantasy-land#apply
[FL:bifunctor]:         https://github.com/fantasyland/fantasy-land#bifunctor
[FL:chainrec]:          https://github.com/fantasyland/fantasy-land#chainrec

[JS:Object.create]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
[JS:Object.assign]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
[JS:Array.isArray]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray

[S]:                    https://sanctuary.js.org/
[S:Either]:             https://sanctuary.js.org/#either-type
[S:is]:                 https://sanctuary.js.org/#is
[S:create]:             https://sanctuary.js.org/#create

[SS]:                   https://github.com/sanctuary-js/sanctuary-show
[STI]:                  https://github.com/sanctuary-js/sanctuary-type-identifiers
[FST]:                  https://github.com/fluture-js/fluture-sanctuary-types

[$]:                    https://github.com/sanctuary-js/sanctuary-def

[concurrify]:           https://github.com/fluture-js/concurrify

[Rollup]:               https://rollupjs.org/

[Guide:HM]:             https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch7.html
[Guide:constraints]:    https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch7.html#constraints

[1]:                    https://en.wikipedia.org/wiki/Continuation-passing_style
[3]:                    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator
[5]:                    https://vimeo.com/106008027
[6]:                    https://github.com/rpominov/static-land
[7]:                    https://promisesaplus.com/
[9]:                    https://wearereasonablepeople.nl/
[10]:                   https://medium.com/@avaq/broken-promises-2ae92780f33
