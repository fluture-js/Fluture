import {expect} from 'chai';
import {Future, chainRej, of} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

var testInstance = function (chainRej){

  it('is considered a member of fluture/Fluture', function (){
    expect(type(chainRej(F.rejected, function (){ return F.resolved }))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('crashes when the given function does not return Future', function (){
      var m = chainRej(F.rejected, function (){ return null });
      return U.assertCrashed(m, new TypeError(
        'Future#chainRej expects the function it\'s given to return a Future.\n' +
        '  Actual: null :: Null\n' +
        '  From calling: function (){ return null }\n' +
        '  With: "rejected"'
      ));
    });

    it('calls the given function with the inner of the Future', function (done){
      chainRej(F.rejected, function (x){
        expect(x).to.equal('rejected');
        done();
        return of(null);
      })._interpret(done, U.noop, U.noop);
    });

    it('returns a Future with an inner equal to the returned Future', function (){
      var actual = chainRej(F.rejected, function (){ return F.resolved });
      return U.assertResolved(actual, 'resolved');
    });

    it('maintains resolved state', function (){
      var actual = chainRej(F.resolved, function (){ return F.resolvedSlow });
      return U.assertResolved(actual, 'resolved');
    });

    it('assumes rejected state', function (){
      var actual = chainRej(F.rejected, function (){ return F.rejectedSlow });
      return U.assertRejected(actual, 'rejectedSlow');
    });

    it('does not chain after being cancelled', function (done){
      chainRej(F.rejectedSlow, U.failRej)._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

  });

};

describe('chainRej()', function (){

  it('is a curried binary function', function (){
    expect(chainRej).to.be.a('function');
    expect(chainRej.length).to.equal(2);
    expect(chainRej(U.noop)).to.be.a('function');
  });

  it('throws when not given a Function as first argument', function (){
    var f = function (){ return chainRej(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return chainRej(U.B(Future.of)(U.add(1)), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (m, f){ return chainRej(f, m) });

});

describe('Future#chainRej()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return F.rejected.chainRej.call(null, U.noop) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return F.rejected.chainRej(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (m, f){ return m.chainRej(f) });

});
