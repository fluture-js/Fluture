import {expect} from 'chai';
import {Future, encaseN, encaseN2, encaseN3, node} from '../index.mjs.js';
import * as U from './util';
import type from 'sanctuary-type-identifiers';

var unaryNoop = function (a, f){ return void f };
var binaryNoop = function (a, b, f){ return void f };
var ternaryNoop = function (a, b, c, f){ return void f };

describe('node()', function (){

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return node(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(node(U.noop)).to.be.an.instanceof(Future);
  });

});

describe('encaseN()', function (){

  it('is a curried binary function', function (){
    expect(encaseN).to.be.a('function');
    expect(encaseN.length).to.equal(2);
    expect(encaseN(U.noop)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseN(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseN(unaryNoop, null)).to.be.an.instanceof(Future);
  });

});

describe('encaseN2()', function (){

  it('is a curried ternary function', function (){
    expect(encaseN2).to.be.a('function');
    expect(encaseN2.length).to.equal(3);
    expect(encaseN2(function (a, b){ return b })).to.be.a('function');
    expect(encaseN2(function (a, b){ return b })(1)).to.be.a('function');
    expect(encaseN2(function (a, b){ return b }, 1)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseN2(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseN2(binaryNoop, null, null)).to.be.an.instanceof(Future);
  });

});

describe('encaseN3()', function (){

  it('is a curried quaternary function', function (){
    expect(encaseN3).to.be.a('function');
    expect(encaseN3.length).to.equal(4);
    expect(encaseN3(function (a, b, c){ return c })).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c })(1)).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c }, 1)).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c })(1)(2)).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c }, 1)(2)).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c })(1, 2)).to.be.a('function');
    expect(encaseN3(function (a, b, c){ return c }, 1, 2)).to.be.a('function');
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return encaseN3(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(encaseN3(ternaryNoop, null, null, null)).to.be.an.instanceof(Future);
  });

});

