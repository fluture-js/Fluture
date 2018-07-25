import {isFuture} from '../core';
import {partial1, partial2, partial3} from '../internal/fn';
import {isFunction} from '../internal/is';
import {throwInvalidArgument, throwInvalidFuture} from '../internal/throw';

export function forkCatch(f, g, h, m){
  if(!isFunction(f)) throwInvalidArgument('Future.forkCatch', 0, 'be a function', f);
  if(arguments.length === 1) return partial1(forkCatch, f);
  if(!isFunction(g)) throwInvalidArgument('Future.forkCatch', 1, 'be a function', g);
  if(arguments.length === 2) return partial2(forkCatch, f, g);
  if(!isFunction(h)) throwInvalidArgument('Future.forkCatch', 2, 'be a function', h);
  if(arguments.length === 3) return partial3(forkCatch, f, g, h);
  if(!isFuture(m)) throwInvalidFuture('Future.forkCatch', 3, m);
  return m._interpret(f, g, h);
}
