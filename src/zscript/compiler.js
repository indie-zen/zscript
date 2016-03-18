const core = require('./core.js');
const types = require('./types.js');

const readString = require('./reader.js').readString;
import { newEnv, setEnv, getEnv } from './env.js';

export function read(str) {
  return readString(str);
}

function evalAST(ast, env) {
  switch(types.getType(ast)) {
    case 'array':
      var res = ast.map( function(x) {
        return evalScript(x, env);
      });
      return res;
    case 'symbol':
      var f = getEnv(env, ast);
      return f;
    default:
      return ast;
  }
}

function evalScript(ast, env) {
  while(true) {
    if (types.getType(ast) != 'array') {
      return evalAST(ast, env);
    }

    const [a0, a1, a2, ...an ] = ast;
    const a0sym = types.getType(a0) === 'symbol' ?
      Symbol.keyFor(a0) : Symbol(':default');
    //console.log(`Getting symbol ${a0sym}`);
    switch(a0sym) {
      default:
        let [f, ...args] = evalAST(ast, env);
        if (types.getType(f) == 'function') {
          return f(...args);
        } else if (f.ast) {
          env = newEnv(f.env, f.params, args);
          ast = f.ast;
          break; // Continue evalScript loop
        }
        throw new Error(`Error evaluating ${a0sym}`);
    }
  }
}

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
    console.log('creating function');
    const newFunc = new FunctionDefinition(args, body);
    return newFunc;
  }

  createFunctionCall(name, ...args) {
    // TODO Need to track this?  Probably, to eventually determine
    // if all calls evaluate to a function that exists.
    const nameString = Symbol.keyFor(name);
    return new FunctionCall(nameString, ...args);
  }
}

export var functionService = new FunctionService();

export function compileScript(ast, env) {
  while(true) {
    if (types.getType(ast) != 'array') {
      return compileAST(ast, env);
    }

    const [a0, a1, a2, ...an] = ast;
    const a0type = types.getType(a0);
    const a0sym = a0type === 'symbol' ? Symbol.keyFor(a0) : Symbol(':default');
    switch(a0sym) {
      // Define a variable
      case 'def':
        env[a1] = compileScript(a2, env);
        return null;
      // Define a new function
      case 'func':
        console.log('Compiling body');
        console.log(a2);
        const body = compileScript(a2, env);
        console.log('Got body');
        console.log(body);
        var newFunc = functionService.createFunction(a1, body);
        console.log(newFunc);
        return newFunc;
      case 'require':
        console.log('Loading file');
        console.log(a2);
        console.log(an);
        var loadEnv = newEnv();
        loadFile(a2, loadEnv);
        setEnv(env, a1, loadEnv);
        return null;
      default:
        const args = Array.from(ast.slice(1),
            value => compileScript(value, env))
        // TODO compileScript for each of the args
        return functionService.createFunctionCall(a0, ...args);
    }
  }
}

export function loadFile(fileName, env) {
  var loadedFile = core.slurp(fileName);
  var ast = read(loadedFile);
  var newScript = compileScript(ast, env);
}

// Functions:
//
// FunctionDefinition
// FunctionCall

export class FunctionDefinition {
  constructor(args, body) {
    this.args = args;
    this.body = body;
    console.log('args');
    console.log(args);
    console.log('body');
    console.log(body);
  }
}

export class FunctionCall {
  constructor(name, ...args) {
    this.name = name;
    this.args = args;
    console.log(`Call to function ${name} with args:`);
    console.log(args);
  }
}

//
// Environment
//
export var globalEnv = newEnv();

for (let [k, v] of core.namespace) {
  setEnv(globalEnv, types._symbol(k), v);
}

// Read evaluate print
export function rep(str) {
  return objToString(evalScript(read(str), globalEnv));
}
