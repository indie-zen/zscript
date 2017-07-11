// @flow
export const types = require('./types.js');
export const objToString = require('./printer.js').objToString;
export const core = require('./core.js');
export const slurp = core.slurp;
export const compiler = require('./compiler.js');

declare type SubscriptionListener = (newValue: any, details: { oldValue: any, childEnv: Environment, event: any}) => any;

import { add_globals, Environment } from './env.js';

// import {
//   newEnv,
//   setEnv,
//   getEnv,
//   Environment
// }
// from './env.js';

export { Environment };

/**
 * Context presents a nice facade around the strange mix of procedural and
 * object oriented design of the rest of ZScript;
 * 
 * You should probably use Context instead of directly using other portions of
 * ZScript because I believe the Context API is a lot easier to use and more
 * stable (and eventually the old API will be deprecated)
 */
export class Context {
  $env : Environment;
  // TODO What is valueSinks
  //$valueSinks : Map<;

  constructor(env : ?Environment) {
    let model;
    if (env && env.$model) {
      model = env.$model;
    }
    this.$env = new Environment(model);
    compiler.add_globals(this.$env);
    //this.$valueSinks = new Map();
  }

  getEnv() : Environment {
    return this.$env;
    // env = env || this.$env;
    // if (env.constructor.name === 'EnvironmentModel') {
    //   env = new Environment(env);
    // }
    // if (env.constructor.name !== 'Environment') {
    //   throw new Error(`Context.getEnv called with invalid type ${env.constructor.name}`);
    // }
    // return env;
  }

  $getEnvModel(env : ?Environment | Object) : EnvironmentModel {
    env = env || this.getEnv();
    // If a wrapper is used, get the environment model
    if (env.constructor.name === "Environment") {
      env = env.$model;
    }
    return env;
  }
  
  /**
   * Get a value from the environment using either a symbol or a symbol name.
   *
   * Will not return a GraphNode; use getNode instead of get
   * 
   * @param {Symbol|string} key used to identify the index into the environment
   * @return {any}
   */
  get(key : string) {
    let value = this.getEnv().get(key);
    if(value.constructor.name === 'GraphNode') {
      return value.$model;
    } else {
      return value;
    }
  }

  /**
   * Get a value from the environment using either a symbol or a symbol name.
   *
   * Will not return a GraphNode; use getNode instead of get
   * 
   * @param {Symbol|string} key used to identify the index into the environment
   * @return {any}
   */
  getNode(key : string) {
    let value = this.getEnv().get(key);
    if(value.constructor.name === 'GraphNode') {
      return value;
    } else {
      // TODO How to handle this?
      throw new Error(`${key} does not indicate a GraphNode`);
    }
  }

  /**
   * Load a ZScript using a string.
   * 
   * @param {string} scriptString zscript in a string
   * @param {Environment} env optional environment to use for symbols; 
   *  if not specified then use the global environment for this context.
   */
  loadScript(scriptString : string, env : ?Environment) {
    env = env || this.getEnv();
    var tokens = compiler.reader.tokenize(scriptString);
    while (!tokens.isDone()) {
      var ast = compiler.reader.readNextExpression(tokens);
      compiler.compileScript(ast, env);
    }
  }

  /**
   * Load an external ZScript using a package / filename.
   * 
   * @param {string} symbol that is to be used to store the exported symbols
   * @param {string} fileName file name or package name to load
   * @param {Environment} env optional environment to use for symbols; 
   *  if not specified then use the global environment for this context.
   */
  require(symbol : string, fileName : string, env : ?Environment) {
    env = env || this.getEnv();
    fileName = core.find_package(fileName);
    let loadEnv = new Environment();
    // compiler.add_globals(loadEnv);
    compiler.loadFile(fileName, loadEnv);
    env.set(Symbol.for(symbol), loadEnv);
  }

  /**
   * Publish a value to the specified symbol.
   * 
   * @param {string} symbol used to identify the publisher.
   * @param {any} optional value to be published initially
   * @returns {GraphNode} GraphNode that can be used to publish new values
   */
  publishValue(symbol : string, initialValue : any) {
    return this.def(symbol).publish(initialValue);
  }

  /**
   * Define a new GraphNode identified by th specified symbol within the specified environment 
   * (or the global environment if the environment isn't specified)
   * 
   * @param {string|symbol} symbol - symbol used to identify the new ndoe.
   * @param {Environment} optional env - environment where the symbol is stored.
   */
  def(symbol : string | Symbol, env : ?Environment) {
    env = env || this.getEnv();
    var node = new compiler.graph.GraphNode();
    env.set(symbol, node);
    return node;
  }

  // evaluate(node, args, env) {
  //   if (typeof node === 'string') {
  //     node = this.getNode(node);
  //   }
  //   return node.evaluate(this.$getEnvModel(), args);
  // }

  /**
   * Evaluate a script string.
   * 
   * @param {string} scriptString - string to be compiled and evaluated
   * @param {Environment} optional env; if not specified then the global
   * environment for this Context is used.  This environment is not modified.
   * A new environment is returned with the modifications, if any.
   * @return {Array} First entry in the array is an array of results from 
   * evaluating the script string.  The second array is the environment
   * used during the evaluation, including any modifications.
   **/
  evaluate(scriptString : string, defaultEnv : Environment | null) : [Array<mixed>, Environment] {
    var childEnv : Environment = new Environment(this.$getEnvModel(defaultEnv)),
      scripts = compiler.compileString(scriptString, childEnv),
      responses = [];
      
    scripts.map((script) => {
      responses.push(script.evaluate(childEnv, []));
    });
    return [responses, new Environment(childEnv)];
  }

  /**
   * Subscribe to a script.
   * 
   * Instead of executing a script once, this function sets up a subscription
   * to a script with a callback that gets executed any time the results of 
   * the script changes.
   * 
   * Expect at least one callback during the initial evaluation of the script, 
   * which is the initial results of the script execution.
   * 
   * @param {string} scriptString - string to be compiled and evaluated
   * 
   * @param {function} listener that gets called when the script results change.
   *  function(newValue, details) where details are 
   *    {
   *        oldValue, // previous value
   *        childEnv, // child environment where the script is executing
   *        event     // event that caused this result to change
   *    }
   * 
   * @param {Environment} optional defaultEnv - environent within which the 
   * script is executed.  As with ```evaluate()```, this environment is not 
   * directly modified, and instead a new child environment is used.
   */
  subscribe(scriptString : string, 
    listener : SubscriptionListener, 
    defaultEnv : ?Environment) {
      
    var childEnv : Environment = new Environment(this.$getEnvModel(defaultEnv)),
      scripts = compiler.compileString(scriptString, childEnv),
      responses = [];
    scripts.map((script) => {
      // Script must be a node here (we can take out this assert after testing)
      if(script.constructor.name !== 'GraphNode') {
        throw new Error(`GraphNode.subscribe cannot subscribe to ${script.constructor.name}`);
      }
      script.subscribe(listener, childEnv);
    });
  }
}
