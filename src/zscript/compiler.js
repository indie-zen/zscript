// @flow
const core = require('./core.js');
const types = require('./types.js');

export const ScriptEvaluator = require('./evaluator').ScriptEvaluator;
export const reader = require('./reader.js');

require('console-group').install();

// import {
//   newEnv,
//   setEnv,
//   getEnv
// }
// from './env.js';
import { Environment } from './env.js';

export const graph = require('./graph.js');

function compileAST(ast, env) : Array<graph.GraphNode> | graph.GraphNode {
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
  
  funcs: Map<any, any>;
  
  constructor() {
    this.funcs = new Map();
  }

  createFunction(args : Array<any>, body : graph.GraphNode) : graph.GraphNode  {
    const newFunc = new FunctionDefinition(args, body);
    return new graph.GraphNode(newFunc);
  }

  createFunctionCall(env : Environment, name : symbol, ...args : Array<any>) {
    // TODO Need to track this?  Probably, to eventually determine
    // if all calls evaluate to a function that exists.
    const newFuncCall = new FunctionCall(env, name, ...args);
    return new graph.GraphNode(newFuncCall, env);
  }

  createMap(symbol : symbol, list : Array<any>) : MapHandler {
    return new MapHandler(symbol, list);
  }

  createDeferredSymbol(env : Environment, namespace : string, symbolFunc : graph.GraphNode) {
    return new DeferredSymbol(env, namespace, symbolFunc);
  }
}

export var functionService = new FunctionService();

export function compileScript(ast : Array<any>, env : Environment) : ?graph.GraphNode {
  if (!env) {
    throw new Error('Must specify Environment when calling compileScriopt');
  }
  while (true) {
    if (types.getType(ast) != 'array') {
      return compileAST(ast, env);
    }

    if (ast.length === 0) {
      return;
    }

    var [a0 : any, a1 : any, a2 : any, ...an : Array<any>] = ast;
    const a0type = types.getType(a0);
    const a0str : string = a0type === 'symbol' ? Symbol.keyFor(a0) : a0;
    const a0sym : Symbol = Symbol.for(a0str);
    switch (a0str) {
      // Define a variable
      case 'def':
        var def = compileScript(a2, env);
        env.set(a1, def);
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
        var loadEnv = new Environment();
        add_globals(loadEnv);
        loadFile(fileName, loadEnv);
        env.set(a1, loadEnv);
        return null;
      case 'eval':
        var funcCall = compileScript(a1, env);
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
        // 
        return functionService.createFunctionCall(env, a0sym, ...args);
    }
  }
}

export function loadFile(fileName : string, env : Environment) {
  // TODO Don't re-load a file that's already been loaded.
  var loadedFile = core.slurp(fileName);
  var tokens = reader.tokenize(loadedFile);
  while (!tokens.isDone()) {
    var ast = reader.readNextExpression(tokens);
    compileScript(ast, env);
  }
}

export function compileString(scriptString : string, env : Environment) {
  env = env || new Environment();
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
  $args : Array<any>;
  $body : graph.GraphNode;
  $graphNode : graph.GraphNode;
  
  constructor(args : Array<any>, body : graph.GraphNode) {
    this.$args = args;
    this.$body = body;
  }

  getBody() {
    if (this.$body.constructor.name === 'GraphNode') {
      return this.$body.$model;
    }
    else {
      return this.$body;
    }
  }

  evaluate(env : Environment, args : Array<any>) {
    // console.group('Evaluating function definition');

    // For now assume a function definition is nothing more than a function call
    // console.log(this.body);
    // console.log(this.$args);
    // console.log(args);

    // Create a new environment to include arguments as local symbols
    var funcEnv = env.newEnv(this.$args, args);

    var results = this.$body.evaluate(funcEnv);
    // console.log(results);
    // console.groupEnd();
    return results;
  }

  subscribe(node : graph.GraphNode, env : Environment, args : Array<any>) {
    // Create a new environment to include arguments as local symbols
    var funcEnv = env.newEnv(this.$args, args);

    // No need to subscribe to the arguments because the FunctionCall takes
    // care of this for us.
    // this.$args.forEach((arg) => {
    //   switch(typeof arg) {
    //     case 'symbol':
    //       // If the argument is a symbol, resolve it and subscribe to it.
    //       getEnv(env, arg).subscribe(node, env);
    //       break;
    //     default:
    //         console.log(`Subscribe to arg type ${typeof arg}`);
    //         arg.subscribe(node, env);
    //       break;
    //   }
    // });

    this.$graphNode = node;
    this.$body.subscribe(node, env, funcEnv);
    // console.log('FunctionDefinition.subscribe');
    // console.log(this.body);
  }
}

class ScriptResolver {
  $env : Environment;
  
  constructor(env : Environment) {
    this.$env = env;
  }

  resolveArray(array : Array<any>) : Array<any> {
    return Array.from(array, this.resolveCompiledScript, this);
  }

  resolveCompiledScript(script : Array<any>) {
    // console.group('in ScriptResolver.resolveCompiledScript');
    // console.log(types.getType(script));
    // console.log(script);
    var results = script;
    switch (types.getType(script)) {
      case 'array':
        // FIXME as with evalCompiledScript, this needs to be fixed
        const [sym, ...args] = script;
        var funcCall = functionService.createFunctionCall(this.$env, sym, ...args);
        results = funcCall.resolve(this.$env);
        break;
      case 'vector':
        var resolver = new ScriptResolver(this.$env);
        results = resolver.resolveArray(script);
        // $FlowFixMe - using a hacky way to distinguish vectors from arrays
        results.__isvector__ = true;
        break;
    }
    // console.groupEnd();
    return results;
  }
}

