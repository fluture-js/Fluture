/**
 * Fluture bundled; version 12.2.1 (dirty)
 */

/// <reference types="https://cdn.jsdelivr.net/gh/fluture-js/Fluture@dist2/index.d.ts" />

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var sanctuaryTypeIdentifiers = createCommonjsModule(function (module) {
/*
        @@@@@@@            @@@@@@@         @@
      @@       @@        @@       @@      @@@
    @@   @@@ @@  @@    @@   @@@ @@  @@   @@@@@@ @@   @@@  @@ @@@      @@@@
   @@  @@   @@@   @@  @@  @@   @@@   @@   @@@   @@   @@@  @@@   @@  @@@   @@
   @@  @@   @@@   @@  @@  @@   @@@   @@   @@@   @@   @@@  @@@   @@  @@@@@@@@
   @@  @@   @@@  @@   @@  @@   @@@  @@    @@@   @@   @@@  @@@   @@  @@@
    @@   @@@ @@@@@     @@   @@@ @@@@@      @@@    @@@ @@  @@@@@@      @@@@@
      @@                 @@                           @@  @@
        @@@@@@@            @@@@@@@               @@@@@    @@
                                                          */
//. # sanctuary-type-identifiers
//.
//. A type is a set of values. Boolean, for example, is the type comprising
//. `true` and `false`. A value may be a member of multiple types (`42` is a
//. member of Number, PositiveNumber, Integer, and many other types).
//.
//. In certain situations it is useful to divide JavaScript values into
//. non-overlapping types. The language provides two constructs for this
//. purpose: the [`typeof`][1] operator and [`Object.prototype.toString`][2].
//. Each has pros and cons, but neither supports user-defined types.
//.
//. sanctuary-type-identifiers comprises:
//.
//.   - an npm and browser -compatible package for deriving the
//.     _type identifier_ of a JavaScript value; and
//.   - a specification which authors may follow to specify type
//.     identifiers for their types.
//.
//. ### Specification
//.
//. For a type to be compatible with the algorithm:
//.
//.   - every member of the type MUST have a `@@type` property
//.     (the _type identifier_); and
//.
//.   - the type identifier MUST be a string primitive and SHOULD have
//.     format `'<namespace>/<name>[@<version>]'`, where:
//.
//.       - `<namespace>` MUST consist of one or more characters, and
//.         SHOULD equal the name of the npm package which defines the
//.         type (including [scope][3] where appropriate);
//.
//.       - `<name>` MUST consist of one or more characters, and SHOULD
//.         be the unique name of the type; and
//.
//.       - `<version>` MUST consist of one or more digits, and SHOULD
//.         represent the version of the type.
//.
//. If the type identifier does not conform to the format specified above,
//. it is assumed that the entire string represents the _name_ of the type;
//. _namespace_ will be `null` and _version_ will be `0`.
//.
//. If the _version_ is not given, it is assumed to be `0`.

(function(f) {

  /* istanbul ignore else */
  {
    module.exports = f ();
  }

} (function() {

  //  $$type :: String
  var $$type = '@@type';

  //  pattern :: RegExp
  var pattern = new RegExp (
    '^'
  + '([\\s\\S]+)'   //  <namespace>
  + '/'             //  SOLIDUS (U+002F)
  + '([\\s\\S]+?)'  //  <name>
  + '(?:'           //  optional non-capturing group {
  +   '@'           //    COMMERCIAL AT (U+0040)
  +   '([0-9]+)'    //    <version>
  + ')?'            //  }
  + '$'
  );

  //. ### Usage
  //.
  //. ```javascript
  //. const type = require ('sanctuary-type-identifiers');
  //. ```
  //.
  //. ```javascript
  //. > const Identity$prototype = {
  //. .   '@@type': 'my-package/Identity@1',
  //. .   '@@show': function() {
  //. .     return 'Identity (' + show (this.value) + ')';
  //. .   }
  //. . }
  //.
  //. > const Identity = value =>
  //. .   Object.assign (Object.create (Identity$prototype), {value})
  //.
  //. > type (Identity (0))
  //. 'my-package/Identity@1'
  //.
  //. > type.parse (type (Identity (0)))
  //. {namespace: 'my-package', name: 'Identity', version: 1}
  //. ```
  //.
  //. ### API
  //.
  //# type :: Any -> String
  //.
  //. Takes any value and returns a string which identifies its type. If the
  //. value conforms to the [specification][4], the custom type identifier is
  //. returned.
  //.
  //. ```javascript
  //. > type (null)
  //. 'Null'
  //.
  //. > type (true)
  //. 'Boolean'
  //.
  //. > type (Identity (0))
  //. 'my-package/Identity@1'
  //. ```
  function type(x) {
    return x != null &&
           x.constructor != null &&
           x.constructor.prototype !== x &&
           typeof x[$$type] === 'string' ?
      x[$$type] :
      (Object.prototype.toString.call (x)).slice ('[object '.length,
                                                  -']'.length);
  }

  //# type.parse :: String -> { namespace :: Nullable String, name :: String, version :: Number }
  //.
  //. Takes any string and parses it according to the [specification][4],
  //. returning an object with `namespace`, `name`, and `version` fields.
  //.
  //. ```javascript
  //. > type.parse ('my-package/List@2')
  //. {namespace: 'my-package', name: 'List', version: 2}
  //.
  //. > type.parse ('nonsense!')
  //. {namespace: null, name: 'nonsense!', version: 0}
  //.
  //. > type.parse (type (Identity (0)))
  //. {namespace: 'my-package', name: 'Identity', version: 1}
  //. ```
  type.parse = function parse(s) {
    var namespace = null;
    var name = s;
    var version = 0;
    var groups = pattern.exec (s);
    if (groups != null) {
      namespace = groups[1];
      name = groups[2];
      if (groups[3] != null) version = Number (groups[3]);
    }
    return {namespace: namespace, name: name, version: version};
  };

  return type;

}));

//. [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
//. [2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
//. [3]: https://docs.npmjs.com/misc/scope
//. [4]: #specification
});

var FL = {
  alt: 'fantasy-land/alt',
  ap: 'fantasy-land/ap',
  bimap: 'fantasy-land/bimap',
  chain: 'fantasy-land/chain',
  chainRec: 'fantasy-land/chainRec',
  map: 'fantasy-land/map',
  of: 'fantasy-land/of',
  zero: 'fantasy-land/zero'
};

var ordinal = ['first', 'second', 'third', 'fourth', 'fifth'];

var namespace = 'fluture';
var name = 'Future';
var version = 5;

var $$type = namespace + '/' + name + '@' + version;

function List(head, tail){
  this.head = head;
  this.tail = tail;
}

List.prototype.toJSON = function(){
  return toArray(this);
};

var nil = new List(null, null);
nil.tail = nil;

function isNil(list){
  return list.tail === list;
}

// cons :: (a, List a) -> List a
//      -- O(1) append operation
function cons(head, tail){
  return new List(head, tail);
}

// reverse :: List a -> List a
//         -- O(n) list reversal
function reverse(xs){
  var ys = nil, tail = xs;
  while(!isNil(tail)){
    ys = cons(tail.head, ys);
    tail = tail.tail;
  }
  return ys;
}

// cat :: (List a, List a) -> List a
//     -- O(n) list concatenation
function cat(xs, ys){
  var zs = ys, tail = reverse(xs);
  while(!isNil(tail)){
    zs = cons(tail.head, zs);
    tail = tail.tail;
  }
  return zs;
}

