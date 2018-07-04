import {expect} from 'chai';
import {Future, ap, of, reject, after} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';
import R from 'ramda';

var testInstance = function (ap){

  it('is considered a member of fluture/Fluture', function (){
    expect(type(ap(of(1), of(U.add(1))))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('crashes when the other does not resolve to a Function', function (){
      var m = ap(of(1), of(null));
      return U.assertCrashed(m, new TypeError(
        'Future#ap expects its first argument to be a Future of a Function\n' +
        '  Actual: Future.of(null)'
      ));
    });

    it('calls the function contained in the given Future to its contained value', function (){
      var actual = ap(of(1), of(U.add(1)));
      return U.assertResolved(actual, 2);
    });

    it('rejects if one of the two reject', function (){
      var left = ap(reject('err'), of(U.add(1)));
      var right = ap(of(U.add(1)), reject('err'));
      return Promise.all([
        U.assertRejected(left, 'err'),
        U.assertRejected(right, 'err')
      ]);
    });

    it('does not matter if the left resolves late', function (){
      var actual = ap(after(20, 1), of(U.add(1)));
      return U.assertResolved(actual, 2);
    });

    it('does not matter if the right resolves late', function (){
      var actual = ap(of(1), after(20, U.add(1)));
      return U.assertResolved(actual, 2);
    });

    it('interprets in sequence', function (done){
      var running = true;
      var left = after(20, 1).map(function (x){ running = false; return x });
      var right = of(function (){ expect(running).to.equal(false); done() });
      ap(left, right)._interpret(done, U.noop, U.noop);
    });

    it('cancels the left Future if cancel is called while it is running', function (done){
      var left = Future(function (){ return function (){ return done() } });
      var right = of(U.add(1));
      var cancel = ap(left, right)._interpret(done, U.noop, U.noop);
      cancel();
    });

    it('cancels the right Future if cancel is called while it is running', function (done){
      var left = of(1);
      var right = Future(function (){ return function (){ return done() } });
      var cancel = ap(left, right)._interpret(done, U.noop, U.noop);
      cancel();
    });

  });

};

describe('ap()', function (){

  it('is a curried binary function', function (){
    expect(ap).to.be.a('function');
    expect(ap.length).to.equal(2);
    expect(ap(F.resolved)).to.be.a('function');
  });

  it('throws when not given a Function as first argument', function (){
    var f = function (){ return ap(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return ap(of(1), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (a, b){ return ap(b, a) });

});

describe('Future#ap()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return of(1).ap.call(null, of(1)) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given Future', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, function (x){ return x }];
    var fs = xs.map(function (x){ return function (){ return of(U.noop).ap(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (a, b){ return b.ap(a) });

});

describe('Ramda#ap()', function (){

  testInstance(function (a, b){ return R.ap(b, a) });

});
