'use strict';

const expect = require('chai').expect;
const Future = require('../fluture');
const jsc = require('jsverify');
const S = require('sanctuary');

const noop = () => {};
const add = a => b => a + b;
const error = new Error('It broke');

const repeat = (n, x) => {
  const out = new Array(n);
  while(n-- > 0){
    out[n] = x;
  }
  return out;
};

const failRes = x => {
  throw new Error(`Invalidly entered resolution branch with value ${x}`);
};

const failRej = x => {
  throw new Error(`Invalidly entered rejection branch with value ${x}`);
};

const assertIsFuture = x => expect(x).to.be.an.instanceof(Future);

const assertEqual = (a, b) => new Promise(done => {
  if(!(a instanceof Future && b instanceof Future)) return done(false);
  a.fork(failRej, a => b.fork(failRej, b => {
    expect(a).to.equal(b);
    done(true);
  }));
});

const assertResolved = (m, x) => new Promise(done => {
  assertIsFuture(m);
  m.fork(failRej, y => (expect(y).to.deep.equal(x), done()));
});

const assertRejected = (m, x) => new Promise(done => {
  assertIsFuture(m);
  m.fork(y => (expect(y).to.deep.equal(x), done()), failRes);
});

describe('Constructors', () => {

  describe('Future', () => {

    it('is a unary function', () => {
      expect(Future).to.be.a('function');
      expect(Future.length).to.equal(1);
    });

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future when given a function', () => {
      const actual = Future(noop);
      expect(actual).to.be.an.instanceof(Future);
    });

    it('can be called with "new", for those feeling particularly OO', () => {
      const actual = new Future(noop);
      expect(actual).to.be.an.instanceof(Future);
    });

    it('instances are considered members of Future through @@type', () => {
      const m = Future(noop);
      expect(S.type(m)).to.equal('fluture/Future');
      expect(S.is(Future, m)).to.equal(true);
    });

    describe('error message', () => {

      it('takes it easy with the recursive data structures', () => {
        const data = {foo: 'bar'};
        data.data = data;
        const f = () => Future(data);
        expect(f).to.throw(TypeError, /Future/);
      });

      it('displays nested named functions by their name', () => {
        function nyerk(){}
        const data = {foo: nyerk};
        const f = () => Future(data);
        expect(f).to.throw(TypeError, /\[Function: nyerk\]/);
      });

      it('displays nested anonymous functions', () => {
        const data = {foo: () => {}};
        const f = () => Future(data);
        expect(f).to.throw(TypeError, /\[Function\]/);
      });

      it('displays nested arrays', () => {
        const data = {foo: ['a', 'b', 'c']};
        const f = () => Future(data);
        expect(f).to.throw(TypeError, /\[Array: 3\]/);
      });

    });

  });

  describe('.of()', () => {

    it('returns an instance of Future', () => {
      expect(Future.of(1)).to.be.an.instanceof(Future);
    });

    it('treats the value as inner', () => {
      const m = Future.of(1);
      return assertResolved(m, 1);
    });

  });

  describe('.reject()', () => {

    it('returns an instance of Future', () => {
      expect(Future.reject(1)).to.be.an.instanceof(Future);
    });

    it('treats the value as inner', () => {
      const m = Future.reject(1);
      return assertRejected(m, 1);
    });

  });

  describe('.cast()', () => {

    it('throws TypeError when not given a Forkable', () => {
      const xs = [null, {}, {fork: a => a}];
      const fs = xs.map(x => () => Future.cast(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('rejects if the Forkable calls the left', () => {
      const forkable = {fork: (l, r) => (r, l(error))};
      return assertRejected(Future.cast(forkable), error);
    });

    it('resolves if the Forkable calls the right', () => {
      const forkable = {fork: (l, r) => r(1)};
      return assertResolved(Future.cast(forkable), 1);
    });

  });

  describe('.encase()', () => {

    it('is curried', () => {
      expect(Future.encase(noop)).to.be.a('function');
    });

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.encase(x)(1));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which resolves with the return value of the function', () => {
      const actual = Future.encase(x => x + 1)(1);
      return assertResolved(actual, 2);
    });

    it('returns a Future which rejects with the exception thrown by the function', () => {
      const actual = Future.encase(() => {
        throw error;
      })(1);
      return assertRejected(actual, error);
    });

    it('does not swallow errors from subsequent maps and such', () => {
      const f = () =>
        Future.of(1).chain(Future.encase(x => x))
        .map(() => { throw error }).fork(noop, noop)
      expect(f).to.throw(error);
    });

  });

  describe('.encase2()', () => {

    it('is curried', () => {
      expect(Future.encase2((a, b) => b)).to.be.a('function');
      expect(Future.encase2((a, b) => b)(1)).to.be.a('function');
    });

    it('throws TypeError when not given a binary function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, noop, a => a];
      const fs = xs.map(x => () => Future.encase2(x)(1)(2));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which resolves with the return value of the function', () => {
      const actual = Future.encase2((x, y) => x + y + 1)(1)(2);
      return assertResolved(actual, 4);
    });

    it('returns a Future which rejects with the exception thrown by the function', () => {
      const actual = Future.encase2((a, b) => {
        throw (b, error);
      })(1)(2);
      return assertRejected(actual, error);
    });

    it('does not swallow errors from subsequent maps and such', () => {
      const f = () =>
        Future.of(1).chain(Future.encase2((y, x) => x)(1))
        .map(() => { throw error }).fork(noop, noop)
      expect(f).to.throw(error);
    });

  });

  describe('.encase3()', () => {

    it('is curried', () => {
      expect(Future.encase3((a, b, c) => c)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c)(1)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c, 1)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c)(1)(2)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c, 1)(2)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c)(1, 2)).to.be.a('function');
      expect(Future.encase3((a, b, c) => c, 1, 2)).to.be.a('function');
    });

    it('throws TypeError when not given a ternary function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, noop, a => a, (a, b) => b];
      const fs = xs.map(x => () => Future.encase3(x)(1)(2)(3));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which resolves with the return value of the function', () => {
      const actual = Future.encase3((x, y, z) => x + y + z + 1)(1)(2)(3);
      return assertResolved(actual, 7);
    });

    it('returns a Future which rejects with the exception thrown by the function', () => {
      const actual = Future.encase3((a, b, c) => {
        throw (c, error);
      })(1)(2)(3);
      return assertRejected(actual, error);
    });

    it('does not swallow errors from subsequent maps and such', () => {
      const f = () =>
        Future.of(1).chain(Future.encase3((z, y, x) => x)(1)(2))
        .map(() => { throw error }).fork(noop, noop)
      expect(f).to.throw(error);
    });

  });

  describe('.try()', () => {

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.try(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which resolves with the return value of the function', () => {
      const actual = Future.try(() => 1);
      return assertResolved(actual, 1);
    });

    it('returns a Future which rejects with the exception thrown by the function', () => {
      const actual = Future.try(() => {
        throw error;
      });
      return assertRejected(actual, error);
    });

  });

  describe('.node()', () => {

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.node(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which rejects when the callback is called with (err)', () => {
      const f = done => done(error);
      return assertRejected(Future.node(f), error);
    });

    it('returns a Future which resolves when the callback is called with (null, a)', () => {
      const f = done => done(null, 'a');
      return assertResolved(Future.node(f), 'a');
    });

  });

  describe('.after()', () => {

    it('is curried', () => {
      expect(Future.after(20)).to.be.a('function');
    });

    it('throws TypeError when not given a number as first argument', () => {
      const xs = [{}, [], 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.after(x)(1));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which eventually resolves with the given value', () => {
      const actual = Future.after(20)(1);
      return assertResolved(actual, 1);
    });

  });

  describe('.parallel()', () => {

    it('is curried', () => {
      expect(Future.parallel(1)).to.be.a('function');
    });

    it('throws when given something other than PositiveInteger as a first argument', () => {
      const xs = [0, -1, 1.5, NaN, '1', 'one'];
      const fs = xs.map(x => () => Future.parallel(x)([]));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws when given something other than Array as second argument', () => {
      const xs = [NaN, {}, 1, 'a', new Date, undefined, null, Future.of(1)];
      const fs = xs.map(x => () => Future.parallel(1)(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws when the Array contains something other than Futures', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.parallel(1)([x]).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('parallelizes execution', function(){
      this.slow(80);
      this.timeout(50);
      const actual = Future.parallel(2)([Future.after(35, 'a'), Future.after(35, 'b')]);
      return assertResolved(actual, ['a', 'b']);
    });

    it('limits parallelism to the given number', () => {
      let running = 0;
      const m = Future((rej, res) => {
        running++;
        if(running > 2){
          return rej(new Error('More than two running in parallel'));
        }
        setTimeout(() => {
          running--;
          res('a');
        }, 20);
      });
      const actual = Future.parallel(2)(repeat(8, m));
      return assertResolved(actual, repeat(8, 'a'));
    });

    it('runs all in parallel when given number larger than the array length', function(){
      this.slow(80);
      this.timeout(50);
      const actual = Future.parallel(10)([Future.after(35, 'a'), Future.after(35, 'b')]);
      return assertResolved(actual, ['a', 'b']);
    });

    it('resolves to an empty array when given an empty array', () => {
      return assertResolved(Future.parallel(1)([]), []);
    });

    it('runs all in parallel when given Infinity', function(){
      this.slow(80);
      this.timeout(50);
      const actual = Future.parallel(Infinity)([Future.after(35, 'a'), Future.after(35, 'b')]);
      return assertResolved(actual, ['a', 'b']);
    });

    it('rejects if one of the input rejects', () => {
      const actual = Future.parallel(2, [Future.of(1), Future.reject('err')]);
      return assertRejected(actual, 'err');
    });

  });

});