// toArray :: List a -> Array a
//         -- O(n) list to Array
function toArray(xs){
  var tail = xs, arr = [];
  while(!isNil(tail)){
    arr.push(tail.head);
    tail = tail.tail;
  }
  return arr;
}

/* c8 ignore next */
var captureStackTrace = Error.captureStackTrace || captureStackTraceFallback;
var _debug = debugHandleNone;

function debugMode(debug){
  _debug = debug ? debugHandleAll : debugHandleNone;
}

function debugHandleNone(x){
  return x;
}

function debugHandleAll(x, fn, a, b, c){
  return fn(a, b, c);
}

function debug(x, fn, a, b, c){
  return _debug(x, fn, a, b, c);
}

function captureContext(previous, tag, fn){
  return debug(previous, debugCaptureContext, previous, tag, fn);
}

function debugCaptureContext(previous, tag, fn){
  var context = {tag: tag, name: ' from ' + tag + ':'};
  captureStackTrace(context, fn);
  return cons(context, previous);
}

function captureApplicationContext(context, n, f){
  return debug(context, debugCaptureApplicationContext, context, n, f);
}

function debugCaptureApplicationContext(context, n, f){
  return debugCaptureContext(context, ordinal[n - 1] + ' application of ' + f.name, f);
}

function captureStackTraceFallback(x){
  var e = new Error;
  if(typeof e.stack === 'string'){
    x.stack = x.name + '\n' + e.stack.split('\n').slice(1).join('\n');
  /* c8 ignore next 3 */
  }else {
    x.stack = x.name;
  }
}

var sanctuaryShow = createCommonjsModule(function (module) {
//. # sanctuary-show
//.
//. Haskell has a `show` function which can be applied to a compatible value to
//. produce a descriptive string representation of that value. The idea is that
//. the string representation should, if possible, be an expression which would
//. produce the original value if evaluated.
//.
//. This library provides a similar [`show`](#show) function.
//.
//. In general, this property should hold: `eval (show (x)) = x`. In some cases
//. parens are necessary to ensure correct interpretation (`{}`, for example,
//. is an empty block rather than an empty object in some contexts). Thus the
//. property is more accurately stated `eval ('(' + show (x) + ')') = x`.
//.
//. One can make values of a custom type compatible with [`show`](#show) by
//. defining a `@@show` method. For example:
//.
//. ```javascript
//. //# Maybe#@@show :: Maybe a ~> () -> String
//. //.
//. //. ```javascript
//. //. > show (Nothing)
//. //. 'Nothing'
//. //.
//. //. > show (Just (['foo', 'bar', 'baz']))
//. //. 'Just (["foo", "bar", "baz"])'
//. //. ```
//. Maybe.prototype['@@show'] = function() {
//.   return this.isNothing ? 'Nothing' : 'Just (' + show (this.value) + ')';
//. };
//. ```

(function(f) {

  /* istanbul ignore else */
  {
    module.exports = f ();
  }

} (function() {

  //  $$show :: String
  var $$show = '@@show';

  //  seen :: Array Any
  var seen = [];

  //  entry :: Object -> String -> String
  function entry(o) {
    return function(k) {
      return show (k) + ': ' + show (o[k]);
    };
  }

  //  sortedKeys :: Object -> Array String
  function sortedKeys(o) {
    return (Object.keys (o)).sort ();
  }

  //# show :: Showable a => a -> String
  //.
  //. Returns a useful string representation of the given value.
  //.
  //. Dispatches to the value's `@@show` method if present.
  //.
  //. Where practical, `show (eval ('(' + show (x) + ')')) = show (x)`.
  //.
  //. ```javascript
  //. > show (null)
  //. 'null'
  //.
  //. > show (undefined)
  //. 'undefined'
  //.
  //. > show (true)
  //. 'true'
  //.
  //. > show (new Boolean (false))
  //. 'new Boolean (false)'
  //.
  //. > show (-0)
  //. '-0'
  //.
  //. > show (NaN)
  //. 'NaN'
  //.
  //. > show (new Number (Infinity))
  //. 'new Number (Infinity)'
  //.
  //. > show ('foo\n"bar"\nbaz\n')
  //. '"foo\\n\\"bar\\"\\nbaz\\n"'
  //.
  //. > show (new String (''))
  //. 'new String ("")'
  //.
  //. > show (['foo', 'bar', 'baz'])
  //. '["foo", "bar", "baz"]'
  //.
  //. > show ([[[[[0]]]]])
  //. '[[[[[0]]]]]'
  //.
  //. > show ({x: [1, 2], y: [3, 4], z: [5, 6]})
  //. '{"x": [1, 2], "y": [3, 4], "z": [5, 6]}'
  //. ```
  function show(x) {
    if (seen.indexOf (x) >= 0) return '<Circular>';

    switch (Object.prototype.toString.call (x)) {

      case '[object Boolean]':
        return typeof x === 'object' ?
          'new Boolean (' + show (x.valueOf ()) + ')' :
          x.toString ();

      case '[object Number]':
        return typeof x === 'object' ?
          'new Number (' + show (x.valueOf ()) + ')' :
          1 / x === -Infinity ? '-0' : x.toString (10);

      case '[object String]':
        return typeof x === 'object' ?
          'new String (' + show (x.valueOf ()) + ')' :
          JSON.stringify (x);

      case '[object Date]':
        return 'new Date (' +
               show (isNaN (x.valueOf ()) ? NaN : x.toISOString ()) +
               ')';

      case '[object Error]':
        return 'new ' + x.name + ' (' + show (x.message) + ')';

      case '[object Arguments]':
        return 'function () { return arguments; } (' +
               (Array.prototype.map.call (x, show)).join (', ') +
               ')';

      case '[object Array]':
        seen.push (x);
        try {
          return '[' + ((x.map (show)).concat (
            sortedKeys (x)
            .filter (function(k) { return !(/^\d+$/.test (k)); })
            .map (entry (x))
          )).join (', ') + ']';
        } finally {
          seen.pop ();
        }

      case '[object Object]':
        seen.push (x);
        try {
          return (
            $$show in x &&
            (x.constructor == null || x.constructor.prototype !== x) ?
              x[$$show] () :
              '{' + ((sortedKeys (x)).map (entry (x))).join (', ') + '}'
          );
        } finally {
          seen.pop ();
        }

      case '[object Set]':
        seen.push (x);
        try {
          return 'new Set (' + show (Array.from (x.values ())) + ')';
        } finally {
          seen.pop ();
        }

      case '[object Map]':
        seen.push (x);
        try {
          return 'new Map (' + show (Array.from (x.entries ())) + ')';
        } finally {
          seen.pop ();
        }

      default:
        return String (x);

    }
  }

  return show;

}));
});

/* c8 ignore next */
var setImmediate = typeof setImmediate === 'undefined' ? setImmediateFallback : setImmediate;

function noop(){}
function moop(){ return this }
function call(f, x){ return f(x) }

function setImmediateFallback(f, x){
  return setTimeout(f, 0, x);
}

function raise(x){
  setImmediate(function rethrowErrorDelayedToEscapePromiseCatch(){
    throw x;
  });
}

function showArg(x){
  return sanctuaryShow(x) + ' :: ' + sanctuaryTypeIdentifiers.parse(sanctuaryTypeIdentifiers(x)).name;
}

function error(message){
  return new Error(message);
}

function typeError(message){
  return new TypeError(message);
}

function invalidArgument(it, at, expected, actual){
  return typeError(
    it + '() expects its ' + ordinal[at] + ' argument to ' + expected + '.' +
    '\n  Actual: ' + showArg(actual)
  );
}

