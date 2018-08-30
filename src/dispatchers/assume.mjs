import {isFuture} from '../future';
import {partial1} from '../internal/utils';
import {throwInvalidFuture} from '../internal/throw';

function assume$right(right, left){
  if(!isFuture(left)) throwInvalidFuture('Future.assume', 1, left);
  return left.assume(right);
}

export function assume(right, left){
  if(!isFuture(right)) throwInvalidFuture('Future.assume', 0, right);
  if(arguments.length === 1) return partial1(assume$right, right);
  return assume$right(right, left);
}
