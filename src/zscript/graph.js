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
    this.$subscribers = new Set();

    this.$isDirty = true;

    // TODO Handle for all intrinsic types
    if (typeof model === 'number') {
      this.$oldValue = model;
    }

    // Do we need publishers?
    // this.$publishers = new Set();
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
      if (typeof this.$model === 'symbol') {
        console.log(env);
        this.$model = getEnv(env, this.$model);
      }
      switch (typeof this.$model) {
        case 'number':
          // Don't subscribe to constants; they can only be changed by 
          // a direct manipulation of this node.
          break;
        default:
          console.log(typeof this.$model);
          this.$model.subscribe(this, env);
          // this.$publishers.add(this.$model);
          break;
      }
    }
  }

  set(value) {
    // TODO Notify subscribers
    this.$model = value;
    this.$oldValue = value;
    this.setDirty();
  }

  evaluate_old(env, args) {
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

  evaluate(env, args) {
    if (this.$isDirty) {
      // Don't re-evaluate
      // TODO distinguish between evaluating a subscription vs a procedure
      // subscriptions should set isDirty = false, but procedures ignore
      // isDirty
      this.$isDirty = true;

      // Evaluate to determine new value?
      switch (typeof this.$model) {
        case 'undefined':
          break;
        case 'number':
          this.$oldValue = this.$model;
          break;
        case 'object':
          switch (this.$model.constructor.name) {
            case 'FunctionCall':
              console.log('GraphNode.FunctionCall evaluation');
              this.$oldValue = this.$model.evaluate(env, args);
              break;
            case 'GraphNode':
              // Why is a GraphNode a model?
              this.$oldValue = this.$model.evaluate(env, args);
              break;
            case 'FunctionDefinition':
              // FunctionDefintion are always dirty
              this.$isDirty = true;
              this.$oldValue = this.$model.evaluate(env, args);
              break;
            default:
              throw new Error(`What type is this model object? ${this.$model.constructor.name}`);
          }
          break;
        case 'symbol':
          console.log('Getting symbol');
          this.$oldValue = getEnv(env, this.$model);
          break;
        default:
          throw new Error(`What type is this model? ${typeof this.$model}`);
      }
    }

    return this.$oldValue;
  }

  notify(details) {
    var that = this;
    console.log('GraphNode.notify');
    console.log(this);

    that.$subscribers.forEach((subscriber) => {
      if (subscriber.constructor.name === 'GraphNode') {
        subscriber.notify(details);
      }
      else {
        // Save the old value because evaluate is going to change it
        var oldValue = that.$oldValue;

        // Evaluate
        // TODO Is this the correct environment?
        var newValue = that.evaluate(that.$env);

        // If the value changed, notify the subscriber
        if (newValue !== oldValue) {
          var newDetails = {
            oldValue,
            childEnv: that.$env,
            // TODO Support event
            // event: details.event
          };

          console.log('Calling callback function');
          subscriber(newValue, newDetails);
        }
      }

      that.$oldValue = newValue;
    });
  }

  publish(value, details) {
    // TODO Make sure not overwriting a model that is an AST

    console.log(`GraphNode.publish ${value}, ${details}`);
    console.log(this);
    if (this.$oldValue !== value) {
      this.$oldValue = value;
      this.$model = value;
      // Deep dirty 
      this.setDirty(this);
      // Notify need for publication
      this.notify(details);
    }
  }

  setDirty(notifier) {
    // If already marked dirty, don't bother doing it again.
    if (this.$isDirty) {
      return;
    }
    var that = this;
    that.$isDirty = true;
    that.$subscribers.forEach((subscriber) => {
      if (subscriber.constructor.name === 'GraphNode') {
        // console.log(`Setting ${subscriber.constructor.name} dirty`);
        // console.log(subscriber);
        subscriber.setDirty(that);
      }
    });

  }

  getSubscribersAsArray() {
    return [...this.$subscribers];
  }
}
