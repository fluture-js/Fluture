import {
  any,
  application,
  application1,
  createInterpreter,
  never,
  positiveInteger,
} from './future.js';

export var RejectAfter =
createInterpreter(2, 'rejectAfter', function RejectAfter$interpret(rec, rej){
  var id = setTimeout(rej, this.$1, this.$2);
  return function RejectAfter$cancel(){ clearTimeout(id) };
});

RejectAfter.prototype.extractLeft = function RejectAfter$extractLeft(){
  return [this.$2];
};

function alwaysNever(_){
  return never;
}

export function rejectAfter(time){
  var context1 = application1(rejectAfter, positiveInteger, arguments);
  return time === Infinity ? alwaysNever : (function rejectAfter(value){
    var context2 = application(2, rejectAfter, any, arguments, context1);
    return new RejectAfter(context2, time, value);
  });
}
