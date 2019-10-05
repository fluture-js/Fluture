import bench from 'sanctuary-benchmark';
import * as Future from '../index.js';
import folktale from 'folktale/concurrency/task/index.js';

const noop = () => {};
const plus1 = x => x + 1;
const repeat = (n, f) => x => Array.from({length: n}).reduce(x => f(x), x);

const map1000 = repeat(1000, Future.map(plus1));
const chain1000 = repeat(1000, Future.chain(plus1));

const createTask = x => folktale.task(resolver => resolver.resolve(x));
const createFuture = x => Future.Future((rej, res) => { res(x); return noop });
const consumeTask = m => m.run().listen({onCancelled: noop, onRejected: noop, onResolved: noop});
const consumeFuture = Future.fork(noop)(noop);

const config = {leftHeader: 'Folktale', rightHeader: 'Fluture'};

const left = {
  create: createTask,
  consume: consumeTask,
  one: createTask(1),
  mapped: map1000(createTask(1))
};

const right = {
  create: createFuture,
  consume: consumeFuture,
  one: createFuture(1),
  mapped: map1000(createFuture(1))
};

export default bench(left, right, config, {

  'create.construct': [
    {}, ({create}) => repeat(1000, create)(1)
  ],

  'create.map': [
    {}, ({one}) => map1000(one)
  ],

  'create.chain': [
    {}, ({one}) => chain1000(one)
  ],

  'consume.noop': [
    {}, ({one, consume}) => consume(one)
  ],

  'consume.map.1': [
    {}, ({one, consume}) => consume(Future.map(plus1)(one))
  ],

  'consume.map.1000': [
    {}, ({mapped, consume}) => consume(mapped)
  ],

  'consume.chain': [
    {}, ({create, consume, one}) => consume(Future.chain(x => create(x + 1))(one))
  ],

});
