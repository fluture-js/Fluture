import {noop} from './utils.js';
import {createTransformation, Future, crash, reject, resolve} from '../future.js';

function Eager(future){
  var _this = this;
  _this.rec = noop;
  _this.rej = noop;
  _this.res = noop;
  _this.crashed = false;
  _this.rejected = false;
  _this.resolved = false;
  _this.value = null;
  _this.cancel = future._interpret(function Eager$crash(x){
    _this.value = x;
    _this.crashed = true;
    _this.cancel = noop;
    _this.rec(x);
  }, function Eager$reject(x){
    _this.value = x;
    _this.rejected = true;
    _this.cancel = noop;
    _this.rej(x);
  }, function Eager$resolve(x){
    _this.value = x;
    _this.resolved = true;
    _this.cancel = noop;
    _this.res(x);
  });
}

Eager.prototype = Object.create(Future.prototype);

Eager.prototype._interpret = function Eager$interpret(rec, rej, res){
  if(this.crashed) rec(this.value);
  else if(this.rejected) rej(this.value);
  else if(this.resolved) res(this.value);
  else{
    this.rec = rec;
    this.rej = rej;
    this.res = res;
  }
  return this.cancel;
};

export function earlyCrash(early, x){
  early(crash(x));
}

export function earlyReject(early, x){
  early(reject(x));
}

export function earlyResolve(early, x){
  early(resolve(x));
}

export function createParallelTransformation(name, rec, rej, res, prototype){
  var ParallelTransformation = createTransformation(1, name, Object.assign({
    run: function Parallel$run(early){
      var eager = new Eager(this.$1);
      var transformation = new ParallelTransformation(this.context, eager);
      function Parallel$early(m){ early(m, transformation) }
      transformation.cancel = eager._interpret(
        function Parallel$rec(x){ rec(Parallel$early, x) },
        function Parallel$rej(x){ rej(Parallel$early, x) },
        function Parallel$res(x){ res(Parallel$early, x) }
      );
      return transformation;
    },
  }, prototype));
  return ParallelTransformation;
}
