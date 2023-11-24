import {createParallelTransformation, earlyCrash, earlyReject} from './internal/parallel.js';
import {noop} from './internal/utils.js';
import {typeError} from './internal/error.js';
import {isFunction} from './internal/predicates.js';
import {show} from './internal/utils.js';
import {MapTransformation, application1, application, future} from './future.js';

export var ParallelApTransformation =
createParallelTransformation('pap', earlyCrash, earlyReject, noop, {
  resolved: function ParallelApTransformation$resolved(f){
    if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
    throw typeError(
      'pap expects the second Future to resolve to a Function\n' +
      '  Actual: ' + show(f)
    );
  },
});

export function pap(mx){
  var context1 = application1(pap, future, arguments);
  return function pap(mf){
    var context2 = application(2, pap, future, arguments, context1);
    return mf._transform(new ParallelApTransformation(context2, mx));
  };
}
