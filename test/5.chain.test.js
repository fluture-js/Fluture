import {expect} from 'chai';
import {Future, chain, of} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

var testInstance = function (chain){

  it('is considered a member of fluture/Fluture', function (){
    expect(type(chain(F.resolved, function (){ return F.resolvedSlow }))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('throws TypeError when the given function does not return Future', function (){
      var m = chain(F.resolved, function (){ return null });
      return U.assertCrashed(m, new TypeError(
        'Future#chain expects the function it\'s given to return a Future.\n' +
        '  Actual: null :: Null\n' +
        '  From calling: function (){ return null }\n' +
        '  With: "resolved"'
      ));
    });

    it('calls the given function with the inner of the Future', function (done){
      chain(F.resolved, function (x){
        expect(x).to.equal('resolved');
        done();
        return of(null);
      })._interpret(done, U.noop, U.noop);
    });

    it('returns a Future with an inner equal to the returned Future', function (){
      var actual = chain(F.resolved, function (){ return F.resolvedSlow });
      return U.assertResolved(actual, 'resolvedSlow');
    });

    it('maintains rejected state', function (){
      var actual = chain(F.rejected, function (){ return F.resolved });
      return U.assertRejected(actual, 'rejected');
    });

    it('assumes rejected state', function (){
      var actual = chain(F.resolved, function (){ return F.rejected });
      return U.assertRejected(actual, 'rejected');
    });

    it('does not chain after being cancelled', function (done){
      chain(F.resolvedSlow, U.failRes)._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

    it('does not reject after being cancelled', function (done){
      chain(F.rejectedSlow, U.failRes)._interpret(done, U.failRej, U.failRes)();
      chain(F.resolved, function (){ return F.rejectedSlow })._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 25);
    });

  });

};

describe('chain()', function (){

  it('is a curried binary function', function (){
    expect(chain).to.be.a('function');
    expect(chain.length).to.equal(2);
    expect(chain(U.noop)).to.be.a('function');
  });

  it('throws when not given a Function as first argument', function (){
    var f = function (){ return chain(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return chain(U.B(Future.of)(U.add(1)), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (m, f){ return chain(f, m) });

});

describe('Future#chain()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return F.resolved.chain.call(null, U.noop) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a function', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    var fs = xs.map(function (x){ return function (){ return F.resolved.chain(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (m, f){ return m.chain(f) });

});
