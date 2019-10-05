/* global setImmediate */

import bench from 'sanctuary-benchmark';
import Old from 'fluture';
import * as New from '../index.js';

const config = {leftHeader: 'Old', rightHeader: 'New'};

const noop = () => {};
const compose = (f, g) => x => f(g(x));
const run = m => m.constructor.fork(noop)(noop)(m);
const plus1 = x => x + 1;
const arr = (T, length) => Array.from({length}, (_, i) => T.resolve(i));
const fast = (T, x) => T((rej, res) => void setImmediate(res, x));
const slow = (T, x) => T.after(1)(x);

export default bench(Old, New, config, {

  'def.interpreter.Future': [
    {}, ({Future}) => Future((rej, res) => res(1))
  ],

  'def.interpreter.resolve': [
    {}, ({resolve}) => resolve(1)
  ],

  'def.interpreter.reject': [
    {}, ({reject}) => reject(1)
  ],

  'def.interpreter.after': [
    {}, ({after}) => after(1)(1)
  ],

  'def.interpreter.attempt': [
    {}, ({attempt}) => attempt(noop)
  ],

  'def.interpreter.cache': [
    {}, ({resolve, cache}) => cache(resolve(1))
  ],

  'def.interpreter.encase': [
    {}, ({encase}) => encase(noop)(1)
  ],

  'def.interpreter.encaseP': [
    {}, ({encaseP}) => encaseP(noop)(1)
  ],

  'def.interpreter.go': [
    {}, ({go}) => go(noop)
  ],

  'def.interpreter.hook': [
    {}, ({resolve, hook}) => hook(resolve(1))(noop)(noop)
  ],

  'def.interpreter.node': [
    {}, ({node}) => node(done => done(null, 1))
  ],

  'def.interpreter.parallel': [
    {}, ({resolve, parallel}) => parallel(1)([resolve(1)])
  ],

  'def.transformation.map': [
    {}, ({resolve, map}) => map(plus1)(resolve(1))
  ],

  'def.transformation.chain': [
    {}, ({resolve, chain}) => chain(plus1)(resolve(1))
  ],

  'run.interpreter.Future': [
    {}, ({Future}) => run(Future((rej, res) => res(1)))
  ],

  'run.interpreter.parallel.empty': [
    {}, ({parallel}) => run(parallel(1)([]))
  ],

  'run.interpreter.parallel.small.sequential': [
    {}, ({Future, parallel}) => run(parallel(1)(arr(Future, 2)))
  ],

  'run.interpreter.parallel.small.concurrent': [
    {}, ({Future, parallel}) => run(parallel(2)(arr(Future, 2)))
  ],

  'run.interpreter.parallel.big.sequential': [
    {}, ({Future, parallel}) => run(parallel(1)(arr(Future, 100)))
  ],

  'run.interpreter.parallel.big.concurrent': [
    {}, ({Future, parallel}) => run(parallel(2)(arr(Future, 100)))
  ],

  'run.interpreter.go': [
    {}, ({go, resolve}) => run(go(function*(){
      return (yield resolve(1)) + (yield resolve(2));
    }))
  ],

  'run.transformation.sync.map': [
    {}, ({resolve, map}) => run(map(plus1)(resolve(1)))
  ],

  'run.transformation.sync.swap.one': [
    {}, ({resolve, swap}) => run(swap(resolve(42)))
  ],

  'run.transformation.sync.swap.many': [
    {}, ({resolve, swap}) => {
      let m = resolve(1);
      for(let i = 0; i < 1000; i++){ m = swap(m) }
      run(m);
    }
  ],

  'run.transformation.sync.chain.one': [
    {}, ({resolve, chain}) => run(chain(compose(resolve, plus1))(resolve(1)))
  ],

  'run.transformation.sync.chain.many': [
    {}, ({chain, resolve}) => {
      const f = compose(resolve, plus1);
      let m = resolve(1);
      for(let i = 0; i < 1000; i++){ m = chain(f)(m) }
      run(m);
    }
  ],

  'run.transformation.async.map': [
    {defer: true}, ({Future, map, value}, [d]) => {
      map(plus1)(fast(Future, 1)).pipe(value(() => d.resolve()));
    }
  ],

  'run.transformation.async.chain.one': [
    {defer: true}, ({Future, chain, value}, [d]) => {
      chain(x => fast(Future, plus1(x)))(fast(Future, 1))
      .pipe(value(() => d.resolve()));
    }
  ],

  'run.transformation.async.chain.many': [
    {defer: true}, ({Future, chain, value}, [d]) => {
      const f = x => fast(Future, plus1(x));
      let m = fast(Future, 1);
      for(let i = 0; i < 100; i++){ m = chain(f)(m) }
      m.pipe(value(() => d.resolve()));
    }
  ],

  'run.transformation.parallel.async.race.fast-vs-slow': [
    {defer: true}, ({Future, race, value}, [d]) => {
      const a = fast(Future, 1);
      const b = slow(Future, 1);
      race(a)(b).pipe(value(() => d.resolve()));
    }
  ],

  'run.transformation.parallel.async.race.slow-vs-fast': [
    {defer: true}, ({Future, race, value}, [d]) => {
      const a = slow(Future, 1);
      const b = fast(Future, 1);
      race(a)(b).pipe(value(() => d.resolve()));
    }
  ],

  'run.transformation.parallel.async.race.slow-vs-slow': [
    {defer: true}, ({Future, race, value}, [d]) => {
      const a = slow(Future, 1);
      const b = slow(Future, 1);
      race(a)(b).pipe(value(() => d.resolve()));
    }
  ],

});