function invalidArgumentOf(expected){
  return function(it, at, actual){
    return invalidArgument(it, at, expected, actual);
  };
}

function invalidArity(f, args){
  return new TypeError(
    f.name + '() expects to be called with a single argument per invocation\n' +
    '  Saw: ' + args.length + ' arguments' +
    Array.prototype.slice.call(args).map(function(arg, i){
      return '\n  ' + (
        ordinal[i] ?
        ordinal[i].charAt(0).toUpperCase() + ordinal[i].slice(1) :
        'Argument ' + String(i + 1)
      ) + ': ' + showArg(arg);
    }).join('')
  );
}

function invalidNamespace(m, x){
  return (
    'The Future was not created by ' + namespace + '. '
  + 'Make sure you transform other Futures to ' + namespace + ' Futures. '
  + 'Got ' + (x ? ('a Future from ' + x) : 'an unscoped Future') + '.'
  + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
  );
}

function invalidVersion(m, x){
  return (
    'The Future was created by ' + (x < version ? 'an older' : 'a newer')
  + ' version of ' + namespace + '. '
  + 'This means that one of the sources which creates Futures is outdated. '
  + 'Update this source, or transform its created Futures to be compatible.'
  + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
  );
}

function invalidFuture(desc, m, s){
  var id = sanctuaryTypeIdentifiers.parse(sanctuaryTypeIdentifiers(m));
  var info = id.name === name ? '\n' + (
    id.namespace !== namespace ? invalidNamespace(m, id.namespace)
  : id.version !== version ? invalidVersion(m, id.version)
  : 'Nothing seems wrong. Contact the Fluture maintainers.') : '';
  return typeError(
    desc + ' to be a valid Future.' + info + '\n' +
    '  Actual: ' + sanctuaryShow(m) + ' :: ' + id.name + (s || '')
  );
}

function invalidFutureArgument(it, at, m, s){
  return invalidFuture(it + '() expects its ' + ordinal[at] + ' argument', m, s);
}

function ensureError(value, fn){
  var message;
  try{
    if(value instanceof Error) return value;
    message = 'A Non-Error was thrown from a Future: ' + sanctuaryShow(value);
  }catch (_){
    message = 'Something was thrown from a Future, but it could not be converted to String';
  }
  var e = error(message);
  captureStackTrace(e, fn);
  return e;
}

function assignUnenumerable(o, prop, value){
  Object.defineProperty(o, prop, {value: value, writable: true, configurable: true});
}

function wrapException(caught, callingFuture){
  var origin = ensureError(caught, wrapException);
  var context = cat(origin.context || nil, callingFuture.context);
  var e = error(origin.message);
  assignUnenumerable(e, 'future', origin.future || callingFuture);
  assignUnenumerable(e, 'reason', origin.reason || origin);
  assignUnenumerable(e, 'stack', e.reason.stack);
  return withExtraContext(e, context);
}

function withExtraContext(e, context){
  assignUnenumerable(e, 'context', context);
  assignUnenumerable(e, 'stack', e.stack + contextToStackTrace(context));
  return e;
}

function contextToStackTrace(context){
  var stack = '', tail = context;
  while(tail !== nil){
    stack = stack + '\n' + tail.head.stack;
    tail = tail.tail;
  }
  return stack;
}

function isFunction(f){
  return typeof f === 'function';
}

function isThenable(m){
  return m instanceof Promise || m != null && isFunction(m.then);
}

function isBoolean(f){
  return typeof f === 'boolean';
}

function isNumber(f){
  return typeof f === 'number';
}

function isUnsigned(n){
  return (n === Infinity || isNumber(n) && n > 0 && n % 1 === 0);
}

function isObject(o){
  return o !== null && typeof o === 'object';
}

function isIterator(i){
  return isObject(i) && isFunction(i.next);
}

function isArray(x){
  return Array.isArray(x);
}

function hasMethod(method, x){
  return x != null && isFunction(x[method]);
}

function isFunctor(x){
  return hasMethod(FL.map, x);
}

function isAlt(x){
  return isFunctor(x) && hasMethod(FL.alt, x);
}

function isApply(x){
  return isFunctor(x) && hasMethod(FL.ap, x);
}

function isBifunctor(x){
  return isFunctor(x) && hasMethod(FL.bimap, x);
}

function isChain(x){
  return isApply(x) && hasMethod(FL.chain, x);
}

function Next(x){
  return {done: false, value: x};
}

function Done(x){
  return {done: true, value: x};
}

function isIteration(x){
  return isObject(x) && isBoolean(x.done);
}

/*eslint no-cond-assign:0, no-constant-condition:0 */

function alwaysTrue(){
  return true;
}

function getArgs(it){
  var args = new Array(it.arity);
  for(var i = 1; i <= it.arity; i++){
    args[i - 1] = it['$' + String(i)];
  }
  return args;
}

function showArg$1(arg){
  return ' (' + sanctuaryShow(arg) + ')';
}

var any = {pred: alwaysTrue, error: invalidArgumentOf('be anything')};
var func = {pred: isFunction, error: invalidArgumentOf('be a Function')};
var future = {pred: isFuture, error: invalidFutureArgument};
var positiveInteger = {pred: isUnsigned, error: invalidArgumentOf('be a positive Integer')};

function application(n, f, type, args, prev){
  if(args.length < 2 && type.pred(args[0])) return captureApplicationContext(prev, n, f);
  var e = args.length > 1 ? invalidArity(f, args) : type.error(f.name, n - 1, args[0]);
  captureStackTrace(e, f);
  throw withExtraContext(e, prev);
}

function application1(f, type, args){
  return application(1, f, type, args, nil);
}

function Future(computation){
  var context = application1(Future, func, arguments);
  return new Computation(context, computation);
}

function isFuture(x){
  return x instanceof Future || sanctuaryTypeIdentifiers(x) === $$type;
}

// Compliance with sanctuary-type-identifiers versions 1 and 2.
// To prevent sanctuary-type-identifiers version 3 from identifying 'Future'
// as being of the type denoted by $$type, we ensure that
// Future.constructor.prototype is equal to Future.
Future['@@type'] = $$type;
Future.constructor = {prototype: Future};

Future[FL.of] = resolve;
Future[FL.chainRec] = chainRec;

Future.prototype['@@type'] = $$type;

Future.prototype['@@show'] = function Future$show(){
  return this.toString();
};

Future.prototype.pipe = function Future$pipe(f){
  if(!isFunction(f)) throw invalidArgument('Future#pipe', 0, 'be a Function', f);
  return f(this);
};

Future.prototype[FL.ap] = function Future$FL$ap(other){
  var context = captureContext(nil, 'a Fantasy Land dispatch to ap', Future$FL$ap);
  return other._transform(new ApTransformation(context, this));
};

Future.prototype[FL.map] = function Future$FL$map(mapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to map', Future$FL$map);
  return this._transform(new MapTransformation(context, mapper));
};

Future.prototype[FL.bimap] = function Future$FL$bimap(lmapper, rmapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to bimap', Future$FL$bimap);
  return this._transform(new BimapTransformation(context, lmapper, rmapper));
};

Future.prototype[FL.chain] = function Future$FL$chain(mapper){
  var context = captureContext(nil, 'a Fantasy Land dispatch to chain', Future$FL$chain);
  return this._transform(new ChainTransformation(context, mapper));
};

Future.prototype[FL.alt] = function Future$FL$alt(other){
  var context = captureContext(nil, 'a Fantasy Land dispatch to alt', Future$FL$alt);
  return this._transform(new AltTransformation(context, other));
};

