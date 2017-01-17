const core = require('./core.js');
const types = require('./types.js');

export const ScriptEvaluator = require('./evaluator').ScriptEvaluator;
export const reader = require('./reader.js');

require('console-group').install();

import {
  newEnv,
  setEnv,
  getEnv
}
from './env.js';

export const graph = require('./graph.js');

function compileAST(ast, env) {
  const astType = types.getType(ast);
  switch (astType) {
    case 'array':
      // TODO Possibly need to wrap this Array with an AST object
      // functionService.createArray( ... )
      return ast.map((x) => compileScript(x, env));
    case 'vector':
      const array = ast.map((x) => compileScript(x, env));
      return new graph.GraphNode(types._vector(...array));
    default:
      // console.log('Wrapping with a GraphNode');
      // console.log(astType);
      // console.log(ast);
      return new graph.GraphNode(ast);
  }
}

class FunctionService {
  constructor() {
    this.funcs = new Map();
  }

  createFunction(args, body) {
    const newFunc = new FunctionDefinition(args, body);
    return new graph.GraphNode(newFunc);
  }

  createFunctionCall(env, name, ...args) {
    // TODO Need to track this?  Probably, to eventually determine
    // if all calls evaluate to a function that exists.
    const newFuncCall = new FunctionCall(env, name, ...args);
    return new graph.GraphNode(newFuncCall, env);
  }

  createMap(symbol, list) {
    return new MapHandler(symbol, list);
  }

  createDeferredSymbol(env, namespace, symbolFunc) {
    return new DeferredSymbol(env, namespace, symbolFunc);
  }
}

export var functionService = new FunctionService();

export function compileScript(ast, env) {
  while (true) {
    if (types.getType(ast) != 'array') {
      return compileAST(ast, env);
    }

    if (ast.length === 0) {
      return;
    }

    var [a0, a1, a2, ...an] = ast;
    const a0type = types.getType(a0);
    const a0sym = a0type === 'symbol' ? Symbol.keyFor(a0) : Symbol(':default');
    switch (a0sym) {
      // Define a variable
      case 'def':
        var def = compileScript(a2, env);
        env[a1] = def;
        // console.log(`def ${Symbol.keyFor(a1)}`);
        // if (types.getType(def) === 'symbol') {
        //   console.log(Symbol.keyFor(def));
        // }
        // else {
        //   console.log(def);
        // }
        return a1;
        // Define a new function
      case 'func':
        // console.log("Creating a new function");
        // console.log(a1);
        // console.log(a2);
        const body = compileScript(a2, env);
        var newFunc = functionService.createFunction(a1, body);
        // console.log(newFunc);
        return newFunc;
      case 'require':
        // console.log('Loading file');
        // console.log(a2);
        // console.log(an);
        // Find the name of the file (or eventually other package source)
        var fileName = core.find_package(a2);
        var loadEnv = newEnv();
        add_globals(loadEnv);
        loadFile(fileName, loadEnv);
        setEnv(env, a1, loadEnv);
        return null;
      case 'eval':
        var funcCall = compileScript(a1);
        // console.log('Evaluating');
        // console.log(funcCall);
        return null;
      case 'using':
        console.log('Using:');
        switch (types.getType(a2)) {
          case 'symbol':
            var newSymbol = types._symbol(Symbol.keyFor(a1) + "." + Symbol.keyFor(a2));
            console.log(newSymbol);
            return newSymbol;
          case 'vector':
            // TODO Implement a2 as a vector.
            throw new Error("Not implemented 'using' when a2 is a vector");
          default:
            // In this case assuming resolution of the symbol is deferred because
            // of a call to (deref symbol) where symbol is passed as an argument.
            var compiledA2 = compileScript(a2, env);
            var newSymbol = functionService.createDeferredSymbol(env, a1, compiledA2);
            console.log(newSymbol);
            return newSymbol;
        }
      case 'namespace':
        console.log("Creating namespace");
        // Iterate through the symbols in a1 and compile the values
        var symbols = Object.getOwnPropertySymbols(a1);
        symbols.forEach(sym => {
          var newValue = compileScript(a1[sym], env);
          // console.log("Setting namespace value")
          // console.log(sym);
          // console.log(a1[sym]);
          // console.log(newValue);
          a1[sym] = newValue;
          // console.log('-----')
        })
        return a1;
      case 'map':
        // console.log('creating map');
        // console.log(a1);
        // console.log(a2);
        return functionService.createMap(a1, a2);
      default:
        if (types.getType(a0) === "array") {
          var newA0 = compileScript(a0, env);
          // console.log("New a0");
          // console.log(newA0);
          a0 = newA0;
        }
        // console.log("Default compileScript handler");
        const args = Array.from(ast.slice(1),
            value => compileScript(value, env))
          // FIXME compileScript for each of the args
          // I think since the rest of the args aren't compiled then they
          // have to be compiled in evalCompiledScript for arrays.
        return functionService.createFunctionCall(env, a0, ...args);
    }
  }
}

