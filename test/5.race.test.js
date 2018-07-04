import {expect} from 'chai';
import {Future, race, of, after, never} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

var testInstance = function (race){

  it('is considered a member of fluture/Fluture', function (){
    var m1 = Future(function (rej, res){ return void setTimeout(res, 50, 1) });
    var m2 = Future(function (rej){ return void setTimeout(rej, 5, U.error) });
    expect(type(race(m1, m2))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    describe('(Crashed, Resolved)', function (){

      it('crashes if left settles first', function (){
        return U.assertCrashed(race(F.crashed, F.resolvedSlow), U.error);
      });

      it('resolves if left settles last', function (){
        return U.assertResolved(race(F.crashedSlow, F.resolved), 'resolved');
      });

    });

    describe('(Crashed, Rejected)', function (){

      it('crashes if left settles first', function (){
        return U.assertCrashed(race(F.crashed, F.rejectedSlow), U.error);
      });

      it('rejects if left settles last', function (){
        return U.assertRejected(race(F.crashedSlow, F.rejected), 'rejected');
      });

    });

    describe('(Resolved, Crashed)', function (){

      it('resolves if left settles first', function (){
        return U.assertResolved(race(F.resolved, F.crashedSlow), 'resolved');
      });

      it('crashes if left settles last', function (){
        return U.assertCrashed(race(F.resolvedSlow, F.crashed), U.error);
      });

    });

    describe('(Rejected, Crashed)', function (){

      it('rejects if left settles first', function (){
        return U.assertRejected(race(F.rejected, F.crashedSlow), 'rejected');
      });

      it('crashes if left settles last', function (){
        return U.assertCrashed(race(F.rejectedSlow, F.crashed), U.error);
      });

    });

    describe('(Resolved, Resolved)', function (){

      it('resolves with left if left settles first', function (){
        return U.assertResolved(race(F.resolved, F.resolvedSlow), 'resolved');
      });

      it('resolves with right if left settles last', function (){
        return U.assertResolved(race(F.resolvedSlow, F.resolved), 'resolved');
      });

    });

    describe('(Rejected, Rejected)', function (){

      it('rejects with right if right rejects first', function (){
        return U.assertRejected(race(F.rejectedSlow, F.rejected), 'rejected');
      });

      it('rejects with left if right rejects last', function (){
        return U.assertRejected(race(F.rejected, F.rejectedSlow), 'rejected');
      });

    });

    describe('(Rejected, Resolved)', function (){

      it('resolves with right if right settles first', function (){
        return U.assertResolved(race(F.rejectedSlow, F.resolved), 'resolved');
      });

      it('rejects with left if right settles last', function (){
        return U.assertRejected(race(F.rejected, F.resolvedSlow), 'rejected');
      });

    });

    describe('(Resolved, Rejected)', function (){

      it('resolves with left if left settles first', function (){
        return U.assertResolved(race(F.resolved, F.rejectedSlow), 'resolved');
      });

      it('rejects with right if left settles last', function (){
        return U.assertRejected(race(F.resolvedSlow, F.rejected), 'rejected');
      });

    });

    it('rejects when the first one rejects', function (){
      var m1 = Future(function (rej, res){ return void setTimeout(res, 50, 1) });
      var m2 = Future(function (rej){ return void setTimeout(rej, 5, U.error) });
      return U.assertRejected(race(m1, m2), U.error);
    });

    it('resolves when the first one resolves', function (){
      var m1 = Future(function (rej, res){ return void setTimeout(res, 5, 1) });
      var m2 = Future(function (rej){ return void setTimeout(rej, 50, U.error) });
      return U.assertResolved(race(m1, m2), 1);
    });

    it('cancels the right if the left resolves', function (done){
      var m = race(F.resolvedSlow, Future(function (){ return function (){ return done() } }));
      m._interpret(done, U.noop, U.noop);
    });

    it('cancels the left if the right resolves', function (done){
      var m = race(Future(function (){ return function (){ return done() } }), F.resolvedSlow);
      m._interpret(done, U.noop, U.noop);
    });

    it('cancels the right if the left rejects', function (done){
      var m = race(F.rejectedSlow, Future(function (){ return function (){ return done() } }));
      m._interpret(done, U.noop, U.noop);
    });

    it('cancels the left if the right rejects', function (done){
      var m = race(Future(function (){ return function (){ return done() } }), F.rejectedSlow);
      m._interpret(done, U.noop, U.noop);
    });

    it('creates a cancel function which cancels both Futures', function (done){
      var cancelled = false;
      var m = Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } });
      var cancel = race(m, m)._interpret(done, U.noop, U.noop);
      cancel();
    });

  });

};

describe('race()', function (){

  it('is a curried binary function', function (){
    expect(race).to.be.a('function');
    expect(race.length).to.equal(2);
    expect(race(of(1))).to.be.a('function');
  });

  it('throws when not given a Future as first argument', function (){
    var f = function (){ return race(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return race(of(1), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (a, b){ return race(b, a) });

});

describe('Future#race()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return of(1).race.call(null, of(1)) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a Future', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, function (x){ return x }];
    var fs = xs.map(function (x){ return function (){ return of(1).race(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns other when called on a Never', function (){
    var m = after(10, 1);
    expect(never.race(m)).to.equal(m);
  });

  testInstance(function (a, b){ return a.race(b) });

});