Future.prototype.extractLeft = function Future$extractLeft(){
  return [];
};

Future.prototype.extractRight = function Future$extractRight(){
  return [];
};

Future.prototype._transform = function Future$transform(transformation){
  return new Transformer(transformation.context, this, cons(transformation, nil));
};

Future.prototype.isTransformer = false;
Future.prototype.context = nil;
Future.prototype.arity = 0;
Future.prototype.name = 'future';

Future.prototype.toString = function Future$toString(){
  return this.name + getArgs(this).map(showArg$1).join('');
};

Future.prototype.toJSON = function Future$toJSON(){
  return {$: $$type, kind: 'interpreter', type: this.name, args: getArgs(this)};
};

function createInterpreter(arity, name, interpret){
  var Interpreter = function(context, $1, $2, $3){
    this.context = context;
    this.$1 = $1;
    this.$2 = $2;
    this.$3 = $3;
  };

  Interpreter.prototype = Object.create(Future.prototype);
  Interpreter.prototype.arity = arity;
  Interpreter.prototype.name = name;
  Interpreter.prototype._interpret = interpret;

  return Interpreter;
}

var Computation =
createInterpreter(1, 'Future', function Computation$interpret(rec, rej, res){
  var computation = this.$1, open = false, cancel = noop, cont = function(){ open = true; };
  try{
    cancel = computation(function Computation$rej(x){
      cont = function Computation$rej$cont(){
        open = false;
        rej(x);
      };
      if(open){
        cont();
      }
    }, function Computation$res(x){
      cont = function Computation$res$cont(){
        open = false;
        res(x);
      };
      if(open){
        cont();
      }
    });
  }catch(e){
    rec(wrapException(e, this));
    return noop;
  }
  if(!(isFunction(cancel) && cancel.length === 0)){
    rec(wrapException(typeError(
      'The computation was expected to return a nullary cancellation function\n' +
      '  Actual: ' + sanctuaryShow(cancel)
    ), this));
    return noop;
  }
  cont();
  return function Computation$cancel(){
    if(open){
      open = false;
      cancel && cancel();
    }
  };
});

var Never = createInterpreter(0, 'never', function Never$interpret(){
  return noop;
});

Never.prototype._isNever = true;

var never = new Never(nil);

function isNever(x){
  return isFuture(x) && x._isNever === true;
}

var Crash = createInterpreter(1, 'crash', function Crash$interpret(rec){
  rec(this.$1);
  return noop;
});

function crash(x){
  return new Crash(application1(crash, any, arguments), x);
}

var Reject = createInterpreter(1, 'reject', function Reject$interpret(rec, rej){
  rej(this.$1);
  return noop;
});

Reject.prototype.extractLeft = function Reject$extractLeft(){
  return [this.$1];
};

function reject(x){
  return new Reject(application1(reject, any, arguments), x);
}

var Resolve = createInterpreter(1, 'resolve', function Resolve$interpret(rec, rej, res){
  res(this.$1);
  return noop;
});

Resolve.prototype.extractRight = function Resolve$extractRight(){
  return [this.$1];
};

function resolve(x){
  return new Resolve(application1(resolve, any, arguments), x);
}

//Note: This function is not curried because it's only used to satisfy the
//      Fantasy Land ChainRec specification.
function chainRec(step, init){
  return resolve(Next(init))._transform(new ChainTransformation(nil, function chainRec$recur(o){
    return o.done ?
           resolve(o.value) :
           step(Next, Done, o.value)._transform(new ChainTransformation(nil, chainRec$recur));
  }));
}

var Transformer =
createInterpreter(2, 'transform', function Transformer$interpret(rec, rej, res){

  //These are the cold, and hot, transformation stacks. The cold actions are those that
  //have yet to run parallel computations, and hot are those that have.
  var cold = nil, hot = nil;

  //These combined variables define our current state.
  // future         = the future we are currently forking
  // transformation = the transformation to be informed when the future settles
  // cancel         = the cancel function of the current future
  // settled        = a boolean indicating whether a new tick should start
  // async          = a boolean indicating whether we are awaiting a result asynchronously
  var future, transformation, cancel = noop, settled, async = true, it;

  //Takes a transformation from the top of the hot stack and returns it.
  function nextHot(){
    var x = hot.head;
    hot = hot.tail;
    return x;
  }

  //Takes a transformation from the top of the cold stack and returns it.
  function nextCold(){
    var x = cold.head;
    cold = cold.tail;
    return x;
  }

  //This function is called with a future to use in the next tick.
  //Here we "flatten" the actions of another Sequence into our own actions,
  //this is the magic that allows for infinitely stack safe recursion because
  //actions like ChainAction will return a new Sequence.
  //If we settled asynchronously, we call drain() directly to run the next tick.
  function settle(m){
    settled = true;
    future = m;
    if(future.isTransformer){
      var tail = future.$2;
      while(!isNil(tail)){
        cold = cons(tail.head, cold);
        tail = tail.tail;
      }
      future = future.$1;
    }
    if(async) drain();
  }

  //This function serves as a rejection handler for our current future.
  //It will tell the current transformation that the future rejected, and it will
  //settle the current tick with the transformation's answer to that.
  function rejected(x){
    settle(transformation.rejected(x));
  }

  //This function serves as a resolution handler for our current future.
  //It will tell the current transformation that the future resolved, and it will
  //settle the current tick with the transformation's answer to that.
  function resolved(x){
    settle(transformation.resolved(x));
  }

  //This function is passed into actions when they are "warmed up".
  //If the transformation decides that it has its result, without the need to await
  //anything else, then it can call this function to force "early termination".
  //When early termination occurs, all actions which were stacked prior to the
  //terminator will be skipped. If they were already hot, they will also be
  //sent a cancel signal so they can cancel their own concurrent computations,
  //as their results are no longer needed.
  function early(m, terminator){
    cancel();
    cold = nil;
    if(async && transformation !== terminator){
      transformation.cancel();
      while((it = nextHot()) && it !== terminator) it.cancel();
    }
    settle(m);
  }

  //This will cancel the current Future, the current transformation, and all stacked hot actions.
  function Sequence$cancel(){
    cancel();
    transformation && transformation.cancel();
    while(it = nextHot()) it.cancel();
  }

  //This function is called when an exception is caught.
  function exception(e){
    Sequence$cancel();
    settled = true;
    cold = hot = nil;
    var error = wrapException(e, future);
    future = never;
    rec(error);
  }

  //This function serves to kickstart concurrent computations.
  //Takes all actions from the cold stack in reverse order, and calls run() on
  //each of them, passing them the "early" function. If any of them settles (by
  //calling early()), we abort. After warming up all actions in the cold queue,
  //we warm up the current transformation as well.
  function warmupActions(){
    cold = reverse(cold);
    while(cold !== nil){
      it = cold.head.run(early);
      if(settled) return;
      hot = cons(it, hot);
      cold = cold.tail;
    }
    transformation = transformation.run(early);
  }

  //This function represents our main execution loop. By "tick", we've been
  //referring to the execution of one iteration in the while-loop below.
  function drain(){
    async = false;
    while(true){
      settled = false;
      if(transformation = nextCold()){
        cancel = future._interpret(exception, rejected, resolved);
        if(!settled) warmupActions();
      }else if(transformation = nextHot()){
        cancel = future._interpret(exception, rejected, resolved);
      }else break;
      if(settled) continue;
      async = true;
      return;
    }
    cancel = future._interpret(exception, rej, res);
  }

  //Start the execution loop.
  settle(this);

  //Return the cancellation function.
  return Sequence$cancel;

});

