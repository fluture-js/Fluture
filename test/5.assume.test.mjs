import chai from 'chai';
import {Future, assume, of, reject} from '../index.mjs';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

var expect = chai.expect;

var testInstance = function (assume){

  it('is considered a member of fluture/Fluture', function (){
    expect(type(assume(of(1), of(2)))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('runs the second Future when the first resolves', function (done){
      assume(of(1), of(null).map(done))._interpret(done, U.noop, U.noop);
    });

    it('runs the second Future when the first rejects', function (done){
      assume(reject(1), of(null).map(done))._interpret(done, U.noop, U.noop);
    });

    it('always rejects with the rejection reason of the second', function (){
      var actualResolved = assume(of(1), reject(2));
      var actualRejected = assume(reject(1), reject(2));
      return Promise.all([
        U.assertRejected(actualResolved, 2),
        U.assertRejected(actualRejected, 2)
      ]);
    });

    it('always resolves with the resolution value of the second', function (){
      var actualResolved = assume(of(1), of(2));
      var actualRejected = assume(reject(1), of(2));
      return Promise.all([
        U.assertResolved(actualResolved, 2),
        U.assertResolved(actualRejected, 2)
      ]);
    });

    it('does nothing after being cancelled', function (done){
      assume(F.resolvedSlow, F.resolved)._interpret(done, U.failRej, U.failRes)();
      assume(F.resolved, F.resolvedSlow)._interpret(done, U.failRej, U.failRes)();
      assume(F.rejectedSlow, F.rejected)._interpret(done, U.failRej, U.failRes)();
      assume(F.rejected, F.rejectedSlow)._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

  });

};

describe('assume()', function (){

  it('is a curried binary function', function (){
    expect(assume).to.be.a('function');
    expect(assume.length).to.equal(2);
    expect(assume(of(1))).to.be.a('function');
  });

  it('throws when not given a Future as first argument', function (){
    var f = function (){ return assume(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return assume(of(1), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (a, b){ return assume(b, a) });

});

describe('Future#assume()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return of(1).assume.call(null, of(1)) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a Future', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, function (x){ return x }];
    var fs = xs.map(function (x){ return function (){ return of(1).assume(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (a, b){ return a.assume(b) });

});

describe('Future#assume()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return of(1).assume.call(null, of(1)) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a Future', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, function (x){ return x }];
    var fs = xs.map(function (x){ return function (){ return of(1).assume(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (a, b){ return a.assume(b) });

});
