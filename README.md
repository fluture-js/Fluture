# [![Fluture](logo.png)](#butterfly)

[![Build Status][]](https://github.com/fluture-js/Fluture/actions?query=branch%3Amaster+workflow%3ATest)
[![Code Coverage][]](https://codecov.io/gh/fluture-js/Fluture/branch/master)
[![Dependency Status][]](https://david-dm.org/fluture-js/Fluture)
[![NPM Package][]](https://www.npmjs.com/package/fluture)
[![Gitter Chat][]](https://gitter.im/fluture-js/Fluture)

[Build Status]: https://github.com/fluture-js/Fluture/workflows/Test/badge.svg
[Code Coverage]: https://img.shields.io/codecov/c/github/fluture-js/Fluture/master.svg
[Dependency Status]: https://img.shields.io/david/fluture-js/Fluture.svg
[NPM Package]: https://img.shields.io/npm/v/fluture.svg
[Gitter Chat]: https://img.shields.io/gitter/room/fluture-js/Fluture.svg?colorB=blue

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
* [A pleasant debugging experience](#debugging).

For more information:

* [API documentation](#documentation)
* [Article: Introduction to Fluture - A Functional Alternative to Promises][10]
* [Wiki: Compare Futures to Promises][wiki:promises]
* [Wiki: Compare Fluture to similar libraries][wiki:similar]
* [Video: Monad a Day - Futures by @DrBoolean][5]

## Installation

### With NPM

```console
$ npm install --save fluture
```

### Bundled from a CDN

To load Fluture directly into a browser, a code pen, or [Deno][], use one of
the following downloads from the JSDelivr content delivery network. These are
single files that come with all of Fluture's dependencies pre-bundled.

- [Fluture Script][]: A JavaScript file that adds `Fluture` to the global
  scope. Ideal for older browsers and code pens.
- [Fluture Script Minified][]: The same as above, but minified.
- [Fluture Module][]: An EcmaScript module with named exports. Ideal for Deno
  or modern browsers.
- [Fluture Module Minified][]: A minified EcmaScript module without TypeScript
  typings. Not recommended for Deno.

[Fluture Script]: https://cdn.jsdelivr.net/gh/fluture-js/Fluture@12.3.1/dist/bundle.js
[Fluture Script Minified]: https://cdn.jsdelivr.net/gh/fluture-js/Fluture@12.3.1/dist/bundle.min.js
[Fluture Module]: https://cdn.jsdelivr.net/gh/fluture-js/Fluture@12.3.1/dist/module.js
[Fluture Module Minified]: https://cdn.jsdelivr.net/gh/fluture-js/Fluture@12.3.1/dist/module.min.js

## Usage

### EcmaScript Module

Fluture is written as modular JavaScript.

- On Node 13 and up, Fluture can be loaded directly as shown in the example.
- On Node 12, the `--experimental-modules` flag must be provided.
- On Node versions below 12, the [esm loader][esm] can be used. Alternatively,
  there is a [CommonJS Module](#commonjs-module) available.
- Modern browsers can run Fluture directly. If you'd like to try this out,
  I recommend installing Fluture with [Pika][] or [Snowpack][]. You can also
  try the [bundled module](#bundled-from-a-cdn) to avoid a package manager.
- For older browsers, use a bundler such as [Rollup][] or WebPack. Besides the
  module system, Fluture uses purely ES5-compatible syntax, so the source does
  not have to be transpiled after bundling. Alternatively, there is a
  [CommonJS Module](#commonjs-module) available.

```js
import {readFile} from 'fs'
import {node, encase, chain, map, fork} from 'fluture/index.js'

const getPackageName = file => (
  node (done => { readFile (file, 'utf8', done) })
  .pipe (chain (encase (JSON.parse)))
  .pipe (map (x => x.name))
)

getPackageName ('package.json')
.pipe (fork (console.error) (console.log))
```

### CommonJS Module

Although the Fluture source uses the EcmaScript module system,
the `main` file points to a CommonJS version of Fluture.

On older environments one or more of the following functions may need to be
polyfilled: [`Object.create`][JS:Object.create],
[`Object.assign`][JS:Object.assign] and [`Array.isArray`][JS:Array.isArray].

```js
const fs = require ('fs')
const Future = require ('fluture')

const getPackageName = function (file) {
  return Future.node (function (done) { fs.readFile (file, 'utf8', done) })
  .pipe (Future.chain (Future.encase (JSON.parse)))
  .pipe (Future.map (function (x) { return x.name }))
}

getPackageName ('package.json')
.pipe (Future.fork (console.error) (console.log))
```

## Documentation

### Table of contents

<details open><summary>General</summary>

- [Installation instructions](#installation)
- [Usage instructions](#usage)
- [About the Fluture project](#butterfly)
- [On interoperability with other libraries](#interoperability)
- [How to read the type signatures](#type-signatures)
- [How cancellation works](#cancellation)
- [On stack safety](#stack-safety)
- [Debugging with Fluture](#debugging)
- [Casting Futures to String](#casting-futures-to-string)
- [Usage with Sanctuary](#sanctuary)
- [Using multiple versions of Fluture alongside each other](#incompatible-fluture-versions)

</details>

<details><summary>Creating new Futures</summary>

- [`Future`: Create a possibly cancellable Future](#future)
- [`resolve`: Create a resolved Future](#resolve)
- [`reject`: Create a rejected Future](#reject)
- [`after`: Create a Future that resolves after a timeout](#after)
- [`rejectAfter`: Create a Future that rejects after a timeout](#rejectafter)
- [`go`: Create a "coroutine" using a generator function](#go)
- [`attempt`: Create a Future using a possibly throwing function](#attempt)
- [`attemptP`: Create a Future using a Promise-returning function](#attemptp)
- [`node`: Create a Future using a Node-style callback](#node)
- [`encase`: Convert a possibly throwing function to a Future function](#encase)
- [`encaseP`: Convert a Promise-returning function to a Future function](#encasep)

</details>

<details><summary>Converting between Nodeback APIs and Futures</summary>

- [`node`: Create a Future using a Node-style callback](#node)
- [`done`: Consume a Future by providing a Nodeback](#done)

</details>

<details><summary>Converting between Promises and Futures</summary>

- [`attemptP`: Create a Future using a Promise-returning function](#attemptp)
- [`encaseP`: Convert a Promise-returning function to a Future function](#encasep)
- [`promise`: Convert a Future to a Promise](#promise)

</details>

<details><summary>Transforming and combining Futures</summary>

- [`pipe`: Apply a function to a Future in a fluent method chain](#pipe)
- [`map`: Synchronously process the success value in a Future](#map)
- [`bimap`: Synchronously process the success or failure value in a Future](#bimap)
- [`chain`: Asynchronously process the success value in a Future](#chain)
- [`bichain`: Asynchronously process the success or failure value in a Future](#bichain)
- [`swap`: Swap the success with the failure value](#swap)
- [`mapRej`: Synchronously process the failure value in a Future](#maprej)
- [`chainRej`: Asynchronously process the failure value in a Future](#chainrej)
- [`coalesce`: Coerce success and failure values into the same success value](#coalesce)
- [`ap`: Combine the success values of multiple Futures using a function](#ap)
- [`pap`: Combine the success values of multiple Futures in parallel using a function](#pap)
- [`and`: Logical *and* for Futures](#and)
- [`alt`: Logical *or* for Futures](#alt)
- [`lastly`: Run a Future after the previous settles](#lastly)
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

- [`pap`: Combine the success values of multiple Futures in parallel using a function](#pap)
- [`race`: Race two Futures against each other](#race)
- [`both`: Await both success values from two Futures](#both)
- [`parallel`: Await all success values from many Futures](#parallel)
- [`ConcurrentFuture`: A separate data-type for doing algebraic concurrency](#concurrentfuture)
- [`alt`: Behaves like `race` on `ConcurrentFuture` instances](#alt)

</details>

<details><summary>Resource management</summary>

- [`hook`: Safely create and dispose resources](#hook)
- [`lastly`: Run a Future after the previous settles](#lastly)

</details>

<details><summary>Other utilities</summary>

- [`pipe`: Apply a function to a Future in a fluent method chain](#pipe)
- [`cache`: Cache a Future so that it can be forked multiple times](#cache)
- [`isFuture`: Determine whether a value is a Fluture compatible Future](#isfuture)
- [`never`: A Future that never settles](#never)
- [`debugMode`: Configure Fluture's debug mode](#debugmode)
- [`context`: The debugging context of a Future instance](#context)

</details>

### Butterfly

The name "Fluture" is a conjunction of "FL" (the acronym to [Fantasy Land][FL])
and "future". Fluture means butterfly in Romanian: A creature one might expect
to see in Fantasy Land.

Credit goes to Erik Fuente for styling the logo, and [WEAREREASONABLEPEOPLE][9]
for sponsoring the project.

### Interoperability

[<img src="https://raw.github.com/fantasyland/fantasy-land/master/logo.png" align="right" width="82" height="82" alt="Fantasy Land" />][FL]

* `Future` implements [Fantasy Land][FL] 1.0+ -compatible
  `Alt`, `Bifunctor`, `Monad`, and `ChainRec`
  (`of`, `ap`, `alt`, `map`, `bimap`, `chain`, `chainRec`).
* `Future.Par` implements [Fantasy Land 3][FL] -compatible
  `Alternative` (`of`, `zero`, `map`, `ap`, `alt`).
* The Future and ConcurrentFuture representatives contain `@@type` properties
  for [Sanctuary Type Identifiers][STI].
* The Future and ConcurrentFuture instances contain `@@show` properties for
  [Sanctuary Show][SS].

### Type signatures

The various function signatures are provided in a small language referred to as
Hindley-Milner notation.

In summary, the syntax is as follows: `InputType -> OutputType`. Now,
because functions in Fluture are [curried][Guide:currying], the "output" of a
function is often *another function*. In Hindley-Milner that's simply written
as `InputputType -> InputToSecondFunction -> OutputType` and so forth.

By convention, types starting with an upper-case letter are
[concrete types](#types). When they start with a lower-case letter they're
*type variables*. You can think of these type variables as generic types.
So `a -> b` denotes a function from generic type `a` to generic type `b`.

Finally, through so-called [*constraints*](#type-classes), type variables can
be forced to conform to an "interface" (or *Type Class* in functional jargon).
For example, `MyInterface a => a -> b`, denotes a function from generic type
`a` to generic type `b`, *where `a` must implement `MyInterface`*.

You can read in depth about [Hindley-Milner in JavaScript][Guide:HM] here.

#### Types

The concrete types you will encounter throughout this documentation:

- **Future** - Instances of Future provided by
  [compatible versions](#incompatible-fluture-versions) of Fluture.
- **ConcurrentFuture** - Futures wrapped with ([`Future.Par`](#concurrentfuture)).
- **Promise a b** - Values which conform to the [Promises/A+ specification][7]
  and have a rejection reason of type `a` and a resolution value of type `b`.
- **Nodeback a b** - A Node-style callback; A function of signature `(a | Nil, b) -> x`.
- **Pair a b** - An array with exactly two elements: `[a, b]`.
- **Iterator** - Objects with `next`-methods which conform to the [Iterator protocol][3].
- **Cancel** - The nullary [cancellation](#cancellation) functions returned from computations.
- **Throwing e a b** - A function from `a` to `b` that may throw an exception `e`.
- **List** - Fluture's internal linked-list structure: `{ head :: Any, tail :: List }`.
- **Context** - Fluture's internal debugging context object:
  `{ tag :: String, name :: String, stack :: String }`.

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

Cancellation is a system whereby running Futures get an opportunity to stop
what they're doing and release resources that they were holding, when the
consumer indicates it is no longer interested in the result.

To cancel a Future, it must be unsubscribed from. Most of the
[consumption functions](#consuming-futures) return an `unsubscribe` function.
Calling it signals that we are no longer interested in the result. After
calling `unsubscribe`, Fluture guarantees that our callbacks will not be
called; but more importantly: a cancellation signal is sent upstream.

The cancellation signal travels all the way back to the source (with the
exception of cached Futures - see [`cache`](#cache)), allowing all parties
along the way to clean up.

With the [`Future` constructor](#future), we can provide a custom cancellation
handler by returning it from the computation. Let's see what this looks like:

```js
// We use the Future constructor to create a Future instance.
const eventualAnswer = Future (function computeTheAnswer (rej, res) {

  // We give the computer time to think about the answer, which is 42.
  const timeoutId = setTimeout (res, 60000, 42)

  // Here is how we handle cancellation. This signal is received when nobody
  // is interested in the answer any more.
  return function onCancel () {
    // Clearing the timeout releases the resources we were holding.
    clearTimeout (timeoutId)
  }

})

// Now, let's fork our computation and wait for an answer. Forking gives us
// the unsubscribe function.
const unsubscribe = fork (log ('rejection')) (log ('resolution')) (eventualAnswer)

// After some time passes, we might not care about the answer any more.
// Calling unsubscribe will send a cancellation signal back to the source,
// and trigger the onCancel function.
unsubscribe ()
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
> const add1 = x => x + 1

> let m = resolve (1)

> for (let i = 0; i < 100000; i++) {
.   m = map (add1) (m)
. }

> fork (log ('rejection')) (log ('resolution')) (m)
[resolution]: 100001
```

```js
> const m = (function recur (x) {
.   const mx = resolve (x + 1)
.   return x < 100000 ? chain (recur) (mx) : mx
. }(1))

> fork (log ('rejection')) (log ('resolution')) (m)
[resolution]: 100001
```

To learn more about memory and stack usage under different types of recursion,
see (or execute) [`scripts/test-mem`](scripts/test-mem).

### Debugging

First and foremost, Fluture type-checks all of its input and throws TypeErrors
when incorrect input is provided. The messages they carry are designed to
provide enough insight to figure out what went wrong.

Secondly, Fluture catches exceptions that are thrown asynchronously, and
exposes them to you in one of two ways:

1. By throwing an Error when it happens.
2. By calling your [exception handler](#forkcatch) with an Error.

The original exception isn't used because it might have been any value.
Instead, a regular JavaScript Error instance whose properties are based on the
original exception is created. Its properties are as follows:

- `name`: Always just `"Error"`.
- `message`: The original error message, or a message describing the value.
- `reason`: The original value that was caught by Fluture.
- `context`: A linked list of "context" objects. This is used to create the
  `stack` property, and you generally don't need to look at it. If debug mode
  is not enabled, the list is always empty.
- `stack`: The stack trace of the original exception if it had one, or the
  Error's own stack trace otherwise. If debug mode (see below) is enabled,
  additional stack traces from the steps leading up to the crash are included.
- `future`: The instance of [`Future`](#future) that was being
  [consumed](#consuming-futures) when the exception happened. Often
  [printing it as a String](#casting-futures-to-string) can yield useful
  information. You can also try to consume it in isolation to better identify
  what's going wrong.

Finally, as mentioned, Fluture has a [debug mode](#debugmode) wherein
additional contextual information across multiple JavaScript ticks is
collected, included as an extended "async stack trace" on Errors, and
[exposed on Future instances](#context).

Debug mode can have a significant impact on performance, and uses up memory,
so I would advise against using it in production.

### Casting Futures to String

There are multiple ways to print a Future to String. Let's take a simple
computation as an example:

```js
const add = a => b => a + b;
const eventualAnswer = ap (resolve (22)) (map (add) (resolve (20)));
```

1. Casting it to String directly by calling `String(eventualAnswer)` or
   `eventualAnswer.toString()` will yield an approximation of the code that
   was used to create the Future. In this case:

   ```js
   "ap (resolve (22)) (map (a => b => a + b) (resolve (20)))"
   ```

2. Casting it to String using `JSON.stringify(eventualAnswer, null, 2)` will
   yield a kind of abstract syntax tree.

   ```json
   {
     "$": "fluture/Future@5",
     "kind": "interpreter",
     "type": "transform",
     "args": [
       {
         "$": "fluture/Future@5",
         "kind": "interpreter",
         "type": "resolve",
         "args": [
           20
         ]
       },
       [
         {
           "$": "fluture/Future@5",
           "kind": "transformation",
           "type": "ap",
           "args": [
             {
               "$": "fluture/Future@5",
               "kind": "interpreter",
               "type": "resolve",
               "args": [
                 22
               ]
             }
           ]
         },
         {
           "$": "fluture/Future@5",
           "kind": "transformation",
           "type": "map",
           "args": [
             null
           ]
         }
       ]
     ]
   }
   ```

### Sanctuary

When using this module with [Sanctuary Def][$] (and [Sanctuary][S] by
extension) one might run into the following issue:

```js
> import S from 'sanctuary'

> import {resolve} from 'fluture'

> S.I (resolve (1))
! TypeError: Since there is no type of which all the above values are members,
. the type-variable constraint has been violated.
```

This happens because Sanctuary Def needs to know about the types created by
Fluture to determine whether the type-variables are consistent.

To let Sanctuary know about these types, we can obtain the type definitions
from [`fluture-sanctuary-types`][FST] and pass them to [`S.create`][S:create]:

```js
> import sanctuary from 'sanctuary'

> import {env as flutureEnv} from 'fluture-sanctuary-types'

> import {resolve} from 'fluture'

> const S = sanctuary.create ({checkTypes: true, env: env.concat (flutureEnv)})

> fork (log ('rejection'))
.      (log ('resolution'))
.      (S.I (resolve (42)))
[resolution]: 42
```

### Incompatible Fluture Versions

Most versions of Fluture understand how to consume instances from most other
versions, even across Fluture's major releases. This allows for different
packages that depend on Fluture to interact.

However, sometimes it's unavoidable that a newer version of Fluture is released
that can no longer understand older versions, and vice-versa. This only ever
happens on a major release, and will be mentioned in the breaking change log.
When two incompatible versions of Fluture meet instances, they do their best to
issue a clear error message about it.

When this happens, you need to manually convert the older instance to a newer
instance of Future. When [`isFuture`](#isfuture) returns `false`, a conversion
is necessary. You can also apply this trick if the Future comes from another
library similar to Fluture.

```js
const NoFuture = require ('incompatible-future')

const incompatible = NoFuture.of ('Hello')

const compatible = Future ((rej, res) => {
  return NoFuture.fork (rej) (res) (incompatible)
})

both (compatible) (resolve ('world'))
```

### Creating Futures

#### Future

```hs
Future :: ((a -> Undefined, b -> Undefined) -> Cancel) -> Future a b
```

Creates a Future with the given computation. A computation is a function which
takes two callbacks. Both are continuations for the computation. The first is
`reject`, commonly abbreviated to `rej`; The second is `resolve`, or `res`.
When the computation is finished (possibly asynchronously) it may call the
appropriate continuation with a failure or success value.

Additionally, the computation must return a nullary function containing
cancellation logic. See [Cancellation](#cancellation).

If you find that there is no way to cancel your computation, you can return a
`noop` function as a cancellation function. However, at this point there is
usually a more fitting way to [create that Future](#creating-futures)
(like for example via [`node`](#node)).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (Future (function computation (reject, resolve) {
.        const t = setTimeout (resolve, 20, 42)
.        return () => clearTimeout (t)
.      }))
[resolution]: 42
```

#### resolve

```hs
resolve :: b -> Future a b
```

Creates a Future which immediately resolves with the given value.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (resolve (42))
[answer]: 42
```

#### reject

```hs
reject :: a -> Future a b
```

Creates a Future which immediately rejects with the given value.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (reject ('It broke!'))
[rejection]: "It broke!"
```

#### after

```hs
after :: Number -> b -> Future a b
```

Creates a Future which resolves with the given value after
the given number of milliseconds.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (after (20) (42))
[resolution]: 42
```

#### rejectAfter

```hs
rejectAfter :: Number -> a -> Future a b
```

Creates a Future which rejects with the given reason after the given number of
milliseconds.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (rejectAfter (20) ('It broke!'))
[rejection]: "It broke!"
```

#### go

```hs
go :: (() -> Iterator) -> Future a b
```

A way to do `async`/`await` with Futures, similar to Promise Coroutines or
Haskell Do-notation.

Takes a function which returns an [Iterator](#types), commonly a
generator-function, and chains every produced Future over the previous.

```js
> fork (log ('rejection')) (log ('resolution')) (go (function*() {
.   const thing = yield after (20) ('world')
.   const message = yield after (20) ('Hello ' + thing)
.   return message + '!'
. }))
[resolution]: "Hello world!"
```

A rejected Future short-circuits the whole coroutine.

```js
> fork (log ('rejection')) (log ('resolution')) (go (function*() {
.   const thing = yield reject ('It broke!')
.   const message = yield after (20) ('Hello ' + thing)
.   return message + '!'
. }))
[rejection]: "It broke!"
```

To handle rejections *inside* the coroutine, we need to [`coalesce`](#coalesce)
the error into our control domain.

I recommend using coalesce with an [`Either`][S:Either].

```js
> const control = coalesce (S.Left) (S.Right)

> fork (log ('rejection')) (log ('resolution')) (go (function*() {
.   const thing = yield control (reject ('It broke!'))
.   return S.either (x => `Oh no! ${x}`)
.                   (x => `Yippee! ${x}`)
.                   (thing)
. }))
[resolution]: "Oh no! It broke!"
```

#### attempt

```hs
attempt :: Throwing e Undefined r -> Future e r
```

Creates a Future which resolves with the result of calling the given function,
or rejects with the error thrown by the given function.

Short for [`encase (f) (undefined)`](#encase).

```js
> const data = {foo: 'bar'}

> fork (log ('rejection'))
.      (log ('resolution'))
.      (attempt (() => data.foo.bar.baz))
[rejection]: new TypeError ("Cannot read property 'baz' of undefined")
```

#### attemptP

```hs
attemptP :: (Undefined -> Promise a b) -> Future a b
```

Create a Future which when forked spawns a Promise using the given function and
resolves with its resolution value, or rejects with its rejection reason.

Short for [`encaseP (f) (undefined)`](#encasep).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (attemptP (() => Promise.resolve (42)))
[resolution]: 42
```

#### node

```hs
node :: (Nodeback e r -> x) -> Future e r
```

Creates a Future which rejects with the first argument given to the function,
or resolves with the second if the first is not present.

Note that this function **does not support cancellation**.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (node (done => done (null, 42)))
[resolution]: 42
```

#### encase

```hs
encase :: Throwing e a r -> a -> Future e r
```

Takes a function and a value, and returns a Future which when forked calls the
function with the value and resolves with the result. If the function throws
an exception, it is caught and the Future will reject with the exception.

Applying `encase` with a function `f` creates a "safe" version of `f`. Instead
of throwing exceptions, the encased version always returns a Future.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (encase (JSON.parse) ('{"foo" = "bar"}'))
[rejection]: new SyntaxError ('Unexpected token =')
```

#### encaseP

```hs
encaseP :: (a -> Promise e r) -> a -> Future e r
```

Turns Promise-returning functions into Future-returning functions.

Takes a function which returns a Promise, and a value, and returns a Future.
When forked, the Future calls the function with the value to produce the
Promise, and resolves with its resolution value, or rejects with its rejection
reason.

```js
> encaseP (fetch) ('https://api.github.com/users/Avaq')
. .pipe (chain (encaseP (res => res.json ())))
. .pipe (map (user => user.name))
. .pipe (fork (log ('rejection')) (log ('resolution')))
[resolution]: "Aldwin Vlasblom"
```

### Transforming Futures

#### map

```hs
map :: Functor m => (a -> b) -> m a -> m b
```

Transforms the resolution value inside the Future or [Functor][FL:functor],
and returns a Future or Functor with the new value. The transformation is only
applied to the resolution branch: if the Future is rejected, the transformation
is ignored.

See also [`chain`](#chain) and [`mapRej`](#maprej).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (map (x => x + 1) (resolve (41)))
[resolution]: 42
```

For comparison, an approximation with Promises is:

```js
> Promise.resolve (41)
. .then (x => x + 1)
. .then (log ('resolution'), log ('rejection'))
[resolution]: 42
```

#### bimap

```hs
bimap :: Bifunctor m => (a -> c) -> (b -> d) -> m a b -> m c d
```

Maps the left function over the rejection reason, or the right function over
the resolution value, depending on which is present. Can be used on any
[Bifunctor][FL:bifunctor].

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (bimap (x => x + '!') (x => x + 1) (resolve (41)))
[resolution]: 42

> fork (log ('rejection'))
.      (log ('resolution'))
.      (bimap (x => x + '!') (x => x + 1) (reject ('It broke!')))
[rejection]: "It broke!!"
```

For comparison, an approximation with Promises is:

```js
> Promise.resolve (41)
. .then (x => x + 1, x => Promise.reject (x + '!'))
. .then (log ('resolution'), log ('rejection'))
[resolution]: 42

> Promise.reject ('It broke!')
. .then (x => x + 1, x => Promise.reject (x + '!'))
. .then (log ('resolution'), log ('rejection'))
[rejection]: "It broke!!"
```

#### chain

```hs
chain :: Chain m => (a -> m b) -> m a -> m b
```

Sequence a new Future or [Chain][FL:chain] using the resolution value from
another. Similarly to [`map`](#map), `chain` expects a function. But instead
of returning the new *value*, chain expects a Future (or instance of the same
Chain) to be returned.

The transformation is only applied to the resolution branch: if the Future is
rejected, the transformation is ignored.

See also [`chainRej`](#chainrej).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (chain (x => resolve (x + 1)) (resolve (41)))
[resolution]: 42
```

For comparison, an approximation with Promises is:

```js
> Promise.resolve (41)
. .then (x => Promise.resolve (x + 1))
. .then (log ('resolution'), log ('rejection'))
[resolution]: 42
```

#### bichain

```hs
bichain :: (a -> Future c d) -> (b -> Future c d) -> Future a b -> Future c d
```

Sequence a new Future using either the resolution or the rejection value from
another. Similarly to [`bimap`](#bimap), `bichain` expects two functions. But
instead of returning the new *value*, bichain expects Futures to be returned.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (bichain (resolve) (x => resolve (x + 1)) (resolve (41)))
[resolution]: 42

> fork (log ('rejection'))
.      (log ('resolution'))
.      (bichain (x => resolve (x + 1)) (resolve) (reject (41)))
[resolution]: 42
```

For comparison, an approximation with Promises is:

```js
> Promise.resolve (41)
. .then (x => Promise.resolve (x + 1), Promise.resolve)
. .then (log ('resolution'), log ('rejection'))
[resolution]: 42

> Promise.reject (41)
. .then (Promise.resolve, x => Promise.resolve (x + 1))
. .then (log ('resolution'), log ('rejection'))
[resolution]: 42
```

#### swap

```hs
swap :: Future a b -> Future b a
```

Swap the rejection and resolution branches.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (swap (resolve (42)))
[rejection]: 42

> fork (log ('rejection'))
.      (log ('resolution'))
.      (swap (reject (42)))
[resolution]: 42
```

#### mapRej

```hs
mapRej :: (a -> c) -> Future a b -> Future c b
```

Map over the **rejection** reason of the Future. This is like [`map`](#map),
but for the rejection branch.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (mapRej (s => `Oh no! ${s}`) (reject ('It broke!')))
[rejection]: "Oh no! It broke!"
```

For comparison, an approximation with Promises is:

```js
> Promise.reject ('It broke!')
. .then (null, s => Promise.reject (`Oh no! ${s}`))
. .then (log ('resolution'), log ('rejection'))
[rejection]: "Oh no! It broke!"
```

#### chainRej

```hs
chainRej :: (a -> Future c b) -> Future a b -> Future c b
```

Chain over the **rejection** reason of the Future. This is like
[`chain`](#chain), but for the rejection branch.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (chainRej (s => resolve (`${s} But it's all good.`)))
[resolution]: "It broke! But it's all good."
```

For comparison, an approximation with Promises is:

```js
> Promise.reject ('It broke!')
. .then (null, s => `${s} But it's all good.`)
. .then (log ('resolution'), log ('rejection'))
[resolution]: "It broke! But it's all good."
```

#### coalesce

```hs
coalesce :: (a -> c) -> (b -> c) -> Future a b -> Future d c
```

Applies the left function to the rejection value, or the right function to the
resolution value, depending on which is present, and resolves with the result.

This provides a convenient means to ensure a Future is always resolved. It can
be used with other type constructors, like [`S.Either`][S:Either], to maintain
a representation of failure.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (coalesce (S.Left) (S.Right) (resolve ('hello'))
[resolution]: Right ("hello")

> fork (log ('rejection'))
.      (log ('resolution'))
.      (coalesce (S.Left) (S.Right) (reject ('It broke!'))
[resolution]: Left ("It broke!")
```

For comparison, an approximation with Promises is:

```js
> Promise.resolve ('hello')
. .then (S.Right, S.Left)
. .then (log ('resolution'), log ('rejection'))
[resolution]: Right ("hello")

> Promise.reject ('It broke!')
. .then (S.Right, S.Left)
. .then (log ('resolution'), log ('rejection'))
[resolution]: Left ("It broke!")
```

### Combining Futures

#### ap

```hs
ap :: Apply m => m a -> m (a -> b) -> m b
```

Applies the function contained in the right-hand Future or [Apply][FL:apply]
to the value contained in the left-hand Future or Apply. This process can be
repeated to gradually fill out multiple function arguments of a curried
function, as shown below.

Note that the Futures will be executed in sequence - not in parallel\* -
because of the Monadic nature of Futures. The execution order is, as
specified by Fantasy Land, `m (a -> b)` first followed by `m a`.
So that's *right before left*.

\* Have a look at [`pap`](#pap) for an `ap` function that runs its arguments
   in parallel. If you must use `ap` (because you're creating a generalized
   function), but still want Futures passed into it to run in parallel, then
   you could use [ConcurrentFuture](#concurrentfuture) instead.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (ap (resolve (7)) (ap (resolve (49)) (resolve (x => y => x - y))))
[resolution]: 42
```

#### pap

```hs
pap :: Future a b -> Future a (b -> c) -> Future a c
```

Has the same signature and function as [`ap`](#ap), but runs the two Futures
given to it in parallel. See also [ConcurrentFuture](#concurrentfuture) for a
more general way to achieve this.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (pap (resolve (7)) (pap (resolve (49)) (resolve (x => y => x - y))))
[resolution]: 42
```

#### alt

```hs
alt :: Alt f => f a -> f a -> f a
```

Select one of two [Alts](#types).

Behaves like logical *or* on [`Future`](#future) instances, returning a new
Future which either resolves with the first resolution value, or rejects with
the last rejection reason. We can use it if we want a computation to run only
if another has failed.

Note that the Futures will be executed in sequence - not in parallel\* -
because of the Monadic nature of Futures. The *right* Future is evaluated
before the *left* Future.

See also [`and`](#and) and [`lastly`](#lastly).

\* If you'd like to use a parallel implementation of `alt`, you could simply
   use [`race`](#race). Alternatively you could wrap your Future instances
   with [`Par`](#concurrentfuture) before passing them to `alt`.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (alt (resolve ('left')) (resolve ('right')))
[resolution]: "right"

> fork (log ('rejection'))
.      (log ('resolution'))
.      (alt (resolve ('left')) (reject ('It broke!')))
[resolution]: "left"
```

#### and

```hs
and :: Future a c -> Future a b -> Future a c
```

Logical *and* for Futures.

Returns a new Future which either rejects with the first rejection reason, or
resolves with the last resolution value once and if both Futures resolve. We
can use it if we want a computation to run only after another has succeeded.
The *right* Future is evaluated before the *left* Future.

See also [`alt`](#alt) and [`lastly`](#lastly).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (and (resolve ('left')) (resolve ('right')))
[resolution]: "left"

> fork (log ('rejection'))
.      (log ('resolution'))
.      (and (resolve ('left')) (reject ('It broke!')))
[rejection]: "It broke!"
```

#### lastly

```hs
lastly :: Future a c -> Future a b -> Future a b
```

Run a second Future after the first settles (successfully or unsuccessfully).
Rejects with the rejection reason from the first or second Future, or resolves
with the resolution value from the first Future. This can be used to run a
computation after another settles, successfully or unsuccessfully.

If you're looking to clean up resources after running a computation which
acquires them, you should use [`hook`](#hook), which has many more fail-safes
in place.

See also [`and`](#and) and [`alt`](#alt).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (lastly (encase (log ('lastly')) ('All done!')) (resolve (42)))
[lastly]: "All done!"
[resolution]: 42
```

### Consuming Futures

#### fork

```hs
fork :: (a -> Any) -> (b -> Any) -> Future a b -> Cancel
```

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
computation, it can call the `unsubscribe` function returned by `fork`. See
[Cancellation](#cancellation).

If an exception was encountered during the computation, it will be re-thrown
by `fork` and likely not be catchable. You can handle it using
`process.on('uncaughtException')` in Node, or use [`forkCatch`](#forkcatch).

Almost all code examples in Fluture use `fork` to run the computation. There
are some variations on `fork` that serve different purposes below.

#### forkCatch

```hs
forkCatch :: (Error -> Any) -> (a -> Any) -> (b -> Any) -> Future a b -> Cancel
```

An advanced version of [fork](#fork) that allows us to react to a fatal error
in a custom way. Fatal errors occur when unexpected exceptions are thrown, when
the Fluture API is used incorrectly, or when resources couldn't be disposed.

The exception handler will always be called with an instance of `Error`,
independent of what caused the crash.

**Using this function is a trade-off;**

Generally it's best to let a program crash and restart when an a fatal error
occurs. Restarting is the surest way to restore the memory that was allocated
by the program to an expected state.

By using `forkCatch`, we can keep our program alive after a fatal error, which
can be very beneficial when the program is being used by multiple clients.
However, since fatal errors might indicate that something, somewhere has
entered an invalid state, it's probably still best to restart our program upon
encountering one.

See [Debugging](#debugging) for information about the Error object that is
passed to your exception handler.

```js
> forkCatch (log ('fatal error'))
.           (log ('rejection'))
.           (log ('resolution'))
.           (map (x => x.foo) (resolve (null)))
[fatal error]: new Error ("Cannot read property 'foo' of null")
```

#### value

```hs
value :: (b -> Any) -> Future a b -> Cancel
```

Like [`fork`](#fork) but for the resolution branch only. Only use this function
if you are sure the Future is going to be resolved, for example; after using
[`coalesce`](#coalesce). If the Future rejects, `value` will throw an Error.

As with [`fork`](#fork), `value` returns an `unsubscribe` function. See
[Cancellation](#cancellation).

```js
> value (log ('resolution')) (resolve (42))
[resolution]: 42
```

#### done

```hs
done :: Nodeback a b -> Future a b -> Cancel
```

Run the Future using a [Nodeback](#types) as the continuation.

This is like [`fork`](#fork), but instead of taking two unary functions, it
takes a single binary function.

As with [`fork`](#fork), `done` returns an `unsubscribe` function. See
[Cancellation](#cancellation).

```js
> done ((err, val) => log ('resolution') (val)) (resolve (42))
[resolution]: 42
```

#### promise

```hs
promise :: Future Error a -> Promise Error a
```

Run the Future and get a Promise to represent its continuation.

Returns a Promise which resolves with the resolution value, or rejects with
the rejection reason of the Future.

If an exception was encountered during the computation, the promise will reject
with it. I recommend using [`coalesce`](#coalesce) before `promise` to ensure
that exceptions and rejections are not mixed into the Promise rejection branch.

Cancellation capabilities are lost when using `promise` to consume the Future.

```js
> promise (resolve (42)) .then (log ('resolution'))
[resolution]: 42

> promise (reject ('failure')) .then (log ('resolution'), log ('rejection'))
[rejection]: "failure"
```

### Parallelism

#### race

```hs
race :: Future a b -> Future a b -> Future a b
```

Race two Futures against each other. Creates a new Future which resolves or
rejects with the resolution or rejection value of the first Future to settle.

When one Future settles, the other gets cancelled automatically.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (race (after (15) ('left')) (after (30) ('right')))
[resolution]: "left"
```

#### both

```hs
both :: Future a b -> Future a c -> Future a (Pair b c)
```

Run two Futures in parallel and get a [`Pair`](#types) of the results. When
either Future rejects, the other Future will be cancelled and the resulting
Future will reject.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (both (after (15) ('left')) (after (30) ('right')))
[resolution]: ["left", "right"]
```

#### parallel

```hs
parallel :: PositiveInteger -> Array (Future a b) -> Future a (Array b)
```

Creates a Future which when forked runs all Futures in the given Array in
parallel, ensuring no more than `limit` Futures are running at once.

In the following example, we're running up to 5 Futures in parallel. Every
Future takes about 20ms to settle, which means the result should appear after
about 40ms.

If we use `1` for the limit, the Futures would run in sequence, causing the
result to appear only after 200ms.

We can also use `Infinity` as the limit. This would create a function similar
to `Promise.all`, which always runs all Futures in parallel. This can easily
cause the computation to consume too many resources, however, so I would
advise using a number roughly equal to maximum size of Array you think your
program should handle.

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (parallel (5) (Array.from (Array (10) .keys ()) .map (after (20))))
[resolution]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

When one Future rejects, all currently running Futures will be cancelled and
the resulting Future will reject. If you want to settle all Futures, even if
some may fail, you can use `parallel` in combination with
[coalesce](#coalesce).

```js
> fork (log ('rejection'))
.      (log ('resolution'))
.      (parallel (2) ([resolve (42), reject ('It broke!')]
.                     .map (coalesce (S.Left) (S.Right))))
[resolution]: [Right (42), Left ("It broke!")]
```

#### ConcurrentFuture

The `ConcurrentFuture` type is very similar to the `Future` type, except that
it has *parallel* semantics where `Future` has *sequential* semantics.

These sematics are most notable in the implementation of Applicative for
`ConcurrentFuture`. When using [`ap`](#ap) on two ConcurrentFutures, they
run parallely, whereas regular `Future` instances would've run sequentially.
This means that `ConcurrentFuture` cannot be a Monad, which is why we have
it as a separate type.

The implementation of Alternative on `ConcurrentFuture` has parallel semantics
as well. Whereas [`alt`](#alt) on regular Futures uses the failure effect to
determine a winner, on ConcurrentFutures *timing* is used, and the winner will
be whichever ConcurrentFuture settled first.

The idea is that we can switch back and forth between `Future` and
`ConcurrentFuture`, using [`Par`](#par) and [`seq`](#seq), to get sequential or
concurrent behaviour respectively. It's a useful type to pass to abstractions
that don't know about Future-specific functions like [`parallel`](#parallel) or
[`race`](#race), but *do* know how to operate on Apply and Alternative.

```js
//Some dummy values
const x = 41;
const f = a => a + 1;

//The following two are equal ways to construct a ConcurrentFuture
const parx = S.of (Par) (x)
const parf = Par (S.of (Future) (f))

//We can make use of parallel apply
value (log ('resolution')) (seq (ap (parx) (parf)))
[resolution]: 42

//Concurrent sequencing
value (log ('resolution')) (seq (S.sequence (Par) ([parx, parx, parx])))
[resolution]: [41, 41, 41]

//And concurrent alt
value (log ('resolution')) (alt (after (15) ('left')) (after (30) ('right')))
[resolution]: "left"
```

##### Par

```hs
Par :: Future a b -> ConcurrentFuture a b
```

Converts a Future to a ConcurrentFuture.

##### seq

Converts a ConcurrentFuture to a Future.

```hs
seq :: ConcurrentFuture a b -> Future a b
```

### Resource management

Functions listed under this category allow for more fine-grained control over
the flow of acquired values.

#### hook

```hs
hook :: Future a b -> (b -> Future c d) -> (b -> Future a e) -> Future a e
```

Combines resource acquisition, consumption, and disposal in such a way that you
can be sure that a resource will always be disposed if it was acquired, even if
an exception is thrown during consumption; Sometimes referred to as bracketing.

The signature is like `hook (acquire, dispose, consume)`, where:

- `acquire` is a Future which might create connections, open files, etc.
- `dispose` is a function that takes the result from `acquire` and should be
  used to clean up (close connections etc). The Future it returns must
  resolve, and its resolution value is ignored. If it rejects, a fatal error
  is raised which can only be handled with [`forkCatch`](#forkcatch).
- `consume` is another Function takes the result from `acquire`, and may be
  used to perform any arbitrary computations using the resource.

Typically, you'd want to partially apply this function with the first two
arguments (acquisition and disposal), as shown in the example.

```js
> import {open, read, close} from 'fs'

> const withFile = hook (node (done => open ('package.json', 'r', done)))
.                       (fd => node (done => close (fd, done)))

> fork (log ('rejection'))
.      (log ('resolution'))
.      (withFile (fd => node (done => (
.        read (fd, Buffer.alloc (1), 0, 1, null, (e, _, x) => done (e, x)))
.      )))
[resolution]: <Buffer 7b>
```

When a hooked Future is cancelled while acquiring its resource, nothing else
will happen. When it's cancelled after acquistion completes, however, the
disposal will still run, and if it fails, an exception will be thrown.

If you have multiple resources that you'd like to consume all at once, you can
use [Fluture Hooks](https://github.com/fluture-js/fluture-hooks) to combine
multiple hooks into one.

### Utility functions

#### pipe

```hs
Future.prototype.pipe :: Future a b ~> (Future a b -> c) -> c
```

A method available on all Futures to allow arbitrary functions over Futures to
be included in a fluent-style method chain.

You can think of this as a fallback for the [ESNext pipe operator (`|>`)][2].

```js
> resolve (x => y => x * y)
. .pipe (ap (after (20) (Math.PI)))
. .pipe (ap (after (20) (13.37)))
. .pipe (map (Math.round))
. .pipe (fork (log ('rejection')) (log ('resolution')))
[resolution]: 42
```

#### cache

```hs
cache :: Future a b -> Future a b
```

Returns a Future which caches the resolution value or rejection reason of the
given Future so that whenever it's forked, it can load the value from cache
rather than re-executing the underlying computation.

This essentially turns a unicast Future into a multicast Future, allowing
multiple consumers to subscribe to the same result. The underlying computation
is never [cancelled](#cancellation) unless *all* consumers unsubscribe before
it completes.

**There is a glaring drawback to using `cache`**, which is that returned
Futures are no longer referentially transparent, making reasoning about them
more difficult and refactoring code that uses them harder.

```js
> import {readFile} from 'fs'

> const eventualPackageName = (
.   node (done => readFile ('package.json', 'utf8', done))
.   .pipe (chain (encase (JSON.parse)))
.   .pipe (chain (encase (x => x.name)))
.   .pipe (map (data => {
.      log ('debug') ('Read, parsed, and traversed the package data')
.      return data
.    }))
. )

> fork (log ('rejection')) (log ('resolution')) (eventualPackageName)
[debug]: "Read, parsed, and traversed the package data"
[resolution]: "Fluture"

> fork (log ('rejection')) (log ('resolution')) (eventualPackageName)
[debug]: "Read, parsed, and traversed the package data"
[resolution]: "Fluture"

> const eventualCachedPackageName = cache (eventualPackageName)

> fork (log ('rejection')) (log ('resolution')) (eventualCachedPackageName)
[debug]: "Read, parsed, and traversed the package data"
[resolution]: "Fluture"

> fork (log ('rejection')) (log ('resolution')) (eventualCachedPackageName)
[resolution]: "Fluture"
```

#### isFuture

```hs
isFuture :: a -> Boolean
```

Returns true for [Futures](#types) and false for everything else. This function
(and [`S.is`][S:is]) also return `true` for instances of Future that were
created within other contexts. It is therefore recommended to use this over
`instanceof`, unless your intent is to explicitly check for Futures created
using the exact `Future` constructor you're testing against.

```js
> isFuture (resolve (42))
true

> isFuture (42)
false
```

#### never

```hs
never :: Future a b
```

A Future that never settles. Can be useful as an initial value when reducing
with [`race`](#race), for example.

#### isNever

```hs
isNever :: a -> Boolean
```

Returns `true` if the given input is a `never`.

#### extractLeft

```hs
extractLeft :: Future a b -> Array a
```

Returns an array whose only element is the rejection reason of the Future.
In many cases it will be impossible to extract this value; In those cases, the
array will be empty. This function is meant to be used for type introspection:
it is **not** the correct way to [consume a Future](#consuming-futures).

#### extractRight

```hs
extractRight :: Future a b -> Array b
```

Returns an array whose only element is the resolution value of the Future.
In many cases it will be impossible to extract this value; In those cases, the
array will be empty. This function is meant to be used for type introspection:
it is **not** the correct way to [consume a Future](#consuming-futures).

#### debugMode

```hs
debugMode :: Boolean -> Undefined
```

Enable or disable Fluture's debug mode. Debug mode is disabled by default.
Pass `true` to enable, or `false` to disable.

```js
debugMode (true)
```

For more information, see [Debugging](#debugging) and [Context](#context).

#### context

```hs
Future.prototype.context :: Future a b ~> List Context
```

A linked list of debugging contexts made available on every instance of
`Future`. When [debug mode](#debugmode) is disabled, the list is always empty.

The context objects have `stack` properties which contain snapshots of the
stacktraces leading up to the creation of the `Future` instance. They are used
by Fluture to generate contextual stack traces.

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

[JS:Object.create]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
[JS:Object.assign]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
[JS:Array.isArray]:     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray

[S]:                    https://sanctuary.js.org/
[S:Either]:             https://sanctuary.js.org/#either-type
[S:is]:                 https://sanctuary.js.org/#is
[S:create]:             https://sanctuary.js.org/#create
[S:join]:               https://sanctuary.js.org/#join

[SS]:                   https://github.com/sanctuary-js/sanctuary-show
[STI]:                  https://github.com/sanctuary-js/sanctuary-type-identifiers
[FST]:                  https://github.com/fluture-js/fluture-sanctuary-types

[$]:                    https://github.com/sanctuary-js/sanctuary-def

[Rollup]:               https://rollupjs.org/
[Pika]:                 https://www.pikapkg.com/
[Snowpack]:             https://www.snowpack.dev/
[esm]:                  https://github.com/standard-things/esm
[Deno]:                 https://deno.land/

[Guide:HM]:             https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch7.html
[Guide:constraints]:    https://drboolean.gitbooks.io/mostly-adequate-guide/content/ch7.html#constraints
[Guide:currying]:       https://drboolean.gitbooks.io/mostly-adequate-guide-old/content/ch4.html

[1]:                    https://en.wikipedia.org/wiki/Continuation-passing_style
[2]:                    https://github.com/tc39/proposal-pipeline-operator
[3]:                    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator
[5]:                    https://vimeo.com/106008027
[7]:                    https://promisesaplus.com/
[9]:                    https://wearereasonablepeople.nl/
[10]:                   https://dev.to/avaq/fluture-a-functional-alternative-to-promises-21b