Transformer.prototype.isTransformer = true;

Transformer.prototype._transform = function Transformer$_transform(transformation){
  return new Transformer(transformation.context, this.$1, cons(transformation, this.$2));
};

Transformer.prototype.toString = function Transformer$toString(){
  return toArray(reverse(this.$2)).reduce(function(str, action){
    return action.name + getArgs(action).map(showArg$1).join('') + ' (' + str + ')';
  }, this.$1.toString());
};

function BaseTransformation$rejected(x){
  this.cancel();
  return new Reject(this.context, x);
}

function BaseTransformation$resolved(x){
  this.cancel();
  return new Resolve(this.context, x);
}

function BaseTransformation$toJSON(){
  return {$: $$type, kind: 'transformation', type: this.name, args: getArgs(this)};
}

var BaseTransformation = {
  rejected: BaseTransformation$rejected,
  resolved: BaseTransformation$resolved,
  run: moop,
  cancel: noop,
  context: nil,
  arity: 0,
  name: 'transform',
  toJSON: BaseTransformation$toJSON
};

function wrapHandler(handler){
  return function transformationHandler(x){
    var m;
    try{
      m = handler.call(this, x);
    }catch(e){
      return new Crash(this.context, e);
    }
    if(isFuture(m)){
      return m;
    }
    return new Crash(this.context, invalidFuture(
      this.name + ' expects the return value from the function it\'s given', m,
      '\n  When called with: ' + sanctuaryShow(x)
    ));
  };
}

function createTransformation(arity, name, prototype){
  var Transformation = function(context, $1, $2){
    this.context = context;
    this.$1 = $1;
    this.$2 = $2;
  };

  Transformation.prototype = Object.create(BaseTransformation);
  Transformation.prototype.arity = arity;
  Transformation.prototype.name = name;

  if(typeof prototype.rejected === 'function'){
    Transformation.prototype.rejected = wrapHandler(prototype.rejected);
  }

  if(typeof prototype.resolved === 'function'){
    Transformation.prototype.resolved = wrapHandler(prototype.resolved);
  }

  if(typeof prototype.run === 'function'){
    Transformation.prototype.run = prototype.run;
  }

  return Transformation;
}

var ApTransformation = createTransformation(1, 'ap', {
  resolved: function ApTransformation$resolved(f){
    if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
    throw typeError(
      'ap expects the second Future to resolve to a Function\n' +
      '  Actual: ' + sanctuaryShow(f)
    );
  }
});

var AltTransformation = createTransformation(1, 'alt', {
  rejected: function AltTransformation$rejected(){ return this.$1 }
});

var MapTransformation = createTransformation(1, 'map', {
  resolved: function MapTransformation$resolved(x){
    return new Resolve(this.context, call(this.$1, x));
  }
});

var BimapTransformation = createTransformation(2, 'bimap', {
  rejected: function BimapTransformation$rejected(x){
    return new Reject(this.context, call(this.$1, x));
  },
  resolved: function BimapTransformation$resolved(x){
    return new Resolve(this.context, call(this.$2, x));
  }
});

var ChainTransformation = createTransformation(1, 'chain', {
  resolved: function ChainTransformation$resolved(x){ return call(this.$1, x) }
});

var After = createInterpreter(2, 'after', function After$interpret(rec, rej, res){
  var id = setTimeout(res, this.$1, this.$2);
  return function After$cancel(){ clearTimeout(id); };
});

After.prototype.extractRight = function After$extractRight(){
  return [this.$2];
};

function alwaysNever(_){
  return never;
}

function after(time){
  var context1 = application1(after, positiveInteger, arguments);
  return time === Infinity ? alwaysNever : (function after(value){
    var context2 = application(2, after, any, arguments, context1);
    return new After(context2, time, value);
  });
}

var alternative = {pred: isAlt, error: invalidArgumentOf('have Alt implemented')};

function alt(left){
  if(isFuture(left)){
    var context1 = application1(alt, future, arguments);
    return function alt(right){
      var context2 = application(2, alt, future, arguments, context1);
      return right._transform(new AltTransformation(context2, left));
    };
  }

  var context = application1(alt, alternative, arguments);
  return function alt(right){
    application(2, alt, alternative, arguments, context);
    return left[FL.alt](right);
  };
}

var AndTransformation = createTransformation(1, 'and', {
  resolved: function AndTransformation$resolved(){ return this.$1 }
});

function and(left){
  var context1 = application1(and, future, arguments);
  return function and(right){
    var context2 = application(2, and, future, arguments, context1);
    return right._transform(new AndTransformation(context2, left));
  };
}

var apply = {pred: isApply, error: invalidArgumentOf('have Apply implemented')};

function ap(mx){
  if(isFuture(mx)){
    var context1 = application1(ap, future, arguments);
    return function ap(mf){
      var context2 = application(2, ap, future, arguments, context1);
      return mf._transform(new ApTransformation(context2, mx));
    };
  }

  var context = application1(ap, apply, arguments);
  return function ap(mf){
    application(2, ap, apply, arguments, context);
    return mx[FL.ap](mf);
  };
}

function invalidPromise(p, f, a){
  return typeError(
    'encaseP() expects the function it\'s given to return a Promise/Thenable'
    + '\n  Actual: ' + sanctuaryShow(p) + '\n  From calling: ' + sanctuaryShow(f)
    + '\n  With: ' + sanctuaryShow(a)
  );
}

var EncaseP = createInterpreter(2, 'encaseP', function EncaseP$interpret(rec, rej, res){
  var open = true, fn = this.$1, arg = this.$2, p;
  try{
    p = fn(arg);
  }catch(e){
    rec(wrapException(e, this));
    return noop;
  }
  if(!isThenable(p)){
    rec(wrapException(invalidPromise(p, fn, arg), this));
    return noop;
  }
  p.then(function EncaseP$res(x){
    if(open){
      open = false;
      res(x);
    }
  }, function EncaseP$rej(x){
    if(open){
      open = false;
      rej(x);
    }
  });
  return function EncaseP$cancel(){ open = false; };
});

function encaseP(f){
  var context1 = application1(encaseP, func, arguments);
  return function encaseP(x){
    var context2 = application(2, encaseP, any, arguments, context1);
    return new EncaseP(context2, f, x);
  };
}

function attemptP(_){
  return encaseP.apply(this, arguments)(undefined);
}

var Encase = createInterpreter(2, 'encase', function Encase$interpret(rec, rej, res){
  var fn = this.$1, r;
  try{ r = fn(this.$2); }catch(e){ rej(e); return noop }
  res(r);
  return noop;
});

function encase(f){
  var context1 = application1(encase, func, arguments);
  return function encase(x){
    var context2 = application(2, encase, any, arguments, context1);
    return new Encase(context2, f, x);
  };
}

function attempt(_){
  return encase.apply(this, arguments)(undefined);
}

var bifunctor = {pred: isBifunctor, error: invalidArgumentOf('have Bifunctor implemented')};

function bimap(f){
  var context1 = application1(bimap, func, arguments);
  return function bimap(g){
    var context2 = application(2, bimap, func, arguments, context1);
    return function bimap(m){
      var context3 = application(3, bimap, bifunctor, arguments, context2);
      return isFuture(m) ?
             m._transform(new BimapTransformation(context3, f, g)) :
             m[FL.bimap](f, g);
    };
  };
}

var BichainTransformation = createTransformation(2, 'bichain', {
  rejected: function BichainTransformation$rejected(x){ return call(this.$1, x) },
  resolved: function BichainTransformation$resolved(x){ return call(this.$2, x) }
});