describe('EncaseN', function (){

  it('extends Future', function (){
    expect(encaseN(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(encaseN(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    describe('(nullary)', function (){

      it('crashes when the function throws', function (){
        var m = node(function (){ throw U.error });
        return U.assertCrashed(m, U.error);
      });

      it('rejects when the callback is called with (err)', function (){
        var f = function (done){ return done(U.error) };
        return U.assertRejected(node(f), U.error);
      });

      it('resolves when the callback is called with (null, a)', function (){
        var f = function (done){ return done(null, 'a') };
        return U.assertResolved(node(f), 'a');
      });

      it('settles with the last synchronous call to done', function (){
        var f = function (done){ done(null, 'a'); done(U.error); done(null, 'b') };
        return U.assertResolved(node(f), 'b');
      });

      it('settles with the first asynchronous call to done', function (){
        var f = function (done){
          setTimeout(done, 10, null, 'a');
          setTimeout(done, 50, null, 'b');
        };
        return U.assertResolved(node(f), 'a');
      });

      it('ensures no continuations are called after cancel', function (done){
        var f = function (done){ return setTimeout(done, 5) };
        node(f)._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

    describe('(unary)', function (){

      it('crashes when the function throws', function (){
        var m = encaseN(function (){ throw U.error }, 1);
        return U.assertCrashed(m, U.error);
      });

      it('rejects when the callback is called with (err)', function (){
        var f = function (a, done){ return done(U.error) };
        return U.assertRejected(encaseN(f, 'a'), U.error);
      });

      it('resolves when the callback is called with (null, a)', function (){
        var f = function (a, done){ return done(null, a) };
        return U.assertResolved(encaseN(f, 'a'), 'a');
      });

      it('settles with the last synchronous call to done', function (){
        var f = function (a, done){ done(null, 'a'); done(U.error); done(null, a) };
        return U.assertResolved(encaseN(f, 'b'), 'b');
      });

      it('settles with the first asynchronous call to done', function (){
        var f = function (a, done){
          setTimeout(done, 10, null, a);
          setTimeout(done, 50, null, 'b');
        };
        return U.assertResolved(encaseN(f, 'a'), 'a');
      });

      it('ensures no continuations are called after cancel', function (done){
        var f = function (a, done){ return setTimeout(done, 5) };
        encaseN(f, 'a')._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

    describe('(binary)', function (){

      it('crashes when the function throws', function (){
        var m = encaseN2(function (){ throw U.error }, 1, 1);
        return U.assertCrashed(m, U.error);
      });

      it('rejects when the callback is called with (err)', function (){
        var f = function (a, b, done){ return done(U.error) };
        return U.assertRejected(encaseN2(f, 'a', 'b'), U.error);
      });

      it('resolves when the callback is called with (null, a)', function (){
        var f = function (a, b, done){ return done(null, a) };
        return U.assertResolved(encaseN2(f, 'a', 'b'), 'a');
      });

      it('settles with the last synchronous call to done', function (){
        var f = function (a, b, done){ done(null, a); done(U.error); done(null, b) };
        return U.assertResolved(encaseN2(f, 'a', 'b'), 'b');
      });

      it('settles with the first asynchronous call to done', function (){
        var f = function (a, b, done){
          setTimeout(done, 10, null, a);
          setTimeout(done, 50, null, b);
        };
        return U.assertResolved(encaseN2(f, 'a', 'b'), 'a');
      });

      it('ensures no continuations are called after cancel', function (done){
        var f = function (a, b, done){ return setTimeout(done, 5) };
        encaseN2(f, 'a', 'b')._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

    describe('(ternary)', function (){

      it('crashes when the function throws', function (){
        var m = encaseN3(function (){ throw U.error }, 1, 1, 1);
        return U.assertCrashed(m, U.error);
      });

      it('rejects when the callback is called with (err)', function (){
        var f = function (a, b, c, done){ return done(U.error) };
        return U.assertRejected(encaseN3(f, 'a', 'b', 'c'), U.error);
      });

      it('resolves when the callback is called with (null, a)', function (){
        var f = function (a, b, c, done){ return done(null, a) };
        return U.assertResolved(encaseN3(f, 'a', 'b', 'c'), 'a');
      });

      it('settles with the last synchronous call to done', function (){
        var f = function (a, b, c, done){ done(null, a); done(U.error); done(null, c) };
        return U.assertResolved(encaseN3(f, 'a', 'b', 'c'), 'c');
      });

      it('settles with the first asynchronous call to done', function (){
        var f = function (a, b, c, done){
          setTimeout(done, 10, null, a);
          setTimeout(done, 50, null, c);
        };
        return U.assertResolved(encaseN3(f, 'a', 'b', 'c'), 'a');
      });

      it('ensures no continuations are called after cancel', function (done){
        var f = function (a, b, c, done){ return setTimeout(done, 5) };
        encaseN3(f, 'a', 'b', 'c')._interpret(done, U.failRej, U.failRes)();
        setTimeout(done, 20);
      });

    });

  });

  describe('#toString()', function (){

    it('returns the code to create the EncaseN', function (){
      var m0 = node(unaryNoop);
      var m1 = encaseN(unaryNoop, null);
      var m2 = encaseN2(binaryNoop, null, null);
      var m3 = encaseN3(ternaryNoop, null, null, null);
      expect(m0.toString()).to.equal(('Future.node(' + (unaryNoop.toString()) + ')'));
      expect(m1.toString()).to.equal(('Future.encaseN(' + (unaryNoop.toString()) + ', null)'));
      expect(m2.toString()).to.equal(('Future.encaseN2(' + (binaryNoop.toString()) + ', null, null)'));
      expect(m3.toString()).to.equal(
        ('Future.encaseN3(' + (ternaryNoop.toString()) + ', null, null, null)')
      );
    });

  });

});
