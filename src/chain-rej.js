import {call} from './internal/utils.js';
import {createTransformation, application1, application, future, func} from './future.js';

export var ChainRejTransformation = createTransformation(1, 'chainRej', {
  rejected: function ChainRejTransformation$rejected(x){ return call(this.$1, x) },
});

export function chainRej(f){
  var context1 = application1(chainRej, func, arguments);
  return function chainRej(m){
    var context2 = application(2, chainRej, future, arguments, context1);
    return m._transform(new ChainRejTransformation(context2, f));
  };
}
