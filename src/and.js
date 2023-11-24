import {createTransformation, application1, application, future} from './future.js';

export var AndTransformation = createTransformation(1, 'and', {
  resolved: function AndTransformation$resolved(){ return this.$1 },
});

export function and(left){
  var context1 = application1(and, future, arguments);
  return function and(right){
    var context2 = application(2, and, future, arguments, context1);
    return right._transform(new AndTransformation(context2, left));
  };
}
