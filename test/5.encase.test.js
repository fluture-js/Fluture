import {expect} from 'chai';
import {Future, encase, encase2, encase3, attempt} from '../index.mjs.js';
import * as U from './util';
import type from 'sanctuary-type-identifiers';

var unaryNoop = function (a){ return void a };
var binaryNoop = function (a, b){ return void b };
var ternaryNoop = function (a, b, c){ return void c };

describe('attempt()', function (){

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return attempt(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(attempt(function (x){ return x })).to.be.an.instanceof(Future);
  });

});

describe('encase()', function (){

  it('is a curried binary function', function (){
    expect(encase).to.be.a('function');
    expect(encase.length).to.equal(2);
    expect(encase(U.noop)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encase(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encase(unaryNoop, null)).to.be.an.instanceof(Future);
  });

});

describe('encase2()', function (){

  it('is a curried ternary function', function (){
    expect(encase2).to.be.a('function');
    expect(encase2.length).to.equal(3);
    expect(encase2(function (a, b){ return b })).to.be.a('function');
    expect(encase2(function (a, b){ return b })(1)).to.be.a('function');
    expect(encase2(function (a, b){ return b }, 1)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encase2(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encase2(binaryNoop, null, null)).to.be.an.instanceof(Future);
  });

});

describe('encase3()', function (){

  it('is a curried quaternary function', function (){
    expect(encase3).to.be.a('function');
    expect(encase3.length).to.equal(4);
    expect(encase3(function (a, b, c){ return c })).to.be.a('function');
    expect(encase3(function (a, b, c){ return c })(1)).to.be.a('function');
    expect(encase3(function (a, b, c){ return c }, 1)).to.be.a('function');
    expect(encase3(function (a, b, c){ return c })(1)(2)).to.be.a('function');
    expect(encase3(function (a, b, c){ return c }, 1)(2)).to.be.a('function');
    expect(encase3(function (a, b, c){ return c })(1, 2)).to.be.a('function');
    expect(encase3(function (a, b, c){ return c }, 1, 2)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encase3(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encase3(ternaryNoop, null, null, null)).to.be.an.instanceof(Future);
  });

});

describe('Encase', function (){

  it('extends Future', function (){
    expect(encase(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(encase(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    describe('(nullary)', function (){

      it('resolves with the return value of the function', function (){
        var actual = attempt(function (){ return 1 });
        return U.assertResolved(actual, 1);
      });

      it('rejects with the exception thrown by the function', function (){
        var actual = attempt(function (){ throw U.error });
        return U.assertRejected(actual, U.error);
      });

      it('does not swallow errors from subsequent maps and such', function (){
        var m = attempt(function (x){ return x }).map(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

    });

    describe('(unary)', function (){

      it('resolves with the return value of the function', function (){
        var actual = encase(function (x){ return x + 1 }, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with the exception thrown by the function', function (){
        var actual = encase(function (a){ throw a, U.error }, 1);
        return U.assertRejected(actual, U.error);
      });

      it('does not swallow errors from subsequent maps and such', function (){
        var m = encase(function (x){ return x }, 1).map(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

    });

    describe('(binary)', function (){

      it('resolves with the return value of the function', function (){
        var actual = encase2(function (a, x){ return x + 1 }, 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with the exception thrown by the function', function (){
        var actual = encase2(function (a, b){ throw b, U.error }, 1, 1);
        return U.assertRejected(actual, U.error);
      });

      it('does not swallow errors from subsequent maps and such', function (){
        var m = encase2(function (x){ return x }, 1, 1).map(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

    });

    describe('(ternary)', function (){

      it('resolves with the return value of the function', function (){
        var actual = encase3(function (a, b, x){ return x + 1 }, 1, 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with the exception thrown by the function', function (){
        var actual = encase3(function (a, b, c){ throw c, U.error }, 1, 1, 1);
        return U.assertRejected(actual, U.error);
      });

      it('does not swallow errors from subsequent maps and such', function (){
        var m = encase3(function (x){ return x }, 1, 1, 1).map(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Encase', function (){
      var m0 = attempt(unaryNoop);
      var m1 = encase(unaryNoop, null);
      var m2 = encase2(binaryNoop, null, null);
      var m3 = encase3(ternaryNoop, null, null, null);
      expect(m0.toString()).to.equal(('Future.try(' + (unaryNoop.toString()) + ')'));
      expect(m1.toString()).to.equal(('Future.encase(' + (unaryNoop.toString()) + ', null)'));
      expect(m2.toString()).to.equal(('Future.encase2(' + (binaryNoop.toString()) + ', null, null)'));
      expect(m3.toString()).to.equal(('Future.encase3(' + (ternaryNoop.toString()) + ', null, null, null)'));
    });

  });

});
