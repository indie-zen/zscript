const EventSink = require('./event.js').EventSink;

import {
  newEnv,
  setEnv,
  getEnv
}
from './env.js';

/**
 * ZScript interpreter language node
 */
export class GraphNode {
  constructor(model, env) {
    // If the model isn't defined then this is probably a raw EventSink.
    // // Make sure the model is not undefine / null
    // if(!model) {
    //   throw new Error('Error constructing language node without a model.');
    // }


    // The model we're wrapping; generally some sort of language element
    // created by FunctionService.
    this.$model = model;
    this.$env = env;
    this.$event = new EventSink();
    this.$subscribers = new Set();
    
    this.$isDirty = false;
    
    // Do we need publishers?
    this.$publishers = new Set();
  }

  evaluate(env, args) {
    // TODO If $model is a FunctionDefinition (shouldn't it always be?)
    // check to see if the args are dirty / different since the last evaluate,
    // essentially memoizing this evaluation.

    // TODO Handle other class types
    if (this.$model.constructor.name !== 'FunctionDefinition') {
      // Delegate to $model
      return this.$model.evaluate.apply(this.$model, arguments);
    }
    if (this.$model.constructor.name !== 'FunctionCall') {
      // Delegate to $model
      return this.$model.evaluate.apply(this.$model, arguments);
    }

    throw new Error(`Node.evaluate cannot handle ${this.$model.constructor.name}`);
  }

  $buildGraph() {
    // TODO Finish implementing; is this necessary anymore?
    this.$isGraphBuilt = true;
  }

  /*
   * @param {function} listener that gets called when the script results change.
   *  function(newValue, details) where details are 
   *    {
   *        oldValue, // previous value
   *        childEnv, // child environment where the script is executing
   *        event     // event that caused this result to change
   *    }
   */
  subscribe(node, env) {
    this.$subscribers.add(node);
    
    // TODO Keep this as the current environment?
    this.$env = env;

    if (this.$model) {
      if(typeof this.$model === 'symbol') {
        console.log(env);
        this.$model = getEnv(env, this.$model);
      }
      switch(typeof this.$model) {
        case 'number':
          // Don't subscribe to constants; they can only be changed by 
          // a direct manipulation of this node.
          break;
        default:
          console.log(typeof this.$model);
          this.$model.subscribe(this, env);
          this.$publishers.add(this.$model);
          break;
      }
    }
  }

  subscribe_old(scriptString, listener, env) {
    // Delegate to EventSink
    EventSink.prototype.subscribe.apply(this.$event, arguments);

    // If the graph starting at this node has not yet been built, build it.
    if (!this.$isGraphBuilt) {
      this.$buildGraph();
    }

    this.$model.subscribe(listener, env);

    // Handle first execution; find if this node depends on other nodes and
    // see if any of those nodes have values.
    throw new Error('Node.subscribe implementation is incomplete.');
  }

  publish(value, details) {
    var that = this;
    console.log('GraphNode.publish');
    console.log(this.$subscribers);

    that.setDirty();
    that.$isDirty = false;

    that.$subscribers.forEach((subscriber) => {
      // TODO evaluate to determine new value?
      var newValue;
      switch(typeof that.$model) {
        case 'undefined':
        case 'number':
          // TODO ensure that value is also a number
          that.$model = newValue = value;
          break;
        case 'object':
          switch(that.$model.constructor.name) {
            case 'GraphNode':
              console.log(that.$model);
              that.$model.publish(value, details);
              break;
            default:
              console.log(that.$model.constructor.name);
              throw new Error(`What type is this node? ${typeof that.$model}`);
              break;
          }
          break;
        default:
          throw new Error(`What type is this node? ${typeof that.$model}`);
          break;
      }

      var newDetails = {
        oldValue: that.$oldValue,
        childEnv: that.$env,
        // TODO Support event
        // event: details.event
      };

      if (subscriber.constructor.name === 'GraphNode') {
        subscriber.publish(newValue, newDetails);
      } else {
        // Assume the subscriber is a function if it's not a GraphNode.
        subscriber(newValue, newDetails);
      }

      that.$oldValue = newValue;
    });
  }

  setDirty() {
    // If already marked dirty, don't bother doing it again.
    if(this.$isDirty) {
      return;
    }
    var that = this;
    that.$isDirty = true;
    that.$subscribers.forEach((subscriber) => {
      if(subscriber.constructor.name === 'GraphNode') {
        console.log(`Setting ${subscriber.constructor.name} dirty`);
        console.log(subscriber);
        subscriber.setDirty(that);
      }
    });
  }
  
}