function bichain(f){
  var context1 = application1(bichain, func, arguments);
  return function bichain(g){
    var context2 = application(2, bichain, func, arguments, context1);
    return function bichain(m){
      var context3 = application(3, bichain, future, arguments, context2);
      return m._transform(new BichainTransformation(context3, f, g));
    };
  };
}

function Eager(future){
  var _this = this;
  _this.rec = noop;
  _this.rej = noop;
  _this.res = noop;
  _this.crashed = false;
  _this.rejected = false;
  _this.resolved = false;
  _this.value = null;
  _this.cancel = future._interpret(function Eager$crash(x){
    _this.value = x;
    _this.crashed = true;
    _this.cancel = noop;
    _this.rec(x);
  }, function Eager$reject(x){
    _this.value = x;
    _this.rejected = true;
    _this.cancel = noop;
    _this.rej(x);
  }, function Eager$resolve(x){
    _this.value = x;
    _this.resolved = true;
    _this.cancel = noop;
    _this.res(x);
  });
}

Eager.prototype = Object.create(Future.prototype);

Eager.prototype._interpret = function Eager$interpret(rec, rej, res){
  if(this.crashed) rec(this.value);
  else if(this.rejected) rej(this.value);
  else if(this.resolved) res(this.value);
  else {
    this.rec = rec;
    this.rej = rej;
    this.res = res;
  }
  return this.cancel;
};

function earlyCrash(early, x){
  early(crash(x));
}

function earlyReject(early, x){
  early(reject(x));
}

function earlyResolve(early, x){
  early(resolve(x));
}

function createParallelTransformation(name, rec, rej, res, prototype){
  var ParallelTransformation = createTransformation(1, name, Object.assign({
    run: function Parallel$run(early){
      var eager = new Eager(this.$1);
      var transformation = new ParallelTransformation(this.context, eager);
      function Parallel$early(m){ early(m, transformation); }
      transformation.cancel = eager._interpret(
        function Parallel$rec(x){ rec(Parallel$early, x); },
        function Parallel$rej(x){ rej(Parallel$early, x); },
        function Parallel$res(x){ res(Parallel$early, x); }
      );
      return transformation;
    }
  }, prototype));
  return ParallelTransformation;
}

var PairTransformation = createTransformation(1, 'pair', {
  resolved: function PairTransformation$resolved(x){
    return new Resolve(this.context, [x, this.$1]);
  }
});

var BothTransformation =
createParallelTransformation('both', earlyCrash, earlyReject, noop, {
  resolved: function BothTransformation$resolved(x){
    return this.$1._transform(new PairTransformation(this.context, x));
  }
});

function both(left){
  var context1 = application1(both, future, arguments);
  return function both(right){
    var context2 = application(2, both, future, arguments, context1);
    return right._transform(new BothTransformation(context2, left));
  };
}

var Cold = 0;
var Pending = 1;
var Crashed = 2;
var Rejected = 3;
var Resolved = 4;

function Queued(rec, rej, res){
  this[Crashed] = rec;
  this[Rejected] = rej;
  this[Resolved] = res;
}

var Cache = createInterpreter(1, 'cache', function Cache$interpret(rec, rej, res){
  var cancel = noop;

  switch(this._state){
    /* c8 ignore next 4 */
    case Pending: cancel = this._addToQueue(rec, rej, res); break;
    case Crashed: rec(this._value); break;
    case Rejected: rej(this._value); break;
    case Resolved: res(this._value); break;
    default:
      this._queue = [];
      cancel = this._addToQueue(rec, rej, res);
      this.run();
  }

  return cancel;
});

Cache.prototype._cancel = noop;
Cache.prototype._queue = null;
Cache.prototype._queued = 0;
Cache.prototype._value = undefined;
Cache.prototype._state = Cold;

Cache.prototype.extractLeft = function Cache$extractLeft(){
  return this._state === Rejected ? [this._value] : [];
};

Cache.prototype.extractRight = function Cache$extractRight(){
  return this._state === Resolved ? [this._value] : [];
};

Cache.prototype._addToQueue = function Cache$addToQueue(rec, rej, res){
  var _this = this;
  if(_this._state > Pending) return noop;
  var i = _this._queue.push(new Queued(rec, rej, res)) - 1;
  _this._queued = _this._queued + 1;

  return function Cache$removeFromQueue(){
    if(_this._state > Pending) return;
    _this._queue[i] = undefined;
    _this._queued = _this._queued - 1;
    if(_this._queued === 0) _this.reset();
  };
};

Cache.prototype._drainQueue = function Cache$drainQueue(){
  if(this._state <= Pending) return;
  if(this._queued === 0) return;
  var queue = this._queue;
  var length = queue.length;
  var state = this._state;
  var value = this._value;

  for(var i = 0; i < length; i++){
    queue[i] && queue[i][state](value);
    queue[i] = undefined;
  }

  this._queue = undefined;
  this._queued = 0;
};

Cache.prototype.crash = function Cache$crash(error){
  if(this._state > Pending) return;
  this._value = error;
  this._state = Crashed;
  this._drainQueue();
};

Cache.prototype.reject = function Cache$reject(reason){
  if(this._state > Pending) return;
  this._value = reason;
  this._state = Rejected;
  this._drainQueue();
};

Cache.prototype.resolve = function Cache$resolve(value){
  if(this._state > Pending) return;
  this._value = value;
  this._state = Resolved;
  this._drainQueue();
};

Cache.prototype.run = function Cache$run(){
  var _this = this;
  if(_this._state > Cold) return;
  _this._state = Pending;
  _this._cancel = _this.$1._interpret(
    function Cache$fork$rec(x){ _this.crash(x); },
    function Cache$fork$rej(x){ _this.reject(x); },
    function Cache$fork$res(x){ _this.resolve(x); }
  );
};

Cache.prototype.reset = function Cache$reset(){
  if(this._state === Cold) return;
  if(this._state === Pending) this._cancel();
  this._cancel = noop;
  this._queue = [];
  this._queued = 0;
  this._value = undefined;
  this._state = Cold;
};

function cache(m){
  return new Cache(application1(cache, future, arguments), m);
}

var ChainRejTransformation = createTransformation(1, 'chainRej', {
  rejected: function ChainRejTransformation$rejected(x){ return call(this.$1, x) }
});

function chainRej(f){
  var context1 = application1(chainRej, func, arguments);
  return function chainRej(m){
    var context2 = application(2, chainRej, future, arguments, context1);
    return m._transform(new ChainRejTransformation(context2, f));
  };
}

var monad = {pred: isChain, error: invalidArgumentOf('have Chain implemented')};

function chain(f){
  var context1 = application1(chain, func, arguments);
  return function chain(m){
    var context2 = application(2, chain, monad, arguments, context1);
    return isFuture(m) ?
           m._transform(new ChainTransformation(context2, f)) :
           m[FL.chain](f);
  };
}

function done(callback){
  var context1 = application1(done, func, arguments);
  function done$res(x){
    callback(null, x);
  }
  return function done(m){
    application(2, done, future, arguments, context1);
    return m._interpret(raise, callback, done$res);
  };
}

function extractLeft(m){
  application1(extractLeft, future, arguments);
  return m.extractLeft();
}

function extractRight(m){
  application1(extractRight, future, arguments);
  return m.extractRight();
}

