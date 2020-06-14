import show from 'sanctuary-show';
import {assertEqual, I, B, T, K} from '../util/util.js';
import {FutureArb, any as _x, anyFuture as _mx, f, g, _of, elements, property} from '../util/props.js';
import {
  alt,
  and,
  ap,
  bichain,
  bimap,
  cache,
  chain,
  chainRej,
  hook,
  lastly,
  map,
  mapRej,
  reject,
  resolve,
  swap,
} from '../../index.js';

var _f = elements([f, g, I, resolve]);
var _mf = _of(_f);
var _fm = FutureArb(_f, _f).smap(function (m){
  return function (x){
    return bimap(T(x))(T(x))(m);
  };
}, function (f){
  return bimap(K)(K)(f());
}, show);

function eq (x){
  return function (y){
    return assertEqual(x, y);
  };
}

property('alt associativity', _mx, _mx, _mx, function (a, b, c){
  return eq(alt(a)(alt(b)(c)))(alt(alt(a)(b))(c));
});

property('alt distributivity with map', _mx, _mx, function (a, b){
  return eq(map(f)(alt(a)(b)))(alt(map(f)(a))(map(f)(b)));
});

property('and associativity', _mx, _mx, _mx, function (a, b, c){
  return eq(and(a)(and(b)(c)))(and(and(a)(b))(c));
});

property('and distributivity with map', _mx, _mx, function (a, b){
  return eq(map(f)(and(a)(b)))(and(map(f)(a))(map(f)(b)));
});

property('ap composition using map', _mx, _mf, _mf, function (mx, mf, mg){
  return eq(ap(mx)(ap(mf)(map(B)(mg))))(ap(ap(mx)(mf))(mg));
});

property('bichain associativity', _mx, _fm, _fm, function (m, f, g){
  return eq(bichain(g)(g)(bichain(f)(f)(m)))(bichain(B(bichain(g)(g))(f))(B(bichain(g)(g))(f))(m));
});

property('bichain left identity on rejection', _x, _fm, _fm, function (x, f, g){
  return eq(bichain(f)(g)(reject(x)))(f(x));
});

property('bichain left identity on resolution', _x, _fm, _fm, function (x, f, g){
  return eq(bichain(f)(g)(resolve(x)))(g(x));
});

property('bichain right identity', _mx, function (m){
  return eq(bichain(reject)(resolve)(m))(m);
});

property('bimap identity', _mx, function (mx){
  return eq(bimap(I)(I)(mx))(mx);
});

property('bimap composition', _mx, _f, _f, _f, _f, function (mx, f, g, h, i){
  return eq(bimap(B(f)(g))(B(h)(i))(mx))(bimap(f)(h)(bimap(g)(i)(mx)));
});

property('cache idempotence', _mx, function (m){
  return eq(cache(cache(m)))(cache(m));
});

property('chain associativity', _mx, _fm, _fm, function (m, f, g){
  return eq(chain(g)(chain(f)(m)))(chain(B(chain(g))(f))(m));
});

property('chain left identity', _x, _fm, function (x, f){
  return eq(chain(f)(resolve(x)))(f(x));
});

property('chain right identity', _mx, function (m){
  return eq(chain(resolve)(m))(m);
});

property('chainRej associativity', _mx, _fm, _fm, function (m, f, g){
  return eq(chainRej(g)(chainRej(f)(m)))(chainRej(B(chainRej(g))(f))(m));
});

property('chainRej left identity', _x, _fm, function (x, f){
  return eq(chainRej(f)(reject(x)))(f(x));
});

property('chainRej right identity', _mx, function (m){
  return eq(chainRej(reject)(m))(m);
});

property('hook identity', _mx, function (m){
  return eq(hook(m)(resolve)(resolve))(m);
});

property('lastly associativity', _mx, _mx, _mx, function (a, b, c){
  return eq(lastly(a)(lastly(b)(c)))(lastly(lastly(a)(b))(c));
});

property('lastly distributivity with map', _mx, _mx, function (a, b){
  return eq(map(f)(lastly(a)(b)))(lastly(map(f)(a))(map(f)(b)));
});

property('map identity', _mx, function (m){
  return eq(map(I)(m))(m);
});

property('map composition', _mx, _f, _f, function (m, f, g){
  return eq(map(B(f)(g))(m))(map(f)(map(g)(m)));
});

property('mapRej identity', _mx, function (m){
  return eq(mapRej(I)(m))(m);
});

property('mapRej composition', _mx, _f, _f, function (m, f, g){
  return eq(mapRej(B(f)(g))(m))(mapRej(f)(mapRej(g)(m)));
});

property('resolve identity for ap', _mx, function (mx){
  return eq(ap(mx)(resolve(I)))(mx);
});

property('resolve homomorphism with ap', _x, function (x){
  return eq(ap(resolve(x))(resolve(f)))(resolve(f(x)));
});

property('resolve interchange with ap', _x, _mf, function (x, mf){
  return eq(ap(resolve(x))(mf))(ap(mf)(resolve(T(x))));
});

property('swap self inverse', _mx, function (m){
  return eq(swap(swap(m)))(m);
});
