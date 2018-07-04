import {expect} from 'chai';
import {Future, both, of, node} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

var testInstance = function (both){

  it('is considered a member of fluture/Fluture', function (){
    expect(type(both(F.resolved, F.resolvedSlow))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    describe('(Crashed, Resolved)', function (){

      it('crashes if left settles first', function (){
        return U.assertCrashed(both(F.crashed, F.resolvedSlow), new Error(
          'Intentional error for unit testing'
        ));
      });

      it('crashes if left settles last', function (){
        return U.assertCrashed(both(F.crashedSlow, F.resolved), U.error);
      });

    });

    describe('(Crashed, Rejected)', function (){

      it('crashes if left settles first', function (){
        return U.assertCrashed(both(F.crashed, F.rejectedSlow), U.error);
      });

      it('rejects if left settles last', function (){
        return U.assertRejected(both(F.crashedSlow, F.rejected), 'rejected');
      });

    });

    describe('(Resolved, Crashed)', function (){

      it('crashes if left settles first', function (){
        return U.assertCrashed(both(F.resolved, F.crashedSlow), U.error);
      });

      it('crashes if left settles last', function (){
        return U.assertCrashed(both(F.resolvedSlow, F.crashed), U.error);
      });

    });

    describe('(Rejected, Crashed)', function (){

      it('rejects if left settles first', function (){
        return U.assertRejected(both(F.rejected, F.crashedSlow), 'rejected');
      });

      it('crashes if left settles last', function (){
        return U.assertCrashed(both(F.rejectedSlow, F.crashed), U.error);
      });

    });

    describe('(Resolved, Resolved)', function (){

      it('resolves with both if left settles first', function (){
        return U.assertResolved(both(F.resolved, F.resolvedSlow), ['resolved', 'resolvedSlow']);
      });

      it('resolves with both if left settles last', function (){
        return U.assertResolved(both(F.resolvedSlow, F.resolved), ['resolvedSlow', 'resolved']);
      });

    });

    describe('(Rejected, Rejected)', function (){

      it('rejects with right if right rejects first', function (){
        return U.assertRejected(both(F.rejectedSlow, F.rejected), 'rejected');
      });

      it('rejects with left if right rejects last', function (){
        return U.assertRejected(both(F.rejected, F.rejectedSlow), 'rejected');
      });

    });

    describe('(Rejected, Resolved)', function (){

      it('rejects with left if right settles first', function (){
        return U.assertRejected(both(F.rejectedSlow, F.resolved), 'rejectedSlow');
      });

      it('rejects with left if right settles last', function (){
        return U.assertRejected(both(F.rejected, F.resolvedSlow), 'rejected');
      });

    });

    describe('(Resolved, Rejected)', function (){

      it('rejects with right if left settles first', function (){
        return U.assertRejected(both(F.resolved, F.rejectedSlow), 'rejectedSlow');
      });

      it('rejects with right if left settles last', function (){
        return U.assertRejected(both(F.resolvedSlow, F.rejected), 'rejected');
      });

    });

    it('[GH #118] does not call the left computation twice', function (done){
      var called = false;
      var left = node(function (f){ return called ? done(U.error) : setTimeout(f, 20, null, called = true) });
      return both(left, F.resolvedSlow).done(done);
    });

    it('[GH #118] does not call the right computation twice', function (done){
      var called = false;
      var right = node(function (f){ return called ? done(U.error) : setTimeout(f, 20, null, called = true) });
      return both(F.resolvedSlow, right).done(done);
    });

    it('cancels the right if the left rejects', function (done){
      var m = both(F.rejectedSlow, Future(function (){ return function (){ return done() } }));
      m._interpret(done, U.noop, U.noop);
    });

    it('cancels the left if the right rejects', function (done){
      var m = both(Future(function (){ return function (){ return done() } }), F.rejectedSlow);
      m._interpret(done, U.noop, U.noop);
    });

    it('creates a cancel function which cancels both Futures', function (done){
      var cancelled = false;
      var m = Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } });
      var cancel = both(m, m)._interpret(done, U.noop, U.noop);
      cancel();
    });

  });

};

describe('both()', function (){

  it('is a curried binary function', function (){
    expect(both).to.be.a('function');
    expect(both.length).to.equal(2);
    expect(both(of(1))).to.be.a('function');
  });

  it('throws when not given a Future as first argument', function (){
    var f = function (){ return both(1) };
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return both(of(1), 1) };
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance(function (a, b){ return both(a, b) });

});

describe('Future#both()', function (){

  it('throws when invoked out of context', function (){
    var f = function (){ return of(1).both.call(null, of(1)) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a Future', function (){
    var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, function (x){ return x }];
    var fs = xs.map(function (x){ return function (){ return of(1).both(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  testInstance(function (a, b){ return a.both(b) });

});
