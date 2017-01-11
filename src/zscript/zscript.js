export const types = require('./types.js');
export const objToString = require('./printer.js').objToString;
export const core = require('./core.js');
export const slurp = core.slurp;
export const compiler = require('./compiler.js');
export const env = require('./env.js');

export class EventSink {
  constructor() {
    this.subscribers = [];
  }
  
  publish(value) {
    
  }
  
  subscribe(subscriber) {
    this.subscribers.push(subscriber);
  }
  
}

/**
 * Context presents a nice facade around the strange mix of procedural and
 * object oriented design of the rest of ZScript;
 * 
 * You should probably use Context instead of directly using other portions of
 * ZScript because I believe the Context API is a lot easier to use and more
 * stable.
 */
export class Context {
  constructor() {
    this.env = env.newEnv();
    this.valueSinks = new Map();
  }

  /**
   * Load a ZScript using a string.
   * 
   * @param {string} scriptString zscript in a string
   * @param {Environment} env optional environment to use for symbols; 
   *  if not specified then use the global environment for this context.
   */
  loadScript(scriptString, env) {
    env = env || this.env;
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
      sink = new EventSink();
      this.valueSinks.set(symbol, sink);
    }

    if (!initialValue === undefined) {
      sink.publish(initialValue);
    }
  }
}
