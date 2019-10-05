import bench from 'sanctuary-benchmark';
import * as Future from '../index.js';

const plus1 = x => x + 1;
const repeat = (n, f, x) => Array.from({length: n}).reduce(x => f(x), x);
const Left = x => ({left: true, right: false, value: x});
const Right = x => ({left: false, right: true, value: x});

const config = {leftHeader: 'Promise', rightHeader: 'Fluture'};

const def = f => [
  {defer: true},
  (x, [d]) => f(x).then(() => d.resolve()),
  (x, [d]) => Future.value(() => d.resolve())(f(x))
];

const PromiseInterop = {
  resolve: x => Promise.resolve(x),
  map: f => p => p.then(f),
  chain: f => p => p.then(f),
  coalesce: f => g => p => p.then(g, f),
  race: a => b => Promise.race([a, b]),
  after: n => x => new Promise(res => setTimeout(res, n, x))
};

export default bench(PromiseInterop, Future, config, {

  'resolve': def(
    ({resolve}) => repeat(1000, resolve, 1)
  ),

  'after': def(
    ({after}) => after(10)(1)
  ),

  'map': def(
    ({map, resolve}) => repeat(1000, map(plus1), resolve(1))
  ),

  'coalesce': def(
    ({coalesce, resolve}) => repeat(1000, coalesce(Left)(Right), resolve(1))
  ),

  'chain.sync': def(
    ({chain, resolve}) => repeat(1000, chain(x => resolve(plus1(x))), resolve(1))
  ),

  'chain.async': def(
    ({chain, after}) => repeat(5, chain(x => after(1)(plus1(x))), after(1)(1))
  ),

  'race.sync': def(
    ({race, resolve}) => repeat(1000, race(resolve(2)), resolve(1))
  ),

  'race.async': def(
    ({race, after}) => repeat(5, race(after(1)(2)), after(1)(1))
  ),

});