export function loadFile(fileName, env) {
  // TODO Don't re-load a file that's already been loaded.
  var loadedFile = core.slurp(fileName);
  var tokens = reader.tokenize(loadedFile);
  while (!tokens.isDone()) {
    var ast = reader.readNextExpression(tokens);
    compileScript(ast, env);
  }
}

export function compileString(scriptString, env) {
  env = env || newEnv();
  var tokens = reader.tokenize(scriptString),
    scripts = [];

  while (!tokens.isDone()) {
    var ast = reader.readNextExpression(tokens);
    scripts.push(compileScript(ast, env));
  }
  return scripts;
}

// Functions:
//
// FunctionDefinition
// FunctionCall

export class FunctionDefinition {
  constructor(args, body) {
    this.args = args;
    this.body = body;
  }

  evaluate(env, args) {
    // console.group('Evaluating function definition');

    // For now assume a function definition is nothing more than a function call
    // console.log(this.body);
    // console.log(this.args);
    // console.log(args);

    var funcEnv = newEnv(env, this.args, args);

    var results = this.body.evaluate(funcEnv);
    // console.log(results);
    // console.groupEnd();
    return results;
  }

  subscribe(node, env) {
    // TODO Handle arguments
    if(this.args.length !== 0) {
      throw new Error('FunctionDefinition.subscribe cannot handle arguments yet.');
    }
    
    this.$graphNode = node;
    this.body.subscribe(node, env);
    // console.log('FunctionDefinition.subscribe');
    // console.log(this.body);
  }
}

class ScriptResolver {
  constructor(env) {
    this.env = env;
  }

  resolveArray(array) {
    return Array.from(array, this.resolveCompiledScript, this);
  }

  resolveCompiledScript(script) {
    // console.group('in ScriptResolver.resolveCompiledScript');
    // console.log(types.getType(script));
    // console.log(script);
    var results = script;
    switch (types.getType(script)) {
      case 'array':
        // FIXME as with evalCompiledScript, this needs to be fixed
        const [sym, ...args] = script;
        var funcCall = functionService.createFunctionCall(this.env, sym, ...args);
        results = funcCall.resolve(this.env);
        break;
      case 'vector':
        var resolver = new ScriptResolver(this.env);
        results = resolver.resolveArray(script);
        results.__isvector__ = true;
        break;
    }
    // console.groupEnd();
    return results;
  }
}

export class FunctionCall {
  constructor(env, nameOrDef, ...args) {
    if (types.getType(nameOrDef) === 'symbol') {
      this.definition = null;
      this.name = nameOrDef;

      // Environment created during the compile step
      this.env = env;
      // console.log(`Call to function ${Symbol.keyFor(nameOrDef)} with args:`);
    }
    else {
      this.name = types._symbol('<lambda>');
      // console.log('Call to lambda function');
      // console.log(nameOrDef);
      this.definition = nameOrDef;
    }
    this.args = args;
    // console.log(args);
  }
  
  resolve(env) {
    // console.group(`Resolving function call to ${Symbol.keyFor(this.name)}`);
    // console.log('The original args are');
    // console.log(this.args);
    var resolver = new ScriptResolver(env);
    this.args = resolver.resolveArray(this.args);
    // console.groupEnd();
    return this;
  }

  subscribe(node, env) {
    this.$graphNode = node;

    var that = this;
    
    that.args.map((arg) => {
      // console.log('Subscribing to arg');
      // console.log(arg);
      arg.subscribe(node, env);
    });

    // TODO Is this the correct environment?  If it is then it probably shouldn't be
    // private.
    var func = that.definition ? that.definition : getEnv(node.$env, that.name);

    var bodyType = types.getType(func);
    // console.log(`FunctionCall.subscribe body type: ${bodyType}`);

    switch(bodyType) {
      case 'GraphNode':
        func.subscribe(node, env);
        break;
      case 'function':
        // Functions go off graph and should never get back on graph.
        // TODO Determine if this function goes back on graph (not sure how).
        break;
      default:
        throw new Error('FunctionCall.subscribe does not support subscribing to non GraphNode');
    }
  }

  subscribe_old(listener, env) {
    // TODO Properly handle environment
    const evalEnv = env;
    var that = this;
    
    // TODO subscribe to args
    if(that.args.length !== 0) {
      throw new Error('FunctionCall.subscribe does not support arguments yet.');
    }
    
    var func = that.definition ? that.definition : getEnv(evalEnv, that.name);
    var bodyType = types.getType(func);
    // console.log(`FunctionCall.subscribe body type: ${bodyType}`);

    if(bodyType === 'GraphNode') {
      var previousEval;
      func.subscribe( (newValue, details) => {
        var newEval = that.evaluate(env);
        if(newEval !== previousEval) {
          var newDetails = {
            oldValue: previousEval,
            childEnv: env, // Should this be env or details.childEnv?
            event: details.event
          };
          previousEval = newEval;
          return listener(newEval, newDetails);
        }
      }, env);
    } else {
      throw new Error('FunctionCall.subscribe does not support subscribing to non GraphNode');
    }
  }

