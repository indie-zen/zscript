// @flow
export const ScriptEvaluator = require('./evaluator').ScriptEvaluator;

import { Environment } from './env.js';

let $performanceWarned = false;

function performanceWarning() {
  if (!$performanceWarned) {
    console.log('WARNING!!! GraphNode.evaluate isDirty flag usage is not optimal');
  }
  $performanceWarned = true;
}

/**
 * ZScript interpreter language node
 */
export class GraphNode {
  $env : Environment;
  $model : any;
  $subscribers : Set<any>;
  $isDirty : boolean;
  $oldValue : any;
  
  constructor(model : any, env : Environment) {
    // If the model isn't defined then this is probably a raw EventSink.
    // // Make sure the model is not undefine / null
    // if(!model) {
    //   throw new Error('Error constructing language node without a model.');
    // }

    // The model we're wrapping; generally some sort of language element
    // created by FunctionService.
    this.$model = model;
    this.$env = env;
    this.$subscribers = new Set();

    this.$isDirty = true;

    // TODO Handle for all intrinsic types
    if (typeof model === 'number') {
      this.$oldValue = model;
    }

    // Do we need publishers?
    // this.$publishers = new Set();
  }

  getModel() : any {
    return this.$model;
  }

  /*
   * @param {function} listener that gets called when the script results change.
   *  function(newValue, details) where details are 
   *    {
   *        oldValue, // previous value
   *        childEnv, // child environment where the script is executing
   *        event     // event that caused this result to change
   *    }
   * @param {EnvironmentModel} env
   * @param {list} args list of arguments coming from a FunctionCall
   */
  subscribe(node : GraphNode, env : Environment, args : Array<any>) {
    this.$subscribers.add(node);

    // TODO Keep this as the current environment?
    this.$env = env;

    if (this.$model) {
      if (typeof this.$model === 'symbol') {
        this.$model = getEnv(env, this.$model);
      }
      switch (typeof this.$model) {
        case 'number':
          // Don't subscribe to constants; they can only be changed by 
          // a direct manipulation of this node.
          break;
        default:
          // TODO Subsribe to elements in an Array
          // args is only needed by a FunctionDefinition (I think)
          this.$model.subscribe(this, env, args);
          // this.$publishers.add(this.$model);
          break;
      }
    }
  }

  set(value : any) {
    this.$model = value;
    this.$oldValue = value;
    this.setDirty();
  }

  evaluate(env : Environment, args : ?Array<any>) {
    // TODO distinguish between evaluating a subscription vs a procedure
    // subscriptions should set isDirty = false, but procedures ignore
    // isDirty (or fix the memoization)
    performanceWarning();
    this.$isDirty = true;

    if (this.$isDirty) {
      // Don't re-evaluate

      // TODO distinguish between evaluating a subscription vs a procedure
      // subscriptions should set isDirty = false, but procedures ignore
      // isDirty (or fix the memoization)
      this.$isDirty = true;

      let evaluator = new ScriptEvaluator(env);
      this.$oldValue = evaluator.evalCompiledScript(this.$model, args);
    }

    return this.$oldValue;
  }

  /**
   * Notify subscribers that this value represented by this GraphNode 
   * has changed.
   */
  notify(details : any) {
    var that = this;

    that.$subscribers.forEach((subscriber) => {
      if (subscriber.constructor.name === 'GraphNode') {
        subscriber.notify(details);
      }
      else {
        // Save the old value because evaluate is going to change it
        var oldValue = that.$oldValue;

        // Evaluate
        // TODO Is this the correct environment?
        // TODO Push this outside of the forEach loop so that evaluate() is
        // lazily called once.
        var newValue = that.evaluate(that.$env);

        // If the value changed, notify the subscriber
        if (newValue !== oldValue) {
          var newDetails = {
            oldValue,
            childEnv: that.$env,
            // TODO Support event
            // event: details.event
          };

          subscriber(newValue, newDetails);
        }
      }

      that.$oldValue = newValue;
    });
  }

  publish(value : any, details : any) {
    // TODO Make sure not overwriting a model that is an AST
    if (this.$oldValue !== value) {
      this.$oldValue = value;
      this.$model = value;
      
      // Deep dirty 
      this.setDirty(this);
      
      // Notify need for publication
      this.notify(details);
    }
    return this;
  }

  /**
   * Mark this GraphNode and all of it's subscribers as dirty so that evaluate
   * will re-evaluate.
   */
  setDirty(notifier : any) {
    // If already marked dirty, don't bother doing it again.
    if (this.$isDirty) {
      return;
    }
    var that = this;
    that.$isDirty = true;
    that.$subscribers.forEach((subscriber) => {
      if (subscriber.constructor.name === 'GraphNode') {
        subscriber.setDirty(that);
      }
    });
  }

  getSubscribersAsArray() : Array<any> {
    return [...this.$subscribers];
  }
}
