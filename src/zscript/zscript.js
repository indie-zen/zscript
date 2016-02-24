export const types = require('./types.js');
export const readString = require('./reader.js').readString;
export const objToString = require('./printer.js').objToString;
import { newEnv, setEnv, getEnv } from './env.js';
export const core = require('./core.js');
export const slurp = core.slurp;

export function read(str) {
  return readString(str);
}

export function evalAST(ast, env) {
  switch(types.getType(ast)) {
    case 'array':
      console.log('Evaluating array');
      console.log(ast);
      var res = ast.map( function(x) {
        console.log("mapping");
        console.log(x);
        return evalScript(x, env);
      });
      console.log('Resulting array');
      console.log(res);
      return res;
    case 'symbol':
      var f = getEnv(env, ast);
      console.log(f);
      return f;
    default:
      console.log('Returning ast');
      console.log(types.getType(ast));
      return ast;
  }
}

export function evalScript(ast, env) {
  while(true) {
    console.log('evalScript');
    console.log(ast);
    console.log(env);
    if (types.getType(ast) != 'array') {
      return evalAST(ast, env);
    }

    const [a0, a1, a2, ...an ] = ast;
    const a0sym = types.getType(a0) === 'symbol' ?
      Symbol.keyFor(a0) : Symbol(':default');
    //console.log(`Getting symbol ${a0sym}`);
    switch(a0sym) {
      default:
        console.log('default evalScript');
        let [f, ...args] = evalAST(ast, env);
        console.log(f);
        console.log(types.getType(f));
        if (types.getType(f) == 'function') {
          console.log('Executing native function');
          return f(...args);
        } else if (f.ast) {
          env = newEnv(f.env, f.params, args);
          ast = f.ast;
          break; // Continue evalScript loop
        }
        console.log('Error evalScript');
        throw new Error(`Error evaluating ${a0sym}`);
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

const plus = getEnv(globalEnv, types._symbol('+'));
console.log('Plus is:');
console.log(plus);
