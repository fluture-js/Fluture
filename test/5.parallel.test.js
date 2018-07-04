import {expect} from 'chai';
import {Future, parallel, of, reject, after} from '../index.mjs.js';
import * as U from './util';
import * as F from './futures';
import type from 'sanctuary-type-identifiers';

describe('parallel()', function (){

  it('is a curried binary function', function (){
    expect(parallel).to.be.a('function');
    expect(parallel.length).to.equal(2);
    expect(parallel(1)).to.be.a('function');
  });

  it('throws when given something other than PositiveInteger as a first argument', function (){
    var xs = [0, -1, 1.5, NaN, '1', 'one'];
    var fs = xs.map(function (x){ return function (){ return parallel(x)([]) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('throws when given something other than Array as second argument', function (){
    var xs = [NaN, {}, 1, 'a', new Date, undefined, null, F.resolved];
    var fs = xs.map(function (x){ return function (){ return parallel(1)(x) } });
    fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
  });

  it('returns an instance of Future', function (){
    expect(parallel(1, [])).to.be.an.instanceof(Future);
  });

});

describe('Parallel', function (){

  it('extends Future', function (){
    expect(parallel(1, [])).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', function (){
    expect(type(parallel(1, []))).to.equal(Future['@@type']);
  });

  describe('#_interpret()', function (){

    it('crashes when one of the Futures crash', function (){
      return U.assertCrashed(parallel(2, [F.resolved, F.crashed]), U.error);
    });

    it('crashes when one of the Futures crash', function (){
      return U.assertCrashed(parallel(2, [F.resolved, F.resolved, F.resolved, F.resolved, F.resolved, F.crashed]), U.error);
    });

    it('throws when the Array contains something other than Futures', function (){
      var xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      var fs = xs.map(function (x){ return function (){ return parallel(1, [x])._interpret(U.noop, U.noop, U.noop) } });
      fs.forEach(function (f){ return expect(f).to.throw(TypeError, /Future/) });
    });

    it('parallelizes execution', function (){
      this.timeout(70);
      var actual = parallel(5, [
        after(20, 'a'),
        after(20, 'b'),
        after(20, 'c'),
        after(20, 'd'),
        after(20, 'e')
      ]);
      return U.assertResolved(actual, ['a', 'b', 'c', 'd', 'e']);
    });

    it('limits parallelism to the given number', function (){
      var running = 0;
      var m = Future(function (rej, res){
        running++;
        if(running > 2){ return void rej(new Error('More than two running in parallel')) }
        return void setTimeout(function (){
          running--;
          res('a');
        }, 20);
      });
      var actual = parallel(2, U.repeat(8, m));
      return U.assertResolved(actual, U.repeat(8, 'a'));
    });

    it('runs all in parallel when given number larger than the array length', function (){
      this.timeout(70);
      var actual = parallel(10, [
        after(20, 'a'),
        after(20, 'b'),
        after(20, 'c'),
        after(20, 'd'),
        after(20, 'e')
      ]);
      return U.assertResolved(actual, ['a', 'b', 'c', 'd', 'e']);
    });

    it('can deal with synchronously resolving futures', function (done){
      parallel(5, U.repeat(10, of(1)))._interpret(done, U.failRej, function (xs){
        expect(xs).to.have.length(10);
        done();
      });
    });

    it('interprets the synchronous futures in the provided sequence', function (done){
      var ns = Array.from({length: 10}, function (_, i){ return i });
      var xs = [];
      var ms = ns.map(function (i){
        return Future(function (rej, res){
          xs.push(i);
          res(i);
        });
      });
      parallel(5, ms)._interpret(done, U.noop, function (out){
        expect(out).to.deep.equal(ns);
        expect(xs).to.deep.equal(ns);
        done();
      });
    });

    it('interprets the asynchronous futures in the provided sequence', function (done){
      var ns = Array.from({length: 10}, function (_, i){ return i });
      var xs = [];
      var ms = ns.map(function (i){
        return Future(function (rej, res){
          xs.push(i);
          setTimeout(res, 10, i);
        });
      });
      parallel(5, ms)._interpret(done, U.noop, function (out){
        expect(out).to.deep.equal(ns);
        expect(xs).to.deep.equal(ns);
        done();
      });
    });

    it('resolves to an empty array when given an empty array', function (){
      return U.assertResolved(parallel(1, []), []);
    });

    it('runs all in parallel when given Infinity', function (){
      this.timeout(70);
      var actual = parallel(Infinity, [
        after(20, 'a'),
        after(20, 'b'),
        after(20, 'c'),
        after(20, 'd'),
        after(20, 'e')
      ]);
      return U.assertResolved(actual, ['a', 'b', 'c', 'd', 'e']);
    });

    it('rejects if one of the input rejects', function (){
      var actual = parallel(2, [F.resolved, reject('err')]);
      return U.assertRejected(actual, 'err');
    });

    it('does not reject multiple times', function (done){
      var actual = parallel(2, [F.rejectedSlow, F.rejected]);
      actual._interpret(done, function (){ return done() }, U.failRes);
    });

    it('cancels Futures when cancelled', function (done){
      var m = Future(function (){ return function (){ return done() } });
      var cancel = parallel(1, [m])._interpret(done, U.noop, U.noop);
      setTimeout(cancel, 20);
    });

    it('cancels only running Futures when cancelled', function (done){
      var i = 0, j = 0;
      var m = Future(function (rej, res){
        var x = setTimeout(function (x){j += 1; res(x)}, 20, 1);

        return function (){
          i += 1;
          clearTimeout(x);
        };
      });
      var cancel = parallel(2, [m, m, m, m])._interpret(done, U.failRej, U.failRes);
      setTimeout(function (){
        cancel();
        expect(i).to.equal(2);
        expect(j).to.equal(2);
        done();
      }, 30);
    });

    it('does not interpret any computations after one rejects', function (done){
      var m = Future(function (){ done(U.error) });
      parallel(2, [F.rejected, m])._interpret(done, U.noop, U.failRes);
      done();
    });

    it('automatically cancels running computations when one rejects', function (done){
      var m = Future(function (){ return function (){ done() } });
      parallel(2, [m, F.rejected])._interpret(done, U.noop, U.failRes);
    });

    it('does not cancel settled computations (#123)', function (done){
      var m1 = Object.create(F.mock);
      var m2 = Object.create(F.mock);

      m1._interpret = function (_, rej, res){
        setTimeout(res, 10, 1);
        return function (){ return done(U.error) };
      };

      m2._interpret = function (_, rej){
        setTimeout(rej, 20, 2);
        return function (){ return done(U.error) };
      };

      parallel(2, [m1, m2])._interpret(done, U.noop, U.noop);
      setTimeout(done, 50, null);
    });

    it('does not resolve after being cancelled', function (done){
      var cancel = parallel(1, [F.resolvedSlow, F.resolvedSlow])
      ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
      setTimeout(done, 50);
    });

    it('does not reject after being cancelled', function (done){
      var cancel = parallel(1, [F.rejectedSlow, F.rejectedSlow])
      ._interpret(done, U.failRej, U.failRes);
      setTimeout(cancel, 10);
      setTimeout(done, 50);
    });

    it('is stack safe (#130)', function (done){
      var ms = Array.from({length: U.STACKSIZE}, function (_, i){ return of(i) });
      parallel(1, ms)._interpret(done, U.failRej, function (xs){
        expect(xs).to.have.length(U.STACKSIZE);
        done();
      });
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Parallel', function (){
      var m = parallel(Infinity, [of(1), of(2)]);
      var s = 'Future.parallel(2, [Future.of(1), Future.of(2)])';
      expect(m.toString()).to.equal(s);
    });

  });

});
