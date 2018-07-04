/* eslint prefer-promise-reject-errors: 0 */

import {expect} from 'chai';
import {Future, encaseP, encaseP2, encaseP3, tryP} from '../index.mjs.js';
import * as U from './util';
import type from 'sanctuary-type-identifiers';

var unaryNoop = function (a){ return Promise.resolve(a) };
var binaryNoop = function (a, b){ return Promise.resolve(b) };
var ternaryNoop = function (a, b, c){ return Promise.resolve(c) };

describe('tryP()', function (){

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return tryP(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(tryP(unaryNoop)).to.be.an.instanceof(Future);
  });

});

describe('encaseP()', function (){

  it('is a curried binary function', function (){
    expect(encaseP).to.be.a('function');
    expect(encaseP.length).to.equal(2);
    expect(encaseP(U.noop)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseP(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseP(unaryNoop, null)).to.be.an.instanceof(Future);
  });

});

describe('encaseP2()', function (){

  it('is a curried ternary function', function (){
    expect(encaseP2).to.be.a('function');
    expect(encaseP2.length).to.equal(3);
    expect(encaseP2(function (a, b){ return b })).to.be.a('function');
    expect(encaseP2(function (a, b){ return b })(1)).to.be.a('function');
    expect(encaseP2(function (a, b){ return b }, 1)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseP2(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseP2(binaryNoop, null, null)).to.be.an.instanceof(Future);
  });

});

describe('encaseP3()', function (){

  it('is a curried quaternary function', function (){
    expect(encaseP3).to.be.a('function');
    expect(encaseP3.length).to.equal(4);
    expect(encaseP3(function (a, b, c){ return c })).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c })(1)).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c }, 1)).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c })(1)(2)).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c }, 1)(2)).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c })(1, 2)).to.be.a('function');
    expect(encaseP3(function (a, b, c){ return c }, 1, 2)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseP3(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseP3(ternaryNoop, null, null, null))
    .to.be.an.instanceof(Future);
  });

});

