import {show} from './utils.js';
import {ordinal, namespace, name, version} from './const.js';
import {type, legacyType, parseType} from './type.js';
import {nil, cat} from './list.js';
import {captureStackTrace} from './debug.js';

function showArg(x){
  return show(x) + ' :: ' + parseType(type(x)).name;
}

export function error(message){
  return new Error(message);
}

export function typeError(message){
  return new TypeError(message);
}

export function invalidArgument(it, at, expected, actual){
  return typeError(
    it + '() expects its ' + ordinal[at] + ' argument to ' + expected + '.' +
    '\n  Actual: ' + showArg(actual)
  );
}

export function invalidArgumentOf(expected){
  return function(it, at, actual){
    return invalidArgument(it, at, expected, actual);
  };
}

export function invalidContext(it, actual){
  return typeError(
    it + '() was invoked outside the context of a Future. You might want to use'
  + ' a dispatcher instead\n  Called on: ' + show(actual)
  );
}

export function invalidArity(f, args){
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

export function invalidFuture(desc, m, s){
  var id = parseType(type(m));
  var legacyId = parseType(legacyType(m));
  if(id.name !== name && legacyId.name === name){
    id = legacyId;
  }
  var info = id.name === name ? '\n' + (
    id.namespace !== namespace ? invalidNamespace(m, id.namespace)
  : id.version !== version ? invalidVersion(m, id.version)
  : 'Nothing seems wrong. Contact the Fluture maintainers.') : '';
  return typeError(
    desc + ' to be a valid Future.' + info + '\n' +
    '  Actual: ' + show(m) + ' :: ' + id.name + (s || '')
  );
}

export function invalidFutureArgument(it, at, m, s){
  return invalidFuture(it + '() expects its ' + ordinal[at] + ' argument', m, s);
}

export function ensureError(value, fn){
  var message;
  try{
    if(value instanceof Error) return value;
    message = 'A Non-Error was thrown from a Future: ' + show(value);
  }catch (_){
    message = 'Something was thrown from a Future, but it could not be converted to String';
  }
  var e = error(message);
  captureStackTrace(e, fn);
  return e;
}

export function assignUnenumerable(o, prop, value){
  Object.defineProperty(o, prop, {value: value, writable: true, configurable: true});
}

export function wrapException(caught, callingFuture){
  var origin = ensureError(caught, wrapException);
  var context = cat(origin.context || nil, callingFuture.context);
  var e = error(origin.message);
  assignUnenumerable(e, 'future', origin.future || callingFuture);
  assignUnenumerable(e, 'reason', origin.reason || origin);
  assignUnenumerable(e, 'stack', e.reason.stack);
  return withExtraContext(e, context);
}

export function withExtraContext(e, context){
  assignUnenumerable(e, 'context', context);
  assignUnenumerable(e, 'stack', e.stack + contextToStackTrace(context));
  return e;
}

export function contextToStackTrace(context){
  var stack = '', tail = context;
  while(tail !== nil){
    stack = stack + '\n' + tail.head.stack;
    tail = tail.tail;
  }
  return stack;
}
