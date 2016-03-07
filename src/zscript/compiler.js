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

export function compileScript(ast, env) {
  while(true) {
    if (types.getType(ast) != 'array') {
      return compileAST(ast, env);
    }

    const [a0, a1, a2, ...an] = ast;
    const a0type = types.getType(a0);
    const a0sym = a0type === 'symbol' ? Symbol.keyFor(a0) : Symbol(':default');
    switch(a0sym) {
      // Define a new function
      case 'def':
        console.log('Compiling body');
        console.log(an[0]);
        const body = compileScript(an[0]);
        console.log('Got body');
        console.log(body);
        var newFunc = types.functionService.createFunction(a1, a2, body);
        console.log(newFunc);
        return newFunc;
      default:
        const args = [ a1, a2, ...an ];
        // TODO compileScript for each of the args
        console.log('Creating function call with ');
        console.log(args);
        return types.functionService.createFunctionCall(a0, ...args);
    }
  }
}

export var globalEnv = newEnv({});

export function rep(str) {
  return objToString(evalScript(read(str), globalEnv));
}

for (let [k, v] of core.namespace) {
  setEnv(globalEnv, types._symbol(k), v);
}