var CoalesceTransformation = createTransformation(2, 'coalesce', {
  rejected: function CoalesceTransformation$rejected(x){
    return new Resolve(this.context, call(this.$1, x));
  },
  resolved: function CoalesceTransformation$resolved(x){
    return new Resolve(this.context, call(this.$2, x));
  }
});

function coalesce(f){
  var context1 = application1(coalesce, func, arguments);
  return function coalesce(g){
    var context2 = application(2, coalesce, func, arguments, context1);
    return function coalesce(m){
      var context3 = application(3, coalesce, future, arguments, context2);
      return m._transform(new CoalesceTransformation(context3, f, g));
    };
  };
}

function forkCatch(f){
  var context1 = application1(forkCatch, func, arguments);
  return function forkCatch(g){
    var context2 = application(2, forkCatch, func, arguments, context1);
    return function forkCatch(h){
      var context3 = application(3, forkCatch, func, arguments, context2);
      return function forkCatch(m){
        application(4, forkCatch, future, arguments, context3);
        return m._interpret(f, g, h);
      };
    };
  };
}

function fork(f){
  var context1 = application1(fork, func, arguments);
  return function fork(g){
    var context2 = application(2, fork, func, arguments, context1);
    return function fork(m){
      application(3, fork, future, arguments, context2);
      return m._interpret(raise, f, g);
    };
  };
}

var Undetermined = 0;
var Synchronous = 1;
var Asynchronous = 2;

/*eslint consistent-return: 0 */

function invalidIteration(o){
  return typeError(
    'The iterator did not return a valid iteration from iterator.next()\n' +
    '  Actual: ' + sanctuaryShow(o)
  );
}

function invalidState(x){
  return invalidFuture(
    'go() expects the value produced by the iterator', x,
    '\n  Tip: If you\'re using a generator, make sure you always yield a Future'
  );
}

var Go = createInterpreter(1, 'go', function Go$interpret(rec, rej, res){

  var _this = this, timing = Undetermined, cancel = noop, state, value, iterator;

  function crash(e){
    rec(wrapException(e, _this));
  }

  try{
    iterator = _this.$1();
  }catch(e){
    crash(e);
    return noop;
  }

  if(!isIterator(iterator)){
    crash(invalidArgument('go', 0, 'return an iterator, maybe you forgot the "*"', iterator));
    return noop;
  }

  function resolved(x){
    value = x;
    if(timing === Asynchronous) return drain();
    timing = Synchronous;
  }

  function drain(){
    //eslint-disable-next-line no-constant-condition
    while(true){
      try{
        state = iterator.next(value);
      }catch(e){
        return crash(e);
      }
      if(!isIteration(state)) return crash(invalidIteration(state));
      if(state.done) break;
      if(!isFuture(state.value)){
        return crash(invalidState(state.value));
      }
      timing = Undetermined;
      cancel = state.value._interpret(crash, rej, resolved);
      if(timing === Undetermined) return timing = Asynchronous;
    }
    res(state.value);
  }

  drain();

  return function Go$cancel(){ cancel(); };

});

function go(generator){
  return new Go(application1(go, func, arguments), generator);
}

function invalidDisposal(m, f, x){
  return invalidFuture(
    'hook() expects the return value from the first function it\'s given', m,
    '\n  From calling: ' + sanctuaryShow(f) + '\n  With: ' + sanctuaryShow(x)
  );
}

function invalidConsumption(m, f, x){
  return invalidFuture(
    'hook() expects the return value from the second function it\'s given', m,
    '\n  From calling: ' + sanctuaryShow(f) + '\n  With: ' + sanctuaryShow(x)
  );
}

var Hook = createInterpreter(3, 'hook', function Hook$interpret(rec, rej, res){

  var _this = this, _acquire = this.$1, _dispose = this.$2, _consume = this.$3;
  var cancel, cancelConsume = noop, resource, value, cont = noop;

  function Hook$done(){
    cont(value);
  }

  function Hook$rec(x){
    rec(wrapException(x, _this));
  }

  function Hook$dispose(){
    var disposal;
    try{
      disposal = _dispose(resource);
    }catch(e){
      return Hook$rec(e);
    }
    if(!isFuture(disposal)){
      return Hook$rec(invalidDisposal(disposal, _dispose, resource));
    }
    cancel = Hook$cancelDisposal;
    disposal._interpret(Hook$rec, Hook$disposalRejected, Hook$done);
  }

  function Hook$cancelConsumption(){
    cancelConsume();
    Hook$dispose();
    Hook$cancelDisposal();
  }

  function Hook$cancelDisposal(){
    cont = noop;
  }

  function Hook$disposalRejected(x){
    Hook$rec(new Error('The disposal Future rejected with ' + sanctuaryShow(x)));
  }

  function Hook$consumptionException(x){
    cont = Hook$rec;
    value = x;
    Hook$dispose();
  }

  function Hook$consumptionRejected(x){
    cont = rej;
    value = x;
    Hook$dispose();
  }

  function Hook$consumptionResolved(x){
    cont = res;
    value = x;
    Hook$dispose();
  }

  function Hook$consume(x){
    resource = x;
    var consumption;
    try{
      consumption = _consume(resource);
    }catch(e){
      return Hook$consumptionException(e);
    }
    if(!isFuture(consumption)){
      return Hook$consumptionException(invalidConsumption(consumption, _consume, resource));
    }
    cancel = Hook$cancelConsumption;
    cancelConsume = consumption._interpret(
      Hook$consumptionException,
      Hook$consumptionRejected,
      Hook$consumptionResolved
    );
  }

  var cancelAcquire = _acquire._interpret(Hook$rec, rej, Hook$consume);
  cancel = cancel || cancelAcquire;

  return function Hook$fork$cancel(){
    rec = raise;
    cancel();
  };

});

function hook(acquire){
  var context1 = application1(hook, future, arguments);
  return function hook(dispose){
    var context2 = application(2, hook, func, arguments, context1);
    return function hook(consume){
      var context3 = application(3, hook, func, arguments, context2);
      return new Hook(context3, acquire, dispose, consume);
    };
  };
}

var LastlyTransformation = createTransformation(1, 'lastly', {
  rejected: function LastlyAction$rejected(x){
    return this.$1._transform(new AndTransformation(this.context, new Reject(this.context, x)));
  },
  resolved: function LastlyAction$resolved(x){
    return this.$1._transform(new AndTransformation(this.context, new Resolve(this.context, x)));
  }
});

function lastly(cleanup){
  var context1 = application1(lastly, future, arguments);
  return function lastly(program){
    var context2 = application(2, lastly, future, arguments, context1);
    return program._transform(new LastlyTransformation(context2, cleanup));
  };
}

var MapRejTransformation = createTransformation(1, 'mapRej', {
  rejected: function MapRejTransformation$rejected(x){
    return new Reject(this.context, call(this.$1, x));
  }
});

function mapRej(f){
  var context1 = application1(mapRej, func, arguments);
  return function mapRej(m){
    var context2 = application(2, mapRej, future, arguments, context1);
    return m._transform(new MapRejTransformation(context2, f));
  };
}

var functor = {pred: isFunctor, error: invalidArgumentOf('have Functor implemented')};

function map(f){
  var context1 = application1(map, func, arguments);
  return function map(m){
    var context2 = application(2, map, functor, arguments, context1);
    return isFuture(m) ?
           m._transform(new MapTransformation(context2, f)) :
           m[FL.map](f);
  };
}

