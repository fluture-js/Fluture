import * as R from 'ramda';
import Z from 'sanctuary-type-classes';
import {Future, ap, alt, map, bimap, chain, resolve, reject} from '../../index.js';

import {assertEqual} from '../util/util.js';
import {any, property, FutureArb, string, number, constant, anyFuture, oneof} from '../util/props.js';

function bang (x){
  return x + '!';
}

function compose (f, g){
  return function (x){
    return f(g(x));
  };
}

function square (x){
  return x * x;
}

var stringNumberFuture = FutureArb(string, number);
var stringSquareFuture = FutureArb(string, constant(square));
var make = oneof(constant(resolve), constant(reject));

property('Z.of(Future, x) = resolve(x)', any, function (x){
  return assertEqual(Z.of(Future, x), resolve(x));
});

property('R.ap(mf, mx) = ap(mx)(mf)', stringSquareFuture, stringNumberFuture, function (mf, mx){
  return assertEqual(R.ap(mf, mx), ap(mx)(mf));
});

property('Z.ap(mf, mx) = ap(mx)(mf)', stringSquareFuture, stringNumberFuture, function (mf, mx){
  return assertEqual(Z.ap(mf, mx), ap(mx)(mf));
});

property('Z.alt(a, b) = alt(b)(a)', anyFuture, anyFuture, function (a, b){
  return assertEqual(Z.alt(a, b), alt(b)(a));
});

property('R.map(f, mx) = map(f)(mx)', stringNumberFuture, function (mx){
  return assertEqual(R.map(square, mx), map(square)(mx));
});

property('Z.map(f, mx) = map(f, mx)', stringNumberFuture, function (mx){
  return assertEqual(Z.map(square, mx), map(square)(mx));
});

property('Z.bimap(f, g, mx) = bimap(f)(g)(mx)', stringNumberFuture, function (mx){
  return assertEqual(Z.bimap(bang, square, mx), bimap(bang)(square)(mx));
});

property('R.chain(f, mx) = chain(f)(mx)', make, stringNumberFuture, function (g, mx){
  var f = compose(f, square);
  return assertEqual(R.chain(f, mx), chain(f)(mx));
});

property('Z.chain(f, mx) = chain(f)(mx)', make, stringNumberFuture, function (g, mx){
  var f = compose(f, square);
  return assertEqual(Z.chain(f, mx), chain(f)(mx));
});
