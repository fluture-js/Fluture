import {createTransformation, future, application1, application, func} from './future.js';
import {call} from './internal/utils.js';

export var BichainTransformation = createTransformation(2, 'bichain', {
  rejected: function BichainTransformation$rejected(x){ return call(this.$1, x) },
  resolved: function BichainTransformation$resolved(x){ return call(this.$2, x) }
});

export function bichain(f){
  var context1 = application1(bichain, func, arguments);
  return function bichain(g){
    var context2 = application(2, bichain, func, arguments, context1);
    return function bichain(m){
      var context3 = application(3, bichain, future, arguments, context2);
      return m._transform(new BichainTransformation(context3, f, g));
    };
  };
}
