import chai from 'chai';
import {test, eq, noop} from '../util/util.js';
import Future from '../../index.js';
import * as util from '../../src/internal/predicates.js';

var expect = chai.expect;

test('isThenable', function (){
  var ps = [
    Promise.resolve(1),
    new Promise(noop),
    {then: noop},
    {then (a){ return a }},
    {then (a, b){ return b }},
  ];

  var values = [NaN, 1, true, undefined, null, [], {}];
  var xs = values.concat([noop]).concat(values.map(function (x){ return ({then: x}) }));

  ps.forEach(function (p){ return expect(util.isThenable(p)).to.equal(true) });
  xs.forEach(function (x){ return expect(util.isThenable(x)).to.equal(false) });
});

test('isFunction', function (){
  var xs = [NaN, 1, true, undefined, null, [], {}];
  eq(util.isFunction(function (){}), true);
  eq(util.isFunction(Future), true);
  xs.forEach(function (x){ return expect(util.isFunction(x)).to.equal(false) });
});

test('isUnsigned', function (){
  var is = [1, 2, 999999999999999, Infinity];
  var xs = [NaN, 0, -0, -1, -999999999999999, -Infinity, '1', [], {}];
  is.forEach(function (i){ return expect(util.isUnsigned(i)).to.equal(true) });
  xs.forEach(function (x){ return expect(util.isUnsigned(x)).to.equal(false) });
});

test('isObject', function (){
  function O (){}
  var os = [{}, {foo: 1}, Object.create(null), new O, []];
  var xs = [1, true, NaN, null, undefined, ''];
  os.forEach(function (i){ return expect(util.isObject(i)).to.equal(true) });
  xs.forEach(function (x){ return expect(util.isObject(x)).to.equal(false) });
});

test('isIterator', function (){
  var is = [{next (){}}, {next (x){ return x }}, (function*(){}())];
  var xs = [1, true, NaN, null, undefined, '', {}, {next: 1}];
  is.forEach(function (i){ return expect(util.isIterator(i)).to.equal(true) });
  xs.forEach(function (x){ return expect(util.isIterator(x)).to.equal(false) });
});