describe('EncaseP', function (){

  it('extends Future', function (){
    expect(encaseP(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(encaseP(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    describe('(nullary)', function (){

      it('crashes when the Promise generator throws', function (){
        var m = tryP(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

      it('crashes when the Promise generator does not return a Promise', function (){
        var m = tryP(U.noop);
        return U.assertCrashed(m, new TypeError(
          'Future.tryP expects the function it\'s given to return a Promise/Thenable\n' +
          '  Actual: undefined\n' +
          '  From calling: function (){}'
        ));
      });

      it('resolves with the resolution value of the returned Promise', function (){
        var actual = tryP(function (){ return Promise.resolve(1) });
        return U.assertResolved(actual, 1);
      });

      it('rejects with rejection reason of the returned Promise', function (){
        var actual = tryP(function (){ return Promise.reject(U.error) });
        return U.assertRejected(actual, U.error);
      });

      it('ensures no resolution happens after cancel', function (done){
        var actual = tryP(function (){ return Promise.resolve(1) });
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

      it('ensures no rejection happens after cancel', function (done){
        var actual = tryP(function (){ return Promise.reject(1) });
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

      it('crashes with errors that occur in rejection continuation', function (){
        var m = tryP(function (){ return Promise.resolve(1) }).map(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

      it('crashes with errors that occur in resolution continuation', function (){
        var m = tryP(function (){ return Promise.reject(1) }).mapRej(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

    });

    describe('(unary)', function (){

      it('crashes when the Promise generator throws', function (){
        var m = encaseP(function (){ throw U.error }, 1);
        return U.assertCrashed(m, U.error);
      });

      it('crashes when the Promise generator does not return a Promise', function (){
        var m = encaseP(U.noop, 1);
        return U.assertCrashed(m, new TypeError(
          'Future.encaseP expects the function it\'s given to return a Promise/Thenable\n' +
          '  Actual: undefined\n' +
          '  From calling: function (){}\n' +
          '  With: 1'
        ));
      });

      it('resolves with the resolution value of the returned Promise', function (){
        var actual = encaseP(function (x){ return Promise.resolve(x + 1) }, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', function (){
        var actual = encaseP(function (){ return Promise.reject(U.error) }, 1);
        return U.assertRejected(actual, U.error);
      });

      it('ensures no resolution happens after cancel', function (done){
        var actual = encaseP(function (x){ return Promise.resolve(x + 1) }, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

      it('ensures no rejection happens after cancel', function (done){
        var actual = encaseP(function (x){ return Promise.reject(x + 1) }, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

    describe('(binary)', function (){

      it('crashes when the Promise generator throws', function (){
        var m = encaseP2(function (){ throw U.error }, 1, 1);
        return U.assertCrashed(m, U.error);
      });

      it('crashes when the Promise generator does not return a Promise', function (){
        var m = encaseP2(U.noop, 1, 1);
        return U.assertCrashed(m, new TypeError(
          'Future.encaseP2 expects the function it\'s given to return a Promise/Thenable\n' +
          '  Actual: undefined\n' +
          '  From calling: function (){}\n' +
          '  With 1: 1\n' +
          '  With 2: 1'
        ));
      });

      it('resolves with the resolution value of the returned Promise', function (){
        var actual = encaseP2(function (x, y){ return Promise.resolve(y + 1) }, 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', function (){
        var actual = encaseP2(function (){ return Promise.reject(U.error) }, 1, 1);
        return U.assertRejected(actual, U.error);
      });

      it('ensures no resolution happens after cancel', function (done){
        var actual = encaseP2(function (x, y){ return Promise.resolve(y + 1) }, 1, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

      it('ensures no rejection happens after cancel', function (done){
        var actual = encaseP2(function (x, y){ return Promise.reject(y + 1) }, 1, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

    describe('(ternary)', function (){

      it('crashes when the Promise generator throws', function (){
        var m = encaseP3(function (){ throw U.error }, 1, 1, 1);
        return U.assertCrashed(m, U.error);
      });

      it('crashes when the Promise generator does not return a Promise', function (){
        var m = encaseP3(U.noop, 1, 1, 1);
        return U.assertCrashed(m, new TypeError(
          'Future.encaseP3 expects the function it\'s given to return a Promise/Thenable\n' +
          '  Actual: undefined\n' +
          '  From calling: function (){}\n' +
          '  With 1: 1\n' +
          '  With 2: 1\n' +
          '  With 3: 1'
        ));
      });

      it('resolves with the resolution value of the returned Promise', function (){
        var actual = encaseP3(function (x, y, z){ return Promise.resolve(z + 1) }, 1, 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', function (){
        var actual = encaseP3(function (){ return Promise.reject(U.error) }, 1, 1, 1);
        return U.assertRejected(actual, U.error);
      });

      it('ensures no resolution happens after cancel', function (done){
        var actual = encaseP3(function (x, y, z){ return Promise.resolve(z + 1) }, 1, 1, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

      it('ensures no rejection happens after cancel', function (done){
        var actual = encaseP3(function (x, y, z){ return Promise.reject(z + 1) }, 1, 1, 1);
        actual._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

  });

  describe('#toString()', function (){

    it('returns the code to create the EncaseP', function (){
      var m0 = tryP(unaryNoop);
      var m1 = encaseP(unaryNoop, null);
      var m2 = encaseP2(binaryNoop, null, null);
      var m3 = encaseP3(ternaryNoop, null, null, null);
      expect(m0.toString()).to.equal(
        ('Future.tryP(' + (unaryNoop.toString()) + ')')
      );
      expect(m1.toString()).to.equal(
        ('Future.encaseP(' + (unaryNoop.toString()) + ', null)')
      );
      expect(m2.toString()).to.equal(
        ('Future.encaseP2(' + (binaryNoop.toString()) + ', null, null)')
      );
      expect(m3.toString()).to.equal(
        ('Future.encaseP3(' + (ternaryNoop.toString()) + ', null, null, null)')
      );
    });

  });

});