var Node = createInterpreter(1, 'node', function Node$interpret(rec, rej, res){
  function Node$done(err, val){
    cont = err ? function EncaseN3$rej(){
      open = false;
      rej(err);
    } : function EncaseN3$res(){
      open = false;
      res(val);
    };
    if(open){
      cont();
    }
  }
  var open = false, cont = function(){ open = true; };
  try{
    call(this.$1, Node$done);
  }catch(e){
    rec(wrapException(e, this));
    open = false;
    return noop;
  }
  cont();
  return function Node$cancel(){ open = false; };
});

function node(f){
  return new Node(application1(node, func, arguments), f);
}

var ParallelApTransformation =
createParallelTransformation('pap', earlyCrash, earlyReject, noop, {
  resolved: function ParallelApTransformation$resolved(f){
    if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
    throw typeError(
      'pap expects the second Future to resolve to a Function\n' +
      '  Actual: ' + sanctuaryShow(f)
    );
  }
});

function pap(mx){
  var context1 = application1(pap, future, arguments);
  return function pap(mf){
    var context2 = application(2, pap, future, arguments, context1);
    return mf._transform(new ParallelApTransformation(context2, mx));
  };
}

function isFutureArray(xs){
  if(!isArray(xs)) return false;
  for(var i = 0; i < xs.length; i++){
    if(!isFuture(xs[i])) return false;
  }
  return true;
}

var futureArray = {
  pred: isFutureArray,
  error: invalidArgumentOf('be an Array of valid Futures')
};

var Parallel = createInterpreter(2, 'parallel', function Parallel$interpret(rec, rej, res){

  var _this = this, futures = this.$2, length = futures.length;
  var max = Math.min(this.$1, length), cancels = new Array(length), out = new Array(length);
  var cursor = 0, running = 0, blocked = false, cont = noop;

  function Parallel$cancel(){
    rec = noop;
    rej = noop;
    res = noop;
    cursor = length;
    for(var n = 0; n < length; n++) cancels[n] && cancels[n]();
  }

  function Parallel$run(idx){
    running++;
    cancels[idx] = futures[idx]._interpret(function Parallel$rec(e){
      cont = rec;
      cancels[idx] = noop;
      Parallel$cancel();
      cont(wrapException(e, _this));
    }, function Parallel$rej(reason){
      cont = rej;
      cancels[idx] = noop;
      Parallel$cancel();
      cont(reason);
    }, function Parallel$res(value){
      cancels[idx] = noop;
      out[idx] = value;
      running--;
      if(cursor === length && running === 0) res(out);
      else if(blocked) Parallel$drain();
    });
  }

  function Parallel$drain(){
    blocked = false;
    while(cursor < length && running < max) Parallel$run(cursor++);
    blocked = true;
  }

  Parallel$drain();

  return Parallel$cancel;

});

var emptyArray = resolve([]);

function parallel(max){
  var context1 = application1(parallel, positiveInteger, arguments);
  return function parallel(ms){
    var context2 = application(2, parallel, futureArray, arguments, context1);
    return ms.length === 0 ? emptyArray : new Parallel(context2, max, ms);
  };
}

var RaceTransformation =
createParallelTransformation('race', earlyCrash, earlyReject, earlyResolve, {});

function race(left){
  var context1 = application1(race, future, arguments);
  return function race(right){
    var context2 = application(2, race, future, arguments, context1);
    return right._transform(new RaceTransformation(context2, left));
  };
}

function ConcurrentFuture (sequential){
  this.sequential = sequential;
}

ConcurrentFuture.prototype = Object.create(Par.prototype);

function Par (sequential){
  if(!isFuture(sequential)) throw invalidFutureArgument(Par.name, 0, sequential);
  return new ConcurrentFuture(sequential);
}

var $$type$1 = namespace + '/ConcurrentFuture@' + version;
var zeroInstance = new ConcurrentFuture(never);

// Compliance with sanctuary-type-identifiers versions 1 and 2.
// To prevent sanctuary-type-identifiers version 3 from identifying
// 'Par' as being of the type denoted by $$type, we ensure that
// Par.constructor.prototype is equal to Par.
Par['@@type'] = $$type$1;
Par.constructor = {prototype: Par};

Par[FL.of] = function Par$of(x){
  return new ConcurrentFuture(resolve(x));
};

Par[FL.zero] = function Par$zero(){
  return zeroInstance;
};

Par.prototype['@@type'] = $$type$1;

Par.prototype['@@show'] = function Par$show(){
  return this.toString();
};

Par.prototype.toString = function Par$toString(){
  return 'Par (' + this.sequential.toString() + ')';
};

Par.prototype[FL.map] = function Par$FL$map(f){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to map via ConcurrentFuture',
    Par$FL$map
  );
  return new ConcurrentFuture(this.sequential._transform(new MapTransformation(context, f)));
};

Par.prototype[FL.ap] = function Par$FL$ap(other){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to ap via ConcurrentFuture',
    Par$FL$ap
  );
  return new ConcurrentFuture(other.sequential._transform(
    new ParallelApTransformation(context, this.sequential)
  ));
};

Par.prototype[FL.alt] = function Par$FL$alt(other){
  var context = captureContext(
    nil,
    'a Fantasy Land dispatch to alt via ConcurrentFuture',
    Par$FL$alt
  );
  return new ConcurrentFuture(other.sequential._transform(
    new RaceTransformation(context, this.sequential)
  ));
};

function isParallel(x){
  return x instanceof ConcurrentFuture || sanctuaryTypeIdentifiers(x) === $$type$1;
}

function promise(m){
  application1(promise, future, arguments);
  return new Promise(function promise$computation(res, rej){
    m._interpret(rej, rej, res);
  });
}

var RejectAfter =
createInterpreter(2, 'rejectAfter', function RejectAfter$interpret(rec, rej){
  var id = setTimeout(rej, this.$1, this.$2);
  return function RejectAfter$cancel(){ clearTimeout(id); };
});

RejectAfter.prototype.extractLeft = function RejectAfter$extractLeft(){
  return [this.$2];
};

function alwaysNever$1(_){
  return never;
}

function rejectAfter(time){
  var context1 = application1(rejectAfter, positiveInteger, arguments);
  return time === Infinity ? alwaysNever$1 : (function rejectAfter(value){
    var context2 = application(2, rejectAfter, any, arguments, context1);
    return new RejectAfter(context2, time, value);
  });
}

var parallel$1 = {pred: isParallel, error: invalidArgumentOf('be a ConcurrentFuture')};

function seq(par){
  application1(seq, parallel$1, arguments);
  return par.sequential;
}

var SwapTransformation = createTransformation(0, 'swap', {
  resolved: function SwapTransformation$resolved(x){
    return new Reject(this.context, x);
  },
  rejected: function SwapTransformation$rejected(x){
    return new Resolve(this.context, x);
  }
});

function swap(m){
  var context = application1(swap, future, arguments);
  return m._transform(new SwapTransformation(context));
}

function value(res){
  var context1 = application1(value, func, arguments);
  return function value(m){
    application(2, value, future, arguments, context1);
    function value$rej(x){
      raise(error(
        'Future#value was called on a rejected Future\n' +
        '  Rejection: ' + sanctuaryShow(x) + '\n' +
        '  Future: ' + sanctuaryShow(m)
      ));
    }
    return m._interpret(raise, value$rej, res);
  };
}

export default Future;
export { Future, Par, after, alt, and, ap, attempt, attemptP, bichain, bimap, both, cache, chain, chainRej, coalesce, debugMode, done, encase, encaseP, extractLeft, extractRight, fork, forkCatch, go, hook, isFuture, isNever, lastly, map, mapRej, never, node, pap, parallel, promise, race, reject, rejectAfter, resolve, seq, swap, value };
