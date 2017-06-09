/*eslint no-cond-assign:0, no-constant-condition:0 */

import Denque from 'denque';
import {noop} from './fn';

export default function interpretor(rej, res){

  //This is the primary queue of actions. All actions in here will be "cold",
  //meaning they haven't had the chance yet to run concurrent computations.
  const cold = new Denque(this._actions);

  //This is the secondary queue of actions. All actions in here will be "hot",
  //meaning they have already had a chance to run a concurrent computation.
  const queue = new Denque(this._actions.length);

  //These combined variables define our current state.
  // future  = the future we are currently forking
  // action  = the action to be informed when the future settles
  // cancel  = the cancel function of the current future
  // settled = a boolean indicating whether a new tick should start
  // async   = a boolean indicating whether we are awaiting a result asynchronously
  let future = this._spawn, action, cancel = noop, settled, async, it;

  //This function is called with a future to use in the next tick.
  //Here we "flatten" the actions of another Sequence into our own actions,
  //this is the magic that allows for infinitely stack safe recursion because
  //actions like ChainAction will return a new Sequence.
  //If we settled asynchronously, we call drain() directly to run the next tick.
  function settle(m){
    settled = true;
    future = m;
    if(future && future._spawn){
      for(let i = future._actions.length - 1; i >= 0; i--) cold.unshift(future._actions[i]);
      future = future._spawn;
    }
    if(async) drain();
  }

  //This function serves as a rejection handler for our current future.
  //It will tell the current action that the future rejected, and it will
  //settle the current tick with the action's answer to that.
  function rejected(x){
    settle(action && action.rejected(x));
  }

  //This function serves as a resolution handler for our current future.
  //It will tell the current action that the future resolved, and it will
  //settle the current tick with the action's answer to that.
  function resolved(x){
    settle(action && action.resolved(x));
  }

  //This function is passed into actions when they are "warmed up".
  //If the action decides that it has its result, without the need to await
  //anything else, then it can call this function to force "early termination".
  //When early termination occurs, all actions which were queued prior to the
  //terminator will be skipped. If they were already hot, they will also receive
  //a cancel signal so they can cancel their own concurrent computations, as
  //their results are no longer needed.
  function early(m, terminator){
    cancel();
    cold.clear();
    if(async && action !== terminator){
      action.cancel();
      while((it = queue.shift()) && it !== terminator) it.cancel();
    }
    settle(m);
  }

  //This function serves to kickstart concurrent computations.
  //Takes all actions from the cold queue *back-to-front*, and calls run() on
  //each of them, passing them the "early" function. If any of them settles (by
  //calling early()), we abort. After warming up all actions in the cold queue,
  //we warm up the current action as well.
  function warmupActions(){
    while(it = cold.pop()){
      it = it.run(early);
      if(settled) return;
      queue.unshift(it);
    }
    action = action.run(early);
  }

  //This function represents our main execution loop.
  //When we refer to a "tick", we mean the execution of the body inside the
  //primary while-loop of this function.
  //Every tick follows the following algorithm:
  // 1. We try to take an action from the cold queue, if we fail, go to step 2.
  //      1a. We fork the future.
  //      1b. We warmupActions() if the we haven't settled yet.
  // 2. We try to take an action from the hot queue, if we fail, go to step 3.
  //      2a. We fork the Future, if settles, we continue to the next tick.
  // 3. If we couldn't take actions from either queues, we fork the Future into
  //    the user provided continuations. This is the end of the interpretation.
  // 4. If we did take an action from one of queues, but none of the steps
  //    caused a settle(), it means we are asynchronously waiting for something
  //    to settle and start the next tick, so we return from the function.
  function drain(){
    async = false;
    while(true){
      settled = false;
      if(action = cold.shift()){
        cancel = future._fork(rejected, resolved);
        if(!settled) warmupActions();
      }else if(action = queue.shift()){
        cancel = future._fork(rejected, resolved);
      }else break;
      if(settled) continue;
      async = true;
      return;
    }
    cancel = future._fork(rej, res);
  }

  //Start the execution loop.
  drain();

  //Return a cancellation function. It will cancel the current Future, the
  //current action, and all queued hot actions.
  return function Sequence$cancel(){
    cancel();
    action && action.cancel();
    while(it = queue.shift()) it.cancel();
  };

}
