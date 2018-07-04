import {expect} from 'chai';
import {Future, Par, seq, of, reject, never, ap, map, alt} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import Z from 'sanctuary-type-classes';

describe('alt()', function (){

  it('is a curried binary function', function (){
    expect(alt).to.be.a('function');
    expect(alt.length).to.equal(2);
    expect(alt(Par.of(1))).to.be.a('function');
  });

  it('throws when not given a Function as first argument', function (){
    var f = function (){ return alt(1) };
    expect(f).to.throw(TypeError, /alt.*first/);
  });

  it('throws when not given a Future as second argument', function (){
    var f = function (){ return alt(Par.of(1), 1) };
    expect(f).to.throw(TypeError, /alt.*second/);
  });

});

describe('Par()', function (){

  it('is a unary function', function (){
    expect(Par).to.be.a('function');
    expect(Par.length).to.equal(1);
  });

  it('throws when not given a Future', function (){
    var f = function (){ return Par(1) };
    expect(f).to.throw(TypeError, /Future/);
  });

  describe('.of()', function (){

    var of = Z.of;

    it('resolves with the value', function (){
      var m = of(Par, 1);
      return U.assertResolved(seq(m), 1);
    });

  });

  describe('.zero()', function (){

    var zero = Z.zero;

    it('creates a never-ending ConcurrentFuture', function (){
      var m = zero(Par);
      expect(seq(m)).to.equal(never);
    });

  });

  describe('#ap()', function (){

    var mf = of(U.bang);

    it('throws TypeError when the Future does not resolve to a Function', function (){
      var m = seq(ap(Par(of(1)), Par(F.resolved)));
      return U.assertCrashed(m, new TypeError(
        'Future#ap expects its first argument to be a Future of a Function\n' +
        '  Actual: Future.of(1)'
      ));
    });

    it('calls the function contained in the given Future to its contained value', function (){
      var actual = ap(Par(mf), Par(F.resolved));
      return U.assertResolved(seq(actual), 'resolved!');
    });

    it('rejects if one of the two reject', function (){
      var left = ap(Par(mf), Par(F.rejected));
      var right = ap(Par(F.rejected), Par(F.resolved));
      return Promise.all([
        U.assertRejected(seq(left), 'rejected'),
        U.assertRejected(seq(right), 'rejected')
      ]);
    });

    it('does not matter if either resolves late', function (){
      var left = ap(Par(mf), Par(F.resolvedSlow));
      var right = ap(Par(F.resolvedSlow.and(mf)), Par(F.resolved));
      return Promise.all([
        U.assertResolved(seq(left), 'resolvedSlow!'),
        U.assertResolved(seq(right), 'resolved!')
      ]);
    });

    it('cannot reject twice', function (){
      var actual = ap(Par(F.rejected), Par(F.rejected));
      return U.assertRejected(seq(actual), 'rejected');
    });

    it('interprets in parallel', function (){
      this.slow(40);
      this.timeout(30);
      var actual = ap(Par(F.resolvedSlow.and(mf)), Par(F.resolvedSlow));
      return U.assertResolved(seq(actual), 'resolvedSlow!');
    });

    it('creates a cancel function which cancels both Futures', function (done){
      var cancelled = false;
      var m = Par(Future(function (){ return function (){ return (cancelled ? done() : (cancelled = true)) } }));
      var cancel = seq(ap(m, m))._interpret(done, U.noop, U.noop);
      cancel();
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = ap(Par(of(1)), Par(reject(0)));
      var s = 'ConcurrentFuture(Future.of(1)._parallelAp(Future.reject(0)))';
      expect(m.toString()).to.equal(s);
    });

  });

  describe('#map()', function (){

    it('applies the given function to its inner', function (){
      var actual = map(U.add(1), Par(of(1)));
      return U.assertResolved(seq(actual), 2);
    });

    it('does not map rejected state', function (){
      var actual = map(function (){ return 'mapped' }, Par(F.rejected));
      return U.assertRejected(seq(actual), 'rejected');
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = map(U.noop, Par(F.resolved));
      var expected = 'ConcurrentFuture(Future.of("resolved").map(' + (U.noop.toString()) + '))';
      expect(m.toString()).to.equal(expected);
    });

  });

  describe('#alt', function (){

    it('rejects when the first one rejects', function (){
      var m1 = Par(Future(function (rej, res){ return void setTimeout(res, 50, 1) }));
      var m2 = Par(Future(function (rej){ return void setTimeout(rej, 5, U.error) }));
      return U.assertRejected(seq(alt(m1, m2)), U.error);
    });

    it('resolves when the first one resolves', function (){
      var m1 = Par(Future(function (rej, res){ return void setTimeout(res, 5, 1) }));
      var m2 = Par(Future(function (rej){ return void setTimeout(rej, 50, U.error) }));
      return U.assertResolved(seq(alt(m1, m2)), 1);
    });

    it('shows a reasonable representation when cast to string', function (){
      var m = alt(Par(of(2)), Par(of(1)));
      var s = 'ConcurrentFuture(Future.of(1))';
      expect(m.toString()).to.equal(s);
    });

  });

});
