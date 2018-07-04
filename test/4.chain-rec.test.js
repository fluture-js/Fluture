import {expect} from 'chai';
import {Future, of, after, reject} from '../index.mjs.js';
import {isIteration} from '../src/internal/iteration';
import * as U from './util';
import type from 'sanctuary-type-identifiers';

describe('chainRec()', function (){

  it('is a binary function', function (){
    expect(Future.chainRec).to.be.a('function');
    expect(Future.chainRec.length).to.equal(2);
  });

  it('returns an instance of Future', function (){
    expect(Future.chainRec(U.noop, 1)).to.be.an.instanceof(Future);
  });

});

describe('ChainRec', function (){

  it('extends Future', function (){
    expect(Future.chainRec(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(Future.chainRec(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('crashes if the iterator throws', function (){
      var m = Future.chainRec(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

    it('does not break if the iteration does not contain a value key', function (){
      var actual = Future.chainRec(function (f, g, x){ return (x, of({done: true})) }, 0);
      return U.assertResolved(actual, undefined);
    });

    it('calls the function with Next, Done and the initial value', function (){
      Future.chainRec(function (next, done, x){
        expect(next).to.be.a('function');
        expect(next.length).to.equal(1);
        expect(next(x)).to.satisfy(isIteration);
        expect(done).to.be.a('function');
        expect(done.length).to.equal(1);
        expect(done(x)).to.satisfy(isIteration);
        expect(x).to.equal(42);
        return of(done(x));
      }, 42)._interpret(U.noop, U.noop, U.noop);
    });

    it('calls the function with the value from the current iteration', function (){
      var i = 0;
      Future.chainRec(function (f, g, x){
        expect(x).to.equal(i);
        return x < 5 ? of(f(++i)) : of(g(x));
      }, i)._interpret(U.noop, U.noop, U.noop);
    });

    it('works asynchronously', function (){
      var actual = Future.chainRec(function (f, g, x){ return after(10, x < 5 ? f(x + 1) : g(x)) }, 0);
      return U.assertResolved(actual, 5);
    });

    it('responds to failure', function (){
      var m = Future.chainRec(function (f, g, x){ return reject(x) }, 1);
      return U.assertRejected(m, 1);
    });

    it('responds to failure after chaining async', function (){
      var m = Future.chainRec(
        function (f, g, x){ return x < 2 ? after(10, f(x + 1)) : reject(x) }, 0
      );
      return U.assertRejected(m, 2);
    });

    it('can be cancelled straight away', function (done){
      Future.chainRec(function (f, g, x){ return after(10, g(x)) }, 1)
      ._interpret(done, U.failRej, U.failRes)();
      setTimeout(done, 20);
    });

    it('can be cancelled after some iterations', function (done){
      var m = Future.chainRec(function (f, g, x){ return after(10, x < 5 ? f(x + 1) : g(x)) }, 0);
      var cancel = m._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 25);
      setTimeout(done, 70);
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the ChainRec', function (){
      var f = function (next, done, x){ return next(x) };
      var m = Future.chainRec(f, 1);
      var s = 'Future.chainRec(' + (f.toString()) + ', 1)';
      expect(m.toString()).to.equal(s);
    });

  });

});