export class FunctionCall {
  $definition : ?FunctionDefinition;
  $name : symbol;
  $args: Array<any>;
  $env: Environment;
  $graphNode : graph.GraphNode;
  
  constructor(env : Environment, nameOrDef : FunctionDefinition|symbol, ...args : Array<any>) {
    if (types.getType(nameOrDef) === 'symbol') {
      this.$definition = null;
      // $FlowFixMe - flow is wrong; this is definitely a symbol here
      this.$name = nameOrDef;

      // Environment created during the compile step
      this.$env = env;
      // console.log(`Call to function ${Symbol.keyFor(nameOrDef)} with args:`);
    }
    else {
      this.$name = types._symbol('<lambda>');
      // console.log('Call to lambda function');
      // console.log(nameOrDef);
      // $FlowFixMe - flow is wrong; this is definitely a FunctionDefinition here
      this.$definition = nameOrDef;
    }
    this.$args = args;
    // console.log(args);
  }

  getArg(n : number) : any {
    let arg = this.$args[n];
    if (arg.constructor.name === 'GraphNode') {
      return arg.$model;
    }
    else {
      return arg;
    }
  }

  getName() : symbol {
    return this.$name;
  }

  resolve(env : Environment) {
    // console.group(`Resolving function call to ${Symbol.keyFor(this.name)}`);
    // console.log('The original args are');
    // console.log(this.$args);
    var resolver = new ScriptResolver(env);
    this.$args = resolver.resolveArray(this.$args);
    // console.groupEnd();
    return this;
  }

  subscribe(node : graph.GraphNode, env : Environment, funcEnv : Function) {
    this.$graphNode = node;

    var that = this;

    that.$args.map((arg) => {
      // console.log('Subscribing to arg');
      // console.log(arg);
      arg.subscribe(node, funcEnv);
    });

    // TODO Is this the correct environment?  If it is then it probably shouldn't be
    // private.
    var func : any = that.$definition ? that.$definition : env.get(that.$name);

    var bodyType = types.getType(func);
    // console.log(`FunctionCall.subscribe body type: ${bodyType}`);

    switch (bodyType) {
      case 'GraphNode':
        func.subscribe(node, env, that.$args);
        break;
      case 'function':
        // Functions go off graph and should never get back on graph.
        // TODO Determine if this function goes back on graph (not sure how).
        break;
      default:
        throw new Error('FunctionCall.subscribe does not support subscribing to non GraphNode');
    }
  }

  /**
   * Create an environment by merging the namespace environment
   * with the argument environment.
   */
  getEvalEnv(env : Environment) {
    // Create an environment by merging the namespace environment
    // with the argument environment.
    var evalEnv = this.$env.newEnv();
    add_globals(evalEnv);
    // Overlay with symbols from function call
    for (var symbol of Object.getOwnPropertySymbols(env)) {
      evalEnv.set(symbol, env.get(symbol));
    }
    return evalEnv;
  }

  resolveArgs(evalEnv : Environment) {
    var evaluator = new ScriptEvaluator(evalEnv);
    console.log(this.$args);
    var args = evaluator.evalArray(this.$args);
    return args;
  }

  evaluate(env : Environment) {
    // console.group(`Evaluating function call to ${Symbol.keyFor(this.$name)}`);
    var results = null;

    var evalEnv = this.getEvalEnv(env);

    var func : any = this.$definition ? this.$definition : evalEnv.get(Symbol.keyFor(this.$name));
    // console.log(func);

    var args = this.resolveArgs(evalEnv);

    // console.log('The original args are');
    // console.log(this.$args);
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
  $symbol: Symbol;
  $listOfValues: Array<any>;
  
  constructor(symbol : symbol, listOfValues : Array<any>) {
    this.$symbol = symbol;
    this.$listOfValues = listOfValues;
  }

  evaluate(env : Environment) {
    // Return a list of function calls
    var evaluator = new ScriptEvaluator(env);
    const listOfValues = evaluator.evalCompiledScript(this.$listOfValues);
    var results = Array.from(listOfValues, value =>
      functionService.createFunctionCall(env, this.$symbol, value).evaluate(env));
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
  $env : Environment;
  $namespace : string;
  $symbolFunc: graph.GraphNode;
  
  /**
   * @param {Environment} env 
   * @param {string} namespace - root namespace for the symbol (using . as a namespace
   * separator)
   * @param {function} symbolFunc - a function that returns a string.  The namespace
   * is concatenated with the results of this function in order to determine the
   * final string representation of the symbol.
   */
  constructor(env : Environment, namespace : string, symbolFunc : graph.GraphNode) {
    this.$env = env;
    this.$namespace = namespace;
    this.$symbolFunc = symbolFunc;
  }

  /**
   * Evaluate the symbolFunc provided in the constructor to determine the full
   * symbolic name, and then resolve to the symbol.
   * 
   * @param {Environment} env - environment used when executing symbolFunc.
   * @return symbol derived from the namespace + symbolFunc()
   */
  evaluate(env : Environment) {
    // console.group("Evaluating DeferredSymbol");
    // console.log(this.namespace);
    // console.log(this.symbolFunc);

    // TODO Don't assume the symbolFunc is a deref
    var deref = (env, this.$symbolFunc.args[0])
      // console.log(deref);
    var newSym = types._symbol(this.$namespace + "." + deref);
    // console.log(newSym);
    // console.groupEnd();
    return newSym;
  }
}

//
// Environment
//
// export var globalEnv = new Environment();

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

export function add_globals(env : Environment) {
  // Core namespace (defined in core.js)
  for (let [k, v] of core.namespace) {
    env.set(types._symbol(k), v);
  }

  // Compiler namespace
  for (let [k, v] of compiler_namespace) {
    env.set(types._symbol(k), v);
  }
}

// add_globals(globalEnv);
