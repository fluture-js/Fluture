import {AndTransformation} from './and.js';
import {
  application,
  application1,
  createTransformation,
  future,
  Reject,
  Resolve,
} from './future.js';

export var LastlyTransformation = createTransformation(1, 'lastly', {
  rejected: function LastlyAction$rejected(x){
    return this.$1._transform(new AndTransformation(this.context, new Reject(this.context, x)));
  },
  resolved: function LastlyAction$resolved(x){
    return this.$1._transform(new AndTransformation(this.context, new Resolve(this.context, x)));
  },
});

export function lastly(cleanup){
  var context1 = application1(lastly, future, arguments);
  return function lastly(program){
    var context2 = application(2, lastly, future, arguments, context1);
    return program._transform(new LastlyTransformation(context2, cleanup));
  };
}
