export const types = require('./types.js');
export const objToString = require('./printer.js').objToString;
export const core = require('./core.js');
export const slurp = core.slurp;
export const compiler = require('./compiler.js');
export const env = require('./env.js');



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
    console.log(`Constructed env ${this.env} with model ${this.env.$model}`);
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
    console.log(`Loading script into ${env}`);
    var tokens = compiler.reader.tokenize(scriptString);
    while (!tokens.isDone()) {
      var ast = compiler.reader.readNextExpression(tokens);
      compiler.compileScript(ast, env);
    }
  }

  /**
   * Publish a value to the specified symbol.
   * 
   * @param {string} symbol used to identify the publisher.
   * @param {any} optional value to be published initially
   * @returns {EventSink} event sink that can be used to publish new values
   */
  publishValue(symbol, initialValue) {
    var sink;
    // If the symbol already exists, publish a new value
    if (this.valueSinks.has(symbol)) {
      sink = this.valueSinks.get(symbol);
    }
    else {
      sink = new compiler.EventSink();
      this.valueSinks.set(symbol, sink);
    }

    if (!initialValue === undefined) {
      sink.publish(initialValue);
    }

    return sink;
  }

  /**
   * Define a new node identified by th specified symbol within the specified environment 
   * (or the global environment if the environment isn't specified)
   * 
   * @param {string|symbol} symbol - symbol used to identify the new ndoe.
   * @param {Environment} optional env - environment where the symbol is stored.
   */
  def(symbol, env) {
    env = this.getEnv(env);
    var node = new compiler.Node();
    env.set(symbol, node);
    return node;
  }

  evaluate(node, args, env) {
    if (typeof node === 'string') {
      node = this.env.get(node);
    }
    return node.evaluate(this.$getEnvModel(), args);
  }

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
    // TODO Possibly env should default to a new child environment
    var childEnv = env.newEnv(this.$getEnvModel(defaultEnv)),
      scripts = compiler.compileString(scriptString, childEnv),
      responses = [];
      
    scripts.map((script) => {
      responses.push(script.evaluate(childEnv, []));
    });
    return [responses, new env.Environment(childEnv)];
  }

  /**
   * Subscribe to the specified sybol
   * 
   * @param {string|symbol|Node} symbol that specifies which node to subscribe, or the
   * node to subscribe.
   * @param {function} listener that gets called when the node specified by the symbol
   * publishes a new value.
   * @param {Environment} optional env - environment where the symbol can be found.
   * If not specified then use the global env in this Context.  Not used if the 
   * first argument to this function is a Node.
   */
  subscribe(symbol, listener, env) {
    var node;
    if (typeof symbol === 'object' && symbol.cconstructor.name === 'Node') {
      node = symbol;
    }
    else {
      node = this.getEnv(env).get(symbol);

      if (node.constructor.name !== 'Node') {
        throw new Error(`Context.subsccribe must specify a Node or a symbol that represents a node; found ${node.constructor.name} instead`);
      }
    }

    return node.subscribe(listener);
  }
}
