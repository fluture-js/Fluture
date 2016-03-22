'use strict';

const Future = require('..');

module.exports = {

  resolved: Future.of,
  rejected: Future.reject,

  deferred: () => {

    let rejected = false, resolved = false, val;
    const que = [];

    function drainQue(state){
      for(let i = 0; i < que.length; i++){
        que[i][state](val);
        que[i] = undefined;
      }
    }

    const m = Future((rej, res) => {
      rejected ? rej(val) : resolved ? res(val) : que.push({rej, res})
    });

    return {
      promise: m,
      reject: e => rejected || resolved || (rejected = true, val = e, drainQue('rej')),
      resolve: v => rejected || resolved || (resolved = true, val = v, drainQue('res'))
    }

  }

};
