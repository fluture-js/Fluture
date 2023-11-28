import {call} from './internal/utils.js';
import {createTransformation, Resolve, application1, application, func, future} from './future.js';

export var CoalesceTransformation = createTransformation(2, 'coalesce', {
  rejected: function CoalesceTransformation$rejected(x){
    return new Resolve(this.context, call(this.$1, x));
  },
  resolved: function CoalesceTransformation$resolved(x){
    return new Resolve(this.context, call(this.$2, x));
  },
});

export function coalesce(f){
  var context1 = application1(coalesce, func, arguments);
  return function coalesce(g){
    var context2 = application(2, coalesce, func, arguments, context1);
    return function coalesce(m){
      var context3 = application(3, coalesce, future, arguments, context2);
      return m._transform(new CoalesceTransformation(context3, f, g));
    };
  };
}
