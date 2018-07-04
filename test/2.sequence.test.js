import {Future, of, never, after} from '../index.mjs.js';
import {expect} from 'chai';
import {add, bang, noop, error, assertResolved, assertRejected, assertCrashed} from './util';
import {resolved, rejected, resolvedSlow} from './futures';
import {Sequence, Core} from '../src/core';
import {StateT} from 'fantasy-states';

describe('Sequence', function (){

  var dummy = new Sequence(resolved);
  var rejectedDummy = new Sequence(rejected);
  var throwing = function (){ throw error };

  describe('ap', function (){

    var seq = of(bang).ap(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        var expected = 'Future.of(' + bang.toString() + ').ap(Future.of("resolved"))';
        expect(seq.toString()).to.equal(expected);
      });

    });

  });

  describe('map', function (){

    var seq = dummy.map(bang);

    describe('#_interpret()', function (){

      it('crashes if the mapper throws', function (){
        return assertCrashed(dummy.map(throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").map(' + bang.toString() + ')');
      });

    });

  });

  describe('bimap', function (){

    var seq = dummy.bimap(add(1), bang);

    describe('#_interpret()', function (){

      it('crashes if the left mapper throws', function (){
        return assertCrashed(rejectedDummy.bimap(throwing, noop), error);
      });

      it('crashes if the right mapper throws', function (){
        return assertCrashed(dummy.bimap(noop, throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").bimap(' + add(1).toString() + ', ' + bang.toString() + ')');
      });

    });

  });

  describe('chain', function (){

    var seq = dummy.chain(function (x){ return of(bang(x)) });

    describe('#_interpret()', function (){

      it('crashes if the mapper throws', function (){
        return assertCrashed(dummy.chain(throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").chain(function (x){ return of(bang(x)) })');
      });

    });

  });

  describe('mapRej', function (){

    var seq = dummy.mapRej(add(1));

    describe('#_interpret()', function (){

      it('crashes if the mapper throws', function (){
        return assertCrashed(rejectedDummy.mapRej(throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").mapRej(' + add(1).toString() + ')');
      });

    });

  });

  describe('chainRej', function (){

    var seq = dummy.chainRej(function (){ return of(1) });

    describe('#_interpret()', function (){

      it('crashes if the mapper throws', function (){
        return assertCrashed(rejectedDummy.chainRej(throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").chainRej(function (){ return of(1) })');
      });

    });

  });

  describe('race', function (){

    var seq = dummy.race(dummy);

    it('returns itself when racing Never', function (){
      expect(dummy.race(never)).to.equal(dummy);
    });

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").race(Future.of("resolved"))');
      });

    });

  });

  describe('_parallelAp', function (){

    var seq = of(bang)._parallelAp(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved!');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        var expected = 'Future.of(' + bang.toString() + ')._parallelAp(Future.of("resolved"))';
        expect(seq.toString()).to.equal(expected);
      });

    });

  });

  describe('both', function (){

    var seq = dummy.both(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, ['resolved', 'resolved']);
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").both(Future.of("resolved"))');
      });

    });

  });

  describe('and', function (){

    var seq = dummy.and(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").and(Future.of("resolved"))');
      });

    });

  });

  describe('or', function (){

    var seq = dummy.or(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").or(Future.of("resolved"))');
      });

    });

  });

  describe('swap', function (){

    var seq = dummy.swap();
    var nseq = new Sequence(rejected).swap();

    describe('#_interpret()', function (){

      it('swaps from right to left', function (){
        return assertRejected(seq, 'resolved');
      });

      it('swaps from left to right', function (){
        return assertResolved(nseq, 'rejected');
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").swap()');
      });

    });

  });

  describe('fold', function (){

    var seq = dummy.fold(function (){ return 0 }, function (){ return 1 });

    describe('#_interpret()', function (){

      it('crashes if the left mapper throws', function (){
        return assertCrashed(rejectedDummy.fold(throwing, noop), error);
      });

      it('crashes if the right mapper throws', function (){
        return assertCrashed(dummy.fold(noop, throwing), error);
      });

      it('runs the action', function (){
        return assertResolved(seq, 1);
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").fold(function (){ return 0 }, function (){ return 1 })');
      });

    });

  });

  describe('finally', function (){

    var seq = dummy.finally(dummy);

    describe('#_interpret()', function (){

      it('runs the action', function (){
        return assertResolved(seq, 'resolved');
      });

      it('runs the other if the left rejects', function (done){
        var other = Future(function (){done()});
        var m = new Sequence(rejected).finally(other);
        m._interpret(done, noop, noop);
      });

    });

    describe('#toString()', function (){

      it('returns code to create the same data-structure', function (){
        expect(seq.toString()).to.equal('Future.of("resolved").finally(Future.of("resolved"))');
      });

    });

  });

  describe('in general', function (){

    describe('#_interpret()', function (){

      it('is capable of joining', function (){
        var m = new Sequence(of('a'))
        //eslint-disable-next-line max-nested-callbacks
        .chain(function (x){ return after(5, (x + 'b')).chain(function (x){ return after(5, (x + 'c')) }) })
        .chain(function (x){ return after(5, (x + 'd')) })
        .chain(function (x){ return of((x + 'e')) })
        .chain(function (x){ return after(5, (x + 'f')) });
        return assertResolved(m, 'abcdef');
      });

      it('is capable of early termination', function (done){
        var slow = new Sequence(Future(function (){
          var id = setTimeout(done, 20, new Error('Not terminated'));
          return function (){ return clearTimeout(id) };
        }));
        var m = slow.race(slow).race(slow).race(slow).race(resolved);
        m._interpret(done, noop, noop);
        setTimeout(done, 40, null);
      });

      it('cancels running actions when one early-terminates asynchronously', function (done){
        var slow = new Sequence(Future(function (){
          var id = setTimeout(done, 50, new Error('Not terminated'));
          return function (){ return clearTimeout(id) };
        }));
        var m = slow.race(slow).race(slow).race(slow).race(resolvedSlow);
        m._interpret(done, noop, noop);
        setTimeout(done, 100, null);
      });

      it('does not run actions unnecessarily when one early-terminates synchronously', function (done){
        var broken = new Sequence(Future(function (){ done(error) }));
        var m = resolvedSlow.race(broken).race(broken).race(resolved);
        m._interpret(done, noop, function (){ return done() });
      });

      it('resolves the left-hand side first when running actions in parallel', function (){
        var m = new Sequence(of(1)).map(function (x){ return x }).chain(function (x){ return of(x) });
        return assertResolved(m.race(of(2)), 1);
      });

      it('does not forget about actions to run after early termination', function (){
        var m = new Sequence(after(30, 'a'))
                  .race(new Sequence(after(20, 'b')))
                  .map(function (x){ return (x + 'c') });
        return assertResolved(m, 'bc');
      });

      it('does not run early terminating actions twice, or cancel them', function (done){
        var mock = Object.create(Core);
        mock._interpret = function (_, l, r){ return r(done()) || (function (){ return done(error) }) };
        var m = new Sequence(after(30, 'a')).map(function (x){ return (x + 'b') }).race(mock);
        m._interpret(done, noop, noop);
      });

      it('does not run concurrent computations twice', function (done){
        var ran = false;
        var mock = Future(function (){ ran ? done(error) : (ran = true) });
        var m = new Sequence(resolvedSlow).chain(function (){ return resolvedSlow }).race(mock);
        m._interpret(done, done, function (){ return done() });
      });

      it('returns a cancel function which cancels all running actions', function (done){
        var i = 0;
        var started = function (){ return void i++ };
        var cancelled = function (){ return --i < 1 && done() };
        var slow = Future(function (){ return started() || (function (){ return cancelled() }) });
        var m = slow.race(slow).race(slow).race(slow).race(slow);
        var cancel = m._interpret(done, noop, noop);
        expect(i).to.equal(5);
        cancel();
      });

    });

  });

  describe('Bug 2017-06-02, reported by @d3vilroot', function (){

    var Middleware = StateT(Future);
    var slow = Middleware.lift(after(10, null));
    var program = slow.chain(function (){ return slow.chain(function (){ return slow }) }).evalState(null);

    it('does not occur', function (done){
      program._interpret(done, done, function (){ return done() });
    });

  });

});
