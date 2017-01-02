const core = require('./core.js');
const types = require('./types.js');

export const reader = require('./reader.js');

require('console-group').install();

import { newEnv, setEnv, getEnv } from './env.js';

function compileAST(ast, env) {
  const astType = types.getType(ast);
  switch(astType) {
    case 'array':
      return ast.map( (x) => compileScript(x, env) );
    default:
      return ast;
  }
}

class FunctionService {
  constructor() {
    this.funcs = new Map();
  }

  createFunction(args, body) {
    const newFunc = new FunctionDefinition(args, body);
    return newFunc;
  }

  createFunctionCall(env, name, ...args) {
    // TODO Need to track this?  Probably, to eventually determine
    // if all calls evaluate to a function that exists.
    return new FunctionCall(env, name, ...args);
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
  while(true) {
    if (types.getType(ast) != 'array') {
      return compileAST(ast, env);
    }

    if(ast.length === 0) {
      return;
    }

    var [a0, a1, a2, ...an] = ast;
    const a0type = types.getType(a0);
    const a0sym = a0type === 'symbol' ? Symbol.keyFor(a0) : Symbol(':default');
    switch(a0sym) {
      // Define a variable
      case 'def':
        var def = compileScript(a2, env);
        env[a1] = def;
        console.log(`def ${Symbol.keyFor(a1)}`);
        if (types.getType(def) === 'symbol') {
            console.log(Symbol.keyFor(def));
        } else {
          console.log(def);
        }
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
        console.log('Evaluating');
        console.log(funcCall);
        return null;
      case 'using':
        console.log('Using:');
        switch(types.getType(a2)) {
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
          console.log("Setting namespace value")
          console.log(sym);
          console.log(a1[sym]);
          console.log(newValue);
          a1[sym] = newValue;
          console.log('-----')
        })
        return a1;
      case 'map':
        console.log('creating map');
        console.log(a1);
        console.log(a2);
        return functionService.createMap(a1, a2);
      default:
        if(types.getType(a0) === "array") {
          var newA0 = compileScript(a0, env);
          console.log("New a0");
          console.log(newA0);
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
  while(!tokens.isDone()) {
    var ast = reader.readNextExpression(tokens);
    compileScript(ast, env);
  }
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
    console.group('Evaluating function definition');

    // For now assume a function definition is nothing more than a function call
    console.log(this.body);
    console.log(this.args);
    console.log(args);

    var funcEnv = newEnv(env, this.args, args);

    var results = this.body.evaluate(funcEnv);
    console.log(results);
    console.groupEnd();
    return results;
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
    console.group('in ScriptResolver.resolveCompiledScript');
    console.log(types.getType(script));
    console.log(script);
    var results = script;
    switch(types.getType(script)) {
      case 'array':
        // FIXME as with evalCompiledScript, this needs to be fixed
        const [sym, ...args] = script;
        var funcCall = functionService.createFunctionCall(this.env, sym, ...args);
        results = funcCall.resolve(this.env);
        console.groupEnd();
        break;
      case 'vector':
        var resolver = new ScriptResolver(this.env);
        results = resolver.resolveArray(script);
        results.__isvector__ = true;
        break;
    }
    console.groupEnd();
    return results;
  }
}

class ScriptEvaluator {
  constructor(env) {
    this.env = env;
  }

  evalArray(array) {
    return Array.from(array, this.evalCompiledScript, this);
  }

  evalCompiledScript(script) {
    console.group('in ScriptEvaluator.evalCompiledScript');
    console.log(script);
    var results = null;

    //console.log(this.env);
    //console.log(types.getType(script));
    switch(types.getType(script)) {
      case 'array':
        // An array is a function call where the first value in the array
        // is the symbol of the function to be called, and the rest of
        // the array is a list of arguments.  This SHOULD already have
        // been compiled, but it wasn't!
        // FIXME This SHOULD have already been compiled during the compile
        // step; why wasn't it? (see compileScript default behavior; I think
        // that's why this isn't compiled yet)
        console.group('Creating and then calling function');
        const [sym, ...args] = script;
        var funcCall = functionService.createFunctionCall(this.env, sym, ...args);
        results = funcCall.evaluate(this.env);
        console.groupEnd();
        break;
      case 'vector':
        results = Array.from(script, this.evalCompiledScript, this);
        results.__isvector__ = true;
        break;
      case 'symbol':
        console.group('Getting symbol');
        console.log(script);
        var value = getEnv(this.env, script, true);
        // If the symbol wasn't found, just return the symbol.
        if (value === null) {
          results = script;
        } else {
          console.log(value);
          results = this.evalCompiledScript(value);
        }
        console.groupEnd();
        break;
      case 'function':
        throw new Error("evalCompiledScript: function; how did we get here?");
      case 'object':
         results = script.evaluate(this.env);
        break;
      default:
        results = script;
        break;
    }

    console.log(results);
    console.groupEnd();
    return results;
  }
}

export class FunctionCall {
  constructor(env, nameOrDef, ...args) {
    if(types.getType(nameOrDef) === 'symbol') {
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
    console.group(`Resolving function call to ${Symbol.keyFor(this.name)}`);
    console.log('The original args are');
    console.log(this.args);
    var resolver = new ScriptResolver(env);
    this.args = resolver.resolveArray(this.args);
    console.groupEnd();
    return this;
  }

  evaluate(env) {
    console.group(`Evaluating function call to ${Symbol.keyFor(this.name)}`);
    var results = null;

    // Create an environment by merging the namespace environment
    // with the argument environment.
    var evalEnv = newEnv(this.env);
    add_globals(evalEnv);
    // Overlay with symbols from function call
    for(var symbol of Object.getOwnPropertySymbols(env)) {
      setEnv(evalEnv, symbol, getEnv(env, symbol));
    }

    var func = this.definition ? this.definition : getEnv(evalEnv, this.name);
    console.log(func);
    var evaluator = new ScriptEvaluator(evalEnv);
    var args = evaluator.evalArray(this.args);
    console.log('The original args are');
    console.log(this.args);
    console.log('The evaluated args are')
    console.log(args);
    switch(types.getType(func)) {
      case 'function':
        console.log('Calling function');
        console.log(func);
        results = func(...args, evalEnv);
        break;
      case 'object':
        // Assume it's a function call.
        //console.log(func.getType());
        results = func.evaluate(evalEnv, args);
        break;
      default:
        console.log("Calling function of type");
        console.log(types.getType(func));
        throw new Error(`Function type is not supported: ${types.getType(func)}`);
    }
    console.log(results);
    console.groupEnd();
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
    console.log('MapHandler::evaluate');
    console.log(this.symbol);
    console.log(this.listOfValues);
    console.log(listOfValues);
    console.log(results);
    return results;
  }
}

class DeferredSymbol {
  constructor(env, namespace, symbolFunc) {
    this.env = env;
    this.namespace = namespace;
    this.symbolFunc = symbolFunc;
  }

  evaluate(env) {
    console.group("Evaluating DeferredSymbol");
    console.log(this.namespace);
    console.log(this.symbolFunc);

    // TODO Don't assume the symbolFunc is a deref
    var deref = getEnv(env, this.symbolFunc.args[0])
    console.log(deref);
    var newSym = types._symbol(Symbol.keyFor(this.namespace) + "." + Symbol.keyFor(deref));
    console.log(newSym);
    console.groupEnd();
    return newSym;
  }
}

//
// Environment
//
export var globalEnv = newEnv();

// Compiler namespace functions are defined here

function map_function(func, list, env) {
  console.group('In funcion map_function');
  console.log(func);
  console.log(list);

  // FIXME Don't assume that the list is a list of symbols;
  // I think the list may include some elements that are function
  // calls and/or function definitions (definitely the latter).
  // For now, assume the list is a list of symbols.
  var newFuncCalls = Array.from(list, arg => {
    return functionService.createFunctionCall(env, func, arg).evaluate(env);
  })
  console.log(newFuncCalls);
  console.groupEnd();
  return newFuncCalls;
}

function call_function(symbol, args, env) {
  console.group('call_function');
  console.log(symbol);
  console.log(args);
  var evaluator = new ScriptEvaluator(env);
  var results = evaluator.evalCompiledScript([symbol, args]);
  console.log('Results from call_function');
  console.log(results);
  console.groupEnd();
  return results;
}
// compiler_namespace is added to the global environment
const compiler_namespace = new Map([
  ['map', map_function],
  ['call', call_function]
]);

function add_globals(env) {
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
