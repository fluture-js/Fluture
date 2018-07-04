import {expect} from 'chai';
import {Future, cache, of, reject, after} from '../index.mjs.js';
import {Cached} from '../src/cache';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

describe('cache()', function (){

  it('throws when not given a Future', function (){
    var f = function (){ return cache(1) };
    expect(f).to.throw(TypeError, /Future/);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(cache(of(1)))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('crashes if the underlying computation crashes', function (){
      return U.assertCrashed(cache(F.crashed), U.error);
    });

    it('resolves with the resolution value of the given Future', function (){
      return U.assertResolved(cache(of(1)), 1);
    });

    it('rejects with the rejection reason of the given Future', function (){
      return U.assertRejected(cache(reject(U.error)), U.error);
    });

    it('only interprets its given Future once', function (){
      var m = cache(Future(U.onceOrError(function (rej, res){ return res(1) })));
      m._interpret(U.noop, U.noop, U.noop);
      m._interpret(U.noop, U.noop, U.noop);
      return U.assertResolved(m, 1);
    });

    it('crashes all consumers once a delayed crash happens', function (){
      var m = cache(F.crashedSlow);
      var a = U.assertCrashed(m, U.error);
      var b = U.assertCrashed(m, U.error);
      var c = U.assertCrashed(m, U.error);
      return Promise.all([a, b, c]);
    });

    it('resolves all consumers once a delayed resolution happens', function (){
      var m = cache(after(20, 1));
      var a = U.assertResolved(m, 1);
      var b = U.assertResolved(m, 1);
      var c = U.assertResolved(m, 1);
      return Promise.all([a, b, c]);
    });

    it('rejects all consumers once a delayed rejection happens', function (){
      var m = cache(Future(function (rej){ return void setTimeout(rej, 20, U.error) }));
      var a = U.assertRejected(m, U.error);
      var b = U.assertRejected(m, U.error);
      var c = U.assertRejected(m, U.error);
      return Promise.all([a, b, c]);
    });

    it('crashes all new consumers after a crash happened', function (){
      var m = cache(F.crashed);
      m._interpret(U.noop, U.noop, U.noop);
      return U.assertCrashed(m, U.error);
    });

    it('rejects all new consumers after a rejection happened', function (){
      var m = cache(reject('err'));
      m._interpret(U.noop, U.noop, U.noop);
      return U.assertRejected(m, 'err');
    });

    it('it interprets the internal Future again when interpreted after having been cancelled', function (done){
      var m = cache(Future(function (rej, res){
        var o = {cancelled: false};
        var id = setTimeout(res, 20, o);
        return function (){ return (o.cancelled = true, clearTimeout(id)) };
      }));
      var clear = m._interpret(done, U.noop, U.noop);
      setTimeout(function (){
        clear();
        m._interpret(done, U.noop, function (v){ return (expect(v).to.have.property('cancelled', false), done()) });
      }, 10);
    });

    it('does not reset when one of multiple listeners is cancelled', function (done){
      var m = cache(Future(function (rej, res){
        setTimeout(res, 5, 1);
        return function (){ return done(new Error('Reset happened')) };
      }));
      var cancel = m._interpret(done, U.noop, U.noop);
      m._interpret(done, U.noop, U.noop);
      cancel();
      setTimeout(done, 20);
    });

    it('does not change when cancelled after settled', function (done){
      var m = cache(Future(function (rej, res){
        res(1);
        return function (){ return done(new Error('Cancelled after settled')) };
      }));
      var cancel = m._interpret(done, U.noop, U.noop);
      setTimeout(function (){
        cancel();
        done();
      }, 5);
    });

  });

  describe('#crash()', function (){

    it('sets state to Crashed', function (){
      var m = cache(Future(U.noop));
      m.crash(1);
      expect(m._state).to.equal(Cached.Crashed);
    });

    it('does nothing when state is resolved', function (){
      var m = cache(Future(U.noop));
      m.resolve(1);
      m.crash(2);
      expect(m._state).to.equal(Cached.Resolved);
    });

  });

  describe('#resolve()', function (){

    it('does nothing when state is rejected', function (){
      var m = cache(Future(U.noop));
      m.reject(1);
      m.resolve(2);
      expect(m._state).to.equal(Cached.Rejected);
    });

  });

  describe('#reject()', function (){

    it('does nothing when state is resolved', function (){
      var m = cache(Future(U.noop));
      m.resolve(1);
      m.reject(2);
      expect(m._state).to.equal(Cached.Resolved);
    });

  });

  describe('#_addToQueue()', function (){

    it('does nothing when state is settled', function (){
      var m = cache(Future(U.noop));
      m.resolve(1);
      m._addToQueue(U.noop, U.noop);
      expect(m._queued).to.equal(0);
    });

  });

  describe('#_drainQueue()', function (){

    it('is idempotent', function (){
      var m = cache(of(1));
      m._drainQueue();
      m._drainQueue();
      m._interpret(U.noop, U.noop, U.noop);
      m._drainQueue();
      m._drainQueue();
    });

  });

  describe('#run()', function (){

    it('is idempotent', function (){
      var m = cache(of(1));
      m.run();
      m.run();
    });

  });

  describe('#reset()', function (){

    it('is idempotent', function (){
      var m = cache(of(1));
      m.reset();
      m._interpret(U.noop, U.noop, U.noop);
      m.reset();
      m.reset();
    });

    it('cancels the underlying computation', function (done){
      var m = cache(Future(function (){ return function (){ done() } }));
      m.run();
      m.reset();
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Cached', function (){
      var m = cache(of(1));
      var s = 'Future.cache(Future.of(1))';
      expect(m.toString()).to.equal(s);
    });

  });

  describe('#extractLeft()', function (){

    it('returns empty array for cold Cacheds', function (){
      expect(cache(reject(1)).extractLeft()).to.deep.equal([]);
    });

    it('returns array with reason for rejected Cacheds', function (){
      var m = cache(reject(1));
      m.run();
      expect(m.extractLeft()).to.deep.equal([1]);
    });

  });

  describe('#extractRight()', function (){

    it('returns empty array for cold Cacheds', function (){
      expect(cache(of(1)).extractRight()).to.deep.equal([]);
    });

    it('returns array with value for resolved Cacheds', function (){
      var m = cache(of(1));
      m.run();
      expect(m.extractRight()).to.deep.equal([1]);
    });

  });

});