  /**
   * Create an environment by merging the namespace environment
   * with the argument environment.
   */
  getEvalEnv(env) {
    // Create an environment by merging the namespace environment
    // with the argument environment.
    var evalEnv = newEnv(this.env);
    add_globals(evalEnv);
    // Overlay with symbols from function call
    for (var symbol of Object.getOwnPropertySymbols(env)) {
      setEnv(evalEnv, symbol, getEnv(env, symbol));
    }
    return evalEnv;
  }
  
  resolveArgs(evalEnv) {
    var evaluator = new ScriptEvaluator(evalEnv);
    var args = evaluator.evalArray(this.args);
    return args;
  }

  evaluate(env) {
    // console.group(`Evaluating function call to ${Symbol.keyFor(this.name)}`);
    var results = null;

    var evalEnv = this.getEvalEnv(env);

    var func = this.definition ? this.definition : getEnv(evalEnv, this.name);
    // console.log(func);

    var args = this.resolveArgs(evalEnv);
    
    // console.log('The original args are');
    // console.log(this.args);
    // console.log('The evaluated args are')
    // console.log(args);
    switch (types.getType(func)) {
      case 'function':
        // console.log('Calling function');
        // console.log(func);
        results = func(...args, evalEnv);
        break;
      case 'GraphNode':
      case 'FunctionCall':
      case 'object':
        // Assume it's a function call.
        // console.log(`Evaluating call to ${types.getType(func)}; is this a FunctionCall or a GraphNode?`);
        results = func.evaluate(evalEnv, args);
        break;
      default:
        // console.log("Calling function of type");
        // console.log(types.getType(func));
        throw new Error(`Function type is not supported: ${types.getType(func)}`);
    }
    // console.log(results);
    // console.groupEnd();
    return results;
  }
}

class MapHandler {
  constructor(symbol, listOfValues) {
    this.symbol = symbol;
    this.listOfValues = listOfValues;
  }

  evaluate(env) {
    // Return a list of function calls
    var evaluator = new ScriptEvaluator(env);
    const listOfValues = evaluator.evalCompiledScript(this.listOfValues);
    var results = Array.from(listOfValues, value =>
      functionService.createFunctionCall(env, this.symbol, value).evaluate(env));
    // console.log('MapHandler::evaluate');
    // console.log(this.symbol);
    // console.log(this.listOfValues);
    // console.log(listOfValues);
    // console.log(results);
    return results;
  }
}

/**
 * A symbol where the symbol name is partially defined by a function that
 * returns a string.
 */
class DeferredSymbol {

  /**
   * @param {EnvironmentModel} env 
   * @param {string} namespace - root namespace for the symbol (using . as a namespace
   * separator)
   * @param {function} symbolFunc - a function that returns a string.  The namespace
   * is concatenated with the results of this function in order to determine the
   * final string representation of the symbol.
   */
  constructor(env, namespace, symbolFunc) {
    this.env = env;
    this.namespace = namespace;
    this.symbolFunc = symbolFunc;
  }

  /**
   * Evaluate the symbolFunc provided in the constructor to determine the full
   * symbolic name, and then resolve to the symbol.
   * 
   * @param {EnvironmentModel} env - environment used when executing symbolFunc.
   * @return symbol derived from the namespace + symbolFunc()
   */
  evaluate(env) {
    // console.group("Evaluating DeferredSymbol");
    // console.log(this.namespace);
    // console.log(this.symbolFunc);

    // TODO Don't assume the symbolFunc is a deref
    var deref = getEnv(env, this.symbolFunc.args[0])
    // console.log(deref);
    var newSym = types._symbol(Symbol.keyFor(this.namespace) + "." + Symbol.keyFor(deref));
    // console.log(newSym);
    // console.groupEnd();
    return newSym;
  }
}

//
// Environment
//
export var globalEnv = newEnv();

// Compiler namespace functions are defined here

function map_function(func, list, env) {
  // console.group('In funcion map_function');
  // console.log(func);
  // console.log(list);

  // FIXME Don't assume that the list is a list of symbols;
  // I think the list may include some elements that are function
  // calls and/or function definitions (definitely the latter).
  // For now, assume the list is a list of symbols.
  var newFuncCalls = Array.from(list, arg => {
    return functionService.createFunctionCall(env, func, arg).evaluate(env);
  })
  // console.log(newFuncCalls);
  // console.groupEnd();
  return newFuncCalls;
}

function call_function(symbol, args, env) {
  // console.group('call_function');
  // console.log(symbol);
  // console.log(args);
  var evaluator = new ScriptEvaluator(env);
  var results = evaluator.evalCompiledScript([symbol, args]);
  // console.log('Results from call_function');
  // console.log(results);
  // console.groupEnd();
  return results;
}

// compiler_namespace is added to the global environment
const compiler_namespace = new Map([
  ['map', map_function],
  ['call', call_function]
]);

export function add_globals(env) {
  // Core namespace (defined in core.js)
  for (let [k, v] of core.namespace) {
    setEnv(env, types._symbol(k), v);
  }

  // Compiler namespace
  for (let [k, v] of compiler_namespace) {
    setEnv(env, types._symbol(k), v);
  }
}

add_globals(globalEnv);
