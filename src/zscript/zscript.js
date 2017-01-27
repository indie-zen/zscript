export const types = require('./types.js');
export const objToString = require('./printer.js').objToString;
export const core = require('./core.js');
export const slurp = core.slurp;
export const compiler = require('./compiler.js');
export const env = require('./env.js');

import {
  newEnv,
  setEnv,
  getEnv
}
from './env.js';

/**
 * Context presents a nice facade around the strange mix of procedural and
 * object oriented design of the rest of ZScript;
 * 
 * You should probably use Context instead of directly using other portions of
 * ZScript because I believe the Context API is a lot easier to use and more
 * stable.
 */
export class Context {
  constructor(rawEnv) {
    this.env = new env.Environment(rawEnv);
    compiler.add_globals(this.$getEnvModel());
    this.valueSinks = new Map();
  }

  getEnv(env) {
    env = env || this.env;
    if (env.constructor.name === 'EnvironmentModel') {
      env = new env.Environment(env)
    }
    if (env.constructor.name !== 'Environment') {
      throw new Error(`Context.getEnv called with invalid type ${env.constructor.name}`);
    }
    return env;
  }

  $getEnvModel(env) {
    env = env || this.env;
    // If a wrapper is used, get the environment model
    if (env.constructor.name === "Environment") {
      env = env.$model;
    }
    return env;
  }

  /**
   * Load a ZScript using a string.
   * 
   * @param {string} scriptString zscript in a string
   * @param {Environment} env optional environment to use for symbols; 
   *  if not specified then use the global environment for this context.
   */
  loadScript(scriptString, env) {
    env = this.$getEnvModel(env);
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
  require(symbol, fileName, env) {
    env = this.$getEnvModel(env);
    fileName = core.find_package(fileName);
    let loadEnv = newEnv();
    compiler.add_globals(loadEnv);
    compiler.loadFile(fileName, loadEnv);
    setEnv(env, Symbol.for(symbol), loadEnv);
  }

  /**
   * Publish a value to the specified symbol.
   * 
   * @param {string} symbol used to identify the publisher.
   * @param {any} optional value to be published initially
   * @returns {GraphNode} GraphNode that can be used to publish new values
   */
  publishValue(symbol, initialValue) {
    return this.def(symbol).publish(initialValue);
  }

  /**
   * Define a new GraphNode identified by th specified symbol within the specified environment 
   * (or the global environment if the environment isn't specified)
   * 
   * @param {string|symbol} symbol - symbol used to identify the new ndoe.
   * @param {Environment} optional env - environment where the symbol is stored.
   */
  def(symbol, env) {
    env = this.getEnv(env);
    var node = new compiler.graph.GraphNode();
    env.set(symbol, node);
    return node;
  }

  // evaluate(node, args, env) {
  //   if (typeof node === 'string') {
  //     node = this.env.get(node);
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
  evaluate(scriptString, defaultEnv) {
    var childEnv = env.newEnv(this.$getEnvModel(defaultEnv)),
      scripts = compiler.compileString(scriptString, childEnv),
      responses = [];
      
    scripts.map((script) => {
      responses.push(script.evaluate(childEnv, []));
    });
    return [responses, new env.Environment(childEnv)];
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
  subscribe(scriptString, listener, defaultEnv) {
    var childEnv = env.newEnv(this.$getEnvModel(defaultEnv)),
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
