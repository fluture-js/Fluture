import {eq, error, assertStackTrace, K, I, test} from '../util/util.js';
import {
  debugMode,
  debug,
  captureContext,
  captureApplicationContext,
  captureStackTraceFallback,
} from '../../src/internal/debug.js';
import {nil} from '../../src/internal/list.js';

test('debug does nothing but return its first argument by default', function (done){
  debugMode(false);
  eq(debug(null, done, error), null);
  eq(debug(42, done, error), 42);
  done();
});

test('debug runs the given function when debugMode was enabled', function (){
  var guard = {};
  debugMode(true);
  eq(debug(null, K(guard)), guard);
  eq(debug(null, I, guard), guard);
});

test('captureContext returns previous when debugMode is off', function (){
  debugMode(false);
  var previous = {};
  var x = captureContext(previous, 2, 3);
  eq(x, previous);
});

test('captureContext returns a list with a context object', function (){
  debugMode(true);
  var prev = nil;
  var tag = 'hello world';
  var expectedName = ' from ' + tag + ':';
  var ctx = captureContext(prev, tag);
  eq(typeof ctx, 'object');
  eq(ctx.tail, prev);
  eq(typeof ctx.head, 'object');
  eq(ctx.head.tag, tag);
  eq(ctx.head.name, expectedName);
  assertStackTrace(expectedName, ctx.head.stack);
});

test('captureApplicationContext returns previous when debugMode is off', function (){
  debugMode(false);
  var previous = {};
  var x = captureApplicationContext(previous, 1, Math.sqrt);
  eq(x, previous);
});

test('captureApplicationContext returns a list with a context object', function (){
  debugMode(true);
  var prev = nil;
  var expectedName = ' from first application of sqrt:';
  var ctx = captureApplicationContext(prev, 1, Math.sqrt);
  eq(typeof ctx, 'object');
  eq(ctx.tail, prev);
  eq(typeof ctx.head, 'object');
  eq(ctx.head.tag, 'first application of sqrt');
  eq(ctx.head.name, expectedName);
  assertStackTrace(expectedName, ctx.head.stack);
});

test('captureStackTraceFallback assigns a stack trace to the given object', function (){
  debugMode(false);
  var o = {name: 'test'};
  captureStackTraceFallback(o);
  assertStackTrace('test', o.stack);
});