describe('Future', () => {

  describe('#fork()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).fork.call(null, noop, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when first argument is not a function', () => {
      const m = Future.of(1);
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => m.fork(x, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when second argument is not a function', () => {
      const m = Future.of(1);
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => m.fork(noop, x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('does not throw when both arguments are functions', () => {
      const m = Future.of(1);
      const f = () => m.fork(noop, noop);
      expect(f).to.not.throw(TypeError);
    });

    it('passes rejection value to first argument', () => {
      const m = Future.reject(1);
      m.fork(x => expect(x).to.equal(1), failRes);
    });

    it('passes resolution value to second argument', () => {
      const m = Future.of(1);
      m.fork(failRej, x => expect(x).to.equal(1));
    });

  });

  describe('#chain()', () => {

    const m = Future.of(1);
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).chain.call(null, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function', () => {
      const fs = xs.map(x => () => m.chain(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when the given function does not return Future', () => {
      const fs = xs.map(x => () => m.chain(() => x).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('calls the given function with the inner of the Future', () => {
      m.chain(x => (expect(x).to.equal(1), Future.of(null))).fork(noop, noop);
    });

    it('returns a Future with an inner equal to the returned Future', () => {
      const actual = m.chain(() => Future.of(2));
      return assertResolved(actual, 2);
    });

  });

  describe('#chainRej()', () => {

    const m = Future.reject(1);
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).chainRej.call(null, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function', () => {
      const fs = xs.map(x => () => m.chainRej(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when the given function does not return Future', () => {
      const fs = xs.map(x => () => m.chainRej(() => x).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('calls the given function with the inner of the Future', () => {
      m.chainRej(x => (expect(x).to.equal(1), Future.of(null))).fork(noop, noop);
    });

    it('returns a Future with an inner equal to the returned Future', () => {
      const actual = m.chainRej(() => Future.of(2));
      return assertResolved(actual, 2);
    });

  });

  describe('#ap()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).ap.call(null, Future.of(1));
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given Future', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, x => x];
      const fs = xs.map(x => () => Future.of(noop).ap(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when not not called on Future<Function>', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(x).ap(Future.of(1)).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('applies its inner to the inner of the other', () => {
      const actual = Future.of(add(1)).ap(Future.of(1));
      return assertResolved(actual, 2);
    });

    it('rejects if one of the two reject', () => {
      const left = Future.reject('err').ap(Future.of(1));
      const right = Future.of(add(1)).ap(Future.reject('err'));
      return Promise.all([
        assertRejected(left, 'err'),
        assertRejected(right, 'err')
      ]);
    });

    it('does not matter if the left resolves late', () => {
      const actual = Future.after(20, add(1)).ap(Future.of(1));
      return assertResolved(actual, 2);
    });

    it('does not matter if the right resolves late', () => {
      const actual = Future.of(add(1)).ap(Future.after(20, 1));
      return assertResolved(actual, 2);
    });

    it('forks in parallel', function(){
      this.slow(80);
      this.timeout(50);
      const actual = Future.after(30, add(1)).ap(Future.after(30, 1));
      return assertResolved(actual, 2);
    });

  });

  describe('#map()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).map.call(null, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(1).map(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('applies the given function to its resolution value', () => {
      const actual = Future.of(1).map(add(1));
      return assertResolved(actual, 2);
    });

  });

  describe('#mapRej()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).mapRej.call(null, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(1).mapRej(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('applies the given function to its rejection value', () => {
      const actual = Future.reject(1).mapRej(add(1));
      return assertRejected(actual, 2);
    });

  });

  describe('#bimap', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).bimap.call(null, noop, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function as first argument', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(1).bimap(x, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when not given a function as second argument', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(1).bimap(noop, x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('applies the first function to the value in the rejection branch', () => {
      const actual = Future.reject(1).bimap(add(1), failRes);
      return assertRejected(actual, 2);
    });

    it('applies the second function to the value in the resolution branch', () => {
      const actual = Future.of(1).bimap(failRej, add(1));
      return assertResolved(actual, 2);
    });

  });

  describe('#toString()', () => {

    it('returns a string representation', () => {
      const actual = Future(x => x).toString();
      expect(actual).to.equal('Future(x => x)');
    });

  });

  describe('#race()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).race.call(null, Future.of(1));
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throw TypeError when not given a Future', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, x => x];
      const fs = xs.map(x => () => Future.of(1).race(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('returns a Future which rejects when the first one rejects', () => {
      const m1 = Future((rej, res) => setTimeout(res, 15, 1));
      const m2 = Future(rej => setTimeout(rej, 5, error));
      return assertRejected(m1.race(m2), error);
    });

    it('returns a Future which resolves when the first one resolves', () => {
      const m1 = Future((rej, res) => setTimeout(res, 5, 1));
      const m2 = Future(rej => setTimeout(rej, 15, error));
      return assertResolved(m1.race(m2), 1);
    });

  });

  describe('#or()', () => {

    const resolved = Future.of('resolved');
    const resolvedSlow = Future.after(20, 'resolvedSlow');
    const rejected = Future.reject('rejected');
    const rejectedSlow = Future(rej => setTimeout(rej, 20, 'rejectedSlow'));

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).or.call(null, Future.of(1));
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throw TypeError when not given a Future', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, x => x];
      const fs = xs.map(x => () => Future.of(1).or(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    describe('(res, res)', () => {

      it('resolves with left if left resolves first', () => {
        return assertResolved(resolved.or(resolvedSlow), 'resolved');
      });

      it('resolves with left if left resolves last', () => {
        return assertResolved(resolvedSlow.or(resolved), 'resolvedSlow');
      });

    });

    describe('(rej, rej)', () => {

      it('rejects with right if right rejects first', () => {
        return assertRejected(rejectedSlow.or(rejected), 'rejected');
      });

      it('rejects with right if right rejects last', () => {
        return assertRejected(rejected.or(rejectedSlow), 'rejectedSlow');
      });

    });

    describe('(rej, res)', () => {

      it('resolves with right if right resolves first', () => {
        return assertResolved(rejectedSlow.or(resolved), 'resolved');
      });

      it('resolves with right if right resolves last', () => {
        return assertResolved(rejected.or(resolvedSlow), 'resolvedSlow');
      });

    });

    describe('(res, rej)', () => {

      it('resolves with left if left resolves first', () => {
        return assertResolved(resolved.or(rejectedSlow), 'resolved');
      });

      it('resolves with left if left resolves last', () => {
        return assertResolved(resolvedSlow.or(rejected), 'resolvedSlow');
      });

    });

  });

  describe('#fold()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).fold.call(null, noop, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when first argument is not a function', () => {
      const m = Future.of(1);
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => m.fold(x, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when second argument is not a function', () => {
      const m = Future.of(1);
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => m.fold(noop, x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('resolves with the transformed rejection value', () => {
      return assertResolved(Future.reject(1).fold(add(1), add(1)), 2);
    });

    it('resolves with the transformed resolution value', () => {
      return assertResolved(Future.of(1).fold(add(1), add(1)), 2);
    });

  });

  describe('#value()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).value.call(null, noop);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.of(1).value(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws when called on a rejected Future', () => {
      const f = () => Future.reject('broken').value(noop);
      expect(f).to.throw(Error, /Future/);
    });

    it('calls the given function with the resolution value', done => {
      Future.of(1).value(x => {
        expect(x).to.equal(1);
        done();
      });
    });

  });

  describe('#promise()', () => {

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).promise.call(null);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('returns a Promise', () => {
      const actual = Future.of(1).promise();
      expect(actual).to.be.an.instanceof(Promise);
    });

    it('resolves if the Future resolves', done => {
      Future.of(1).promise().then(
        x => (expect(x).to.equal(1), done()),
        done
      );
    });

    it('rejects if the Future rejects', done => {
      Future.reject(1).promise().then(
        () => done(new Error('It resolved')),
        x => (expect(x).to.equal(1), done())
      );
    });

  });

  describe('.cache()', () => {

    const onceOrError = f => {
      var called = false;
      return function(){
        if(called) throw new Error(`Function ${f} was called twice`);
        called = true;
        f(...arguments);
      }
    };

    it('throws when invoked out of context', () => {
      const f = () => Future.of(1).cache.call(null);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('returns a Future which resolves with the resolution value of the given Future', () => {
      return assertResolved(Future.of(1).cache(), 1);
    });

    it('returns a Future which rejects with the rejection reason of the given Future', () => {
      return assertRejected(Future.reject(error).cache(), error);
    });

    it('only forks its given Future once', () => {
      const m = Future(onceOrError((rej, res) => res(1))).cache();
      m.fork(noop, noop);
      m.fork(noop, noop);
      return assertResolved(m, 1);
    });

    it('throws an error if the given Future resolves or rejects multiple times', () => {
      const ms = [
        Future((rej, res) => (res(1), res(1))),
        Future((rej, res) => (res(1), rej(2))),
        Future((rej) => (rej(2), rej(2))),
        Future((rej, res) => (rej(2), res(1)))
      ];
      const fs = ms.map(m => () => m.cache().fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(Error, /Future/));
    });

    it('resolves all forks once a delayed resolution happens', () => {
      const m = Future.after(20, 1).cache();
      const a = assertResolved(m, 1);
      const b = assertResolved(m, 1);
      const c = assertResolved(m, 1);
      return Promise.all([a, b, c]);
    });

    it('rejects all forks once a delayed rejection happens', () => {
      const m = Future(rej => setTimeout(rej, 20, error)).cache();
      const a = assertRejected(m, error);
      const b = assertRejected(m, error);
      const c = assertRejected(m, error);
      return Promise.all([a, b, c]);
    });

    it('rejects all new forks after a rejection happened', () => {
      const m = Future.reject('err').cache();
      m.fork(noop, noop);
      return assertRejected(m, 'err');
    });

  });

});

describe('Lawfulness', function(){

  this.slow(200);

  describe('Functor', () => {
    const law = require('fantasy-land/laws/functor');
    Object.keys(law).forEach(k => jsc.property(k, 'number | string', law[k](Future.of)(assertEqual)));
  });

  describe('Bifunctor', () => {
    const of = require('fantasy-land').of;
    const id = x => x;
    const B = f => g => x => f(g(x));
    const law = {
      identity: t => eq => x => eq(t[of](x), t[of](x).bimap(id, id)),
      composition: t => eq => ({value}) => {
        const f1 = add(value);
        const f2 = add(value + '!');
        const f3 = B(f2)(f1);
        return eq(t[of](value).bimap(f3, f3), t[of](value).bimap(f1, f1).bimap(f2, f2));
      }
    };
    Object.keys(law).forEach(k => jsc.property(k, 'number | string', law[k](Future)(assertEqual)));
  });

  describe('Apply', () => {
    const law = require('fantasy-land/laws/apply');
    Object.keys(law).forEach(k => jsc.property(k, 'number | string', law[k](Future)(assertEqual)));
  });

  describe('Applicative', () => {
    const law = require('fantasy-land/laws/applicative');
    Object.keys(law).forEach(k => jsc.property(k, 'number | string', law[k](Future)(assertEqual)));
  });

  describe('Chain', () => {
    const law = require('fantasy-land/laws/chain');
    Object.keys(law).forEach(k => jsc.property(k, 'number | string', law[k](Future)(assertEqual)));
  });

  describe('Monad', () => {
    const law = require('fantasy-land/laws/monad');
    const left = law.leftIdentity(Future)(assertEqual);
    const right = law.rightIdentity(Future)(assertEqual);
    jsc.property('leftIdentity', 'number | string', x => left(Future.of(x)));
    jsc.property('rightIdentity', 'number | string', right);
  });

});

describe('Dispatchers', () => {

  describe('in general', () => {

    it('have custom toString functions', () => {
      expect(Future.promise.toString()).to.equal('function dispatch$promise(m){ m.promise() }');
      expect(Future.value.toString()).to.equal('function dispatch$value(a, m){ m.value(a) }');
      expect(Future.ap.toString()).to.equal('function dispatch$ap(m, a){ m.ap(a) }');
      expect(Future.fork.toString()).to.equal('function dispatch$fork(a, b, m){ m.fork(a, b) }');
    });

    it('have custom inspect functions', () => {
      expect(Future.promise.inspect()).to.equal('[Function: dispatch$promise]');
      expect(Future.value.inspect()).to.equal('[Function: dispatch$value]');
      expect(Future.ap.inspect()).to.equal('[Function: dispatch$ap]');
      expect(Future.fork.inspect()).to.equal('[Function: dispatch$fork]');
    });

    it('have custom toString functions when partially applied', () => {
      const f = function myFunc(){};
      expect(Future.value(f).toString()).to.equal(
        'function dispatch$value(a, m){ m.value(a) }.bind(null, function myFunc(){})'
      );
      expect(Future.fork(f, f).toString()).to.equal(
        'function dispatch$fork(a, b, m){ m.fork(a, b) }'
        + '.bind(null, function myFunc(){}, function myFunc(){})'
      );
    });

    it('have custom inspect functions when partially applied', () => {
      const f = function myFunc(){};
      expect(Future.value(f).inspect()).to.equal('[Function: unaryPartial$unaryDispatch]');
      expect(Future.fork(f, f).inspect()).to.equal('[Function: binaryPartial$binaryDispatch]');
    });

  });

  describe('.map()', () => {

    it('is curried', () => {
      expect(Future.map).to.be.a('function');
      expect(Future.map(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.map(add(1))(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #map', () => {
      return assertResolved(Future.map(add(1))(Future.of(1)), 2);
    });

  });

  describe('.mapRej()', () => {

    it('is curried', () => {
      expect(Future.mapRej).to.be.a('function');
      expect(Future.mapRej(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.mapRej(add(1))(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #mapRej', () => {
      return assertRejected(Future.mapRej(add(1))(Future.reject(1)), 2);
    });

  });

  describe('.bimap()', () => {

    it('is curried', () => {
      expect(Future.bimap).to.be.a('function');
      expect(Future.bimap(noop)).to.be.a('function');
      expect(Future.bimap(noop)(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.bimap(add(1), add(1))(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #bimap', () => {
      return assertResolved(Future.bimap(add(1), add(1))(Future.of(1)), 2);
    });

  });

  describe('.chain()', () => {

    it('is curried', () => {
      expect(Future.chain).to.be.a('function');
      expect(Future.chain(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.chain(noop)(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #chain', () => {
      return assertResolved(Future.chain(x => Future.of(x + 1))(Future.of(1)), 2);
    });

  });

  describe('.chainRej()', () => {

    it('is curried', () => {
      expect(Future.chainRej).to.be.a('function');
      expect(Future.chainRej(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.chainRej(noop)(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #chainRej', () => {
      return assertResolved(Future.chainRej(x => Future.of(x + 1))(Future.reject(1)), 2);
    });

  });

  describe('.ap()', () => {

    it('is curried', () => {
      expect(Future.ap).to.be.a('function');
      expect(Future.ap(Future.of(1))).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.ap(1)(Future.of(noop));
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #ap', () => {
      return assertResolved(Future.ap(Future.of(add(1)))(Future.of(1)), 2);
    });

  });

  describe('.fork()', () => {

    it('is curried', () => {
      expect(Future.fork).to.be.a('function');
      expect(Future.fork(noop)).to.be.a('function');
      expect(Future.fork(noop, noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.fork(noop)(noop)(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #fork', done => {
      Future.fork(done)(done.bind(null, null))(Future.of(1));
    });

  });

  describe('.race()', () => {

    it('is curried', () => {
      expect(Future.race).to.be.a('function');
      expect(Future.race(Future.of(1))).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.race(Future.of(1))(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #race', () => {
      return assertResolved(Future.race(Future.of(1))(Future.of(2)), 2);
    });

  });

  describe('.or()', () => {

    it('is curried', () => {
      expect(Future.or).to.be.a('function');
      expect(Future.or(Future.of(1))).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.or(Future.of(1))(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #or', () => {
      return assertResolved(Future.or(Future.of(1))(Future.of(2)), 2);
    });

    it('allows implementation of `any` in terms of reduce', () => {
      const C = f => (b, a) => f(a, b);
      const any = ms => ms.reduce(C(Future.or), Future.reject('empty list'));
      return Promise.all([
        assertRejected(any([]), 'empty list'),
        assertRejected(any([Future.reject(1)]), 1),
        assertResolved(any([Future.reject(1), Future.of(2)]), 2),
        assertResolved(any([Future.reject(1), Future.after(20, 2), Future.of(3)]), 2)
      ]);
    });

  });

  describe('.fold()', () => {

    it('is curried', () => {
      expect(Future.fold).to.be.a('function');
      expect(Future.fold(noop)).to.be.a('function');
      expect(Future.fold(noop, noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.fold(noop)(noop)(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #fold', () => {
      return assertResolved(Future.fold(add(1))(add(1))(Future.of(1)), 2);
    });

    it('can take (a)(b, c)', () => {
      return assertResolved(Future.fold(add(1))(add(1), Future.of(1)), 2);
    });

  });

  describe('.value()', () => {

    it('is curried', () => {
      expect(Future.value).to.be.a('function');
      expect(Future.value(noop)).to.be.a('function');
    });

    it('throws when not given a Future', () => {
      const f = () => Future.value(noop)(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #value', done => {
      Future.value(x => (expect(x).to.equal(1), done()))(Future.of(1));
    });

  });

  describe('.promise()', () => {

    it('throws when not given a Future', () => {
      const f = () => Future.promise(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #promise', done => {
      Future.promise(Future.of(null)).then(done);
    });

  });

  describe('.cache()', () => {

    it('throws when not given a Future', () => {
      const f = () => Future.cache(1);
      expect(f).to.throw(TypeError, /Future/);
    });

    it('dispatches to #cache', () => {
      return assertResolved(Future.cache(Future.of(1)), 1);
    });

  });

});

describe('Utility functions', () => {

  const {util} = Future;

  describe('.isForkable()', () => {

    const ms = [{fork: (a, b) => ({a, b})}, {fork: (a, b, c) => ({a, b, c})}];
    const xs = [NaN, 1, true, undefined, null, [], {}, {fork: true}, {fork: () => {}}];

    it('returns true when given a Forkable', () => {
      ms.forEach(m => expect(util.isForkable(m)).to.equal(true));
    });

    it('returns false when not given a Forkable', () => {
      xs.forEach(x => expect(util.isForkable(x)).to.equal(false));
    });

  });

  describe('.isFuture()', () => {

    const ms = [Future.of(1), Future.after(10, 1)];
    const xs = [NaN, 1, true, undefined, null, [], {}, {fork: (a, b) => ({a, b})}];

    it('returns true when given a Future', () => {
      ms.forEach(m => expect(util.isFuture(m)).to.equal(true));
    });

    it('returns false when not given a Future', () => {
      xs.forEach(x => expect(util.isFuture(x)).to.equal(false));
    });

  });

  describe('.isFunction()', () => {

    const fs = [() => {}, function(){}, Future];
    const xs = [NaN, 1, true, undefined, null, [], {}];

    it('returns true when given a Function', () => {
      fs.forEach(f => expect(util.isFunction(f)).to.equal(true));
    });

    it('returns false when not given a Function', () => {
      xs.forEach(x => expect(util.isFunction(x)).to.equal(false));
    });

  });

  describe('.isBinary()', () => {

    const fs = [(a, b) => b, (a, b, c) => c];
    const xs = [noop, a => a];

    it('returns true when given a binary Function', () => {
      fs.forEach(f => expect(util.isBinary(f)).to.equal(true));
    });

    it('returns false when not given a binary Function', () => {
      xs.forEach(x => expect(util.isBinary(x)).to.equal(false));
    });

  });

  describe('.isTernary()', () => {

    const fs = [(a, b, c) => c, (a, b, c, d) => d];
    const xs = [noop, a => a, (a, b) => b];

    it('returns true when given a ternary Function', () => {
      fs.forEach(f => expect(util.isTernary(f)).to.equal(true));
    });

    it('returns false when not given a ternary Function', () => {
      xs.forEach(x => expect(util.isTernary(x)).to.equal(false));
    });

  });

  describe('.isPositiveInteger()', () => {

    const is = [1, 2, 99999999999999999999, Infinity];
    const xs = [NaN, 0, -0, -1, -99999999999999999, -Infinity, '1', [], {}];

    it('returns true when given a PositiveInteger', () => {
      is.forEach(i => expect(util.isPositiveInteger(i)).to.equal(true));
    });

    it('returns false when not given a PositiveInteger', () => {
      xs.forEach(x => expect(util.isPositiveInteger(x)).to.equal(false));
    });

  });

  describe('.isObject()', () => {

    function O(){}
    const os = [{}, {foo: 1}, Object.create(null), new O, []];
    const xs = [1, true, NaN, null, undefined, ''];

    it('returns true when given an Object', () => {
      os.forEach(i => expect(util.isObject(i)).to.equal(true));
    });

    it('returns false when not given an Object', () => {
      xs.forEach(x => expect(util.isObject(x)).to.equal(false));
    });

  });

  describe('.isIterator()', () => {

    const is = [{next: () => {}}, {next: x => x}, (function*(){}())];
    const xs = [1, true, NaN, null, undefined, '', {}, {next: 1}];

    it('returns true when given an Iterator', () => {
      is.forEach(i => expect(util.isIterator(i)).to.equal(true));
    });

    it('returns false when not given an Iterator', () => {
      xs.forEach(x => expect(util.isIterator(x)).to.equal(false));
    });

  });

  describe('.isIteration()', () => {

    const is = [{value: 1, done: true}, {value: 2, done: false}, (function*(){}()).next()];
    const xs = [null, '', {}, {done: true}, {value: 1, done: 1}];

    it('returns true when given an Iteration', () => {
      is.forEach(i => expect(util.isIteration(i)).to.equal(true));
    });

    it('returns false when not given an Iteration', () => {
      xs.forEach(x => expect(util.isIteration(x)).to.equal(false));
    });

  });

  describe('.preview()', () => {

    it('represents values as strings', () => {
      const tests = {
        '"foo"': 'foo',
        '[Array: 1]': ['a'],
        '[Function: foo]': function foo(){},
        '[Function]': function(){},
        '[Object: foo, bar]': {foo: 1, bar: 2},
        '1': 1,
        'undefined': undefined};
      Object.keys(tests).forEach(k => expect(util.preview(tests[k])).to.equal(k));
    });

  });

  describe('.show()', () => {

    it('casts values to strings', () => {
      const tests = {
        '"foo"': 'foo',
        '["a"]': ['a'],
        'function foo(){}': function foo(){},
        'function (){}': function(){},
        '{"foo": 1, "bar": 2}': {foo: 1, bar: 2},
        'Hello world': {toString: () => 'Hello world'},
        '1': 1,
        'undefined': undefined};
      Object.keys(tests).forEach(k => expect(util.show(tests[k])).to.equal(k));
    });

    it('casts nested values using preview()', () => {
      const recursive = {x: 1}; recursive.recursive = recursive;
      const array = [{a: 1}, {b: 1}];
      expect(util.show(recursive)).to.equal('{"x": 1, "recursive": [Object: x, recursive]}');
      expect(util.show(array)).to.equal('[[Object: a], [Object: b]]');
    });

  });

  describe('.padf()', () => {

    it('left-pads string representations of functions', () => {
      const f = () => {
        return 42;
      }
      const input = f.toString()
      const inputLines = input.split('\n');
      const actualLines = util.padf('--', input).split('\n');
      expect(actualLines[0]).to.equal(inputLines[0]);
      expect(actualLines[1]).to.equal('--' + inputLines[1]);
      expect(actualLines[2]).to.equal('--' + inputLines[2]);
    });

  });

  describe('.fid()', () => {

    it('returns the name of a function', () => {
      function foo(){}
      expect(util.fid(foo)).to.equal('foo');
    });

    it('returns <anonymous> for unnamed functions', () => {
      expect(util.fid(() => {})).to.equal('<anonymous>');
    });

  });

  describe('.unaryPartial()', () => {

    it('can partially apply binary functions', () => {
      function binary(a, b){ return a + b }
      expect(util.unaryPartial(binary, 1)(1)).to.equal(2);
    });

    it('can partially apply ternary functions', () => {
      function ternary(a, b, c){ return a + b + c }
      expect(util.unaryPartial(ternary, 1)(1, 1)).to.equal(3);
    });

    it('can partially apply quaternary functions', () => {
      function quaternary(a, b, c, d){ return a + b + c + d }
      expect(util.unaryPartial(quaternary, 1)(1, 1, 1)).to.equal(4);
    });

    it('creates custom toString and inspect methods', () => {
      function binary(a, b){ return a + b }
      const partial = util.unaryPartial(binary, 1);
      expect(partial.toString()).to.equal('function binary(a, b){ return a + b }.bind(null, 1)');
      expect(partial.inspect()).to.equal('[Function: unaryPartial$binary]');
    });

  });

  describe('.binaryPartial()', () => {

    it('can partially apply ternary functions', () => {
      function ternary(a, b, c){ return a + b + c }
      expect(util.binaryPartial(ternary, 1, 1)(1)).to.equal(3);
    });

    it('can partially apply quaternary functions', () => {
      function quaternary(a, b, c, d){ return a + b + c + d }
      expect(util.binaryPartial(quaternary, 1, 1)(1, 1)).to.equal(4);
    });

    it('creates custom toString and inspect methods', () => {
      function ternary(a, b, c){ return a + b + c }
      const partial = util.binaryPartial(ternary, 1, 1);
      expect(partial.toString()).to.equal(
        'function ternary(a, b, c){ return a + b + c }.bind(null, 1, 1)'
      );
      expect(partial.inspect()).to.equal('[Function: binaryPartial$ternary]');
    });

  });

  describe('.ternaryPartial()', () => {

    it('can partially apply quaternary functions', () => {
      function quaternary(a, b, c, d){ return a + b + c + d }
      expect(util.ternaryPartial(quaternary, 1, 1, 1)(1)).to.equal(4);
    });

    it('creates custom toString and inspect methods', () => {
      function quaternary(a, b, c, d){ return a + b + c + d }
      const partial = util.ternaryPartial(quaternary, 1, 1, 1);
      expect(partial.toString()).to.equal(
        'function quaternary(a, b, c, d){ return a + b + c + d }.bind(null, 1, 1, 1)'
      );
      expect(partial.inspect()).to.equal('[Function: ternaryPartial$quaternary]');
    });

  });

});

describe('Other', () => {

  describe('.do()', () => {

    it('throws TypeError when not given a function', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () => Future.do(x));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when the given function does not return an interator', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, () => {}, {next: 'hello'}];
      const fs = xs.map(x => () => Future.do(() => x).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when the returned iterator does not return a valid iteration', () => {
      const xs = [null, '', {}, {done: true}, {value: 1, done: 1}];
      const fs = xs.map(x => () => Future.do(() => ({next: () => x})).fork(noop, noop));
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('throws TypeError when the returned iterator produces something other than a Future', () => {
      const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
      const fs = xs.map(x => () =>
        Future.do(() => ({next: () => ({done: false, value: x})})).fork(noop, noop)
      );
      fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
    });

    it('can be used to chain Futures in do-notation', () => {
      const actual = Future.do(function*(){
        const a = yield Future.of(1);
        const b = yield Future.of(2);
        return a + b;
      });
      return Promise.all([
        assertResolved(actual, 3),
        assertResolved(actual, 3)
      ]);
    });

  });

});
