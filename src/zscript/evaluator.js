const types = require('./types.js');

import {
  newEnv,
  setEnv,
  getEnv
}
from './env.js';

export class ScriptEvaluator {
  constructor(env) {
    this.env = env;
  }

  evalArray(array) {
    console.log('Calling evalArray');
    console.log(array);
    console.log(this);
    return Array.from(array, this.evalCompiledScript, this);
  }

  evalCompiledScript(script, args) {
    // console.group('in ScriptEvaluator.evalCompiledScript');
    // console.log(script);
    var results = null;

    //console.log(this.env);
    //console.log(types.getType(script));
    switch (types.getType(script)) {
      case 'array':
        // An array is a function call where the first value in the array
        // is the symbol of the function to be called, and the rest of
        // the array is a list of arguments.  This SHOULD already have
        // been compiled, but it wasn't!
        // FIXME This SHOULD have already been compiled during the compile
        // step; why wasn't it? (see compileScript default behavior; I think
        // that's why this isn't compiled yet)
        throw new Error('ScriptEvaluator should not get an uncompiled function call.');
        // console.group('Creating and then calling function');
        // const [sym, ...args] = script;
        // var funcCall = astService.createFunctionCall(this.env, sym, ...args);
        // results = funcCall.evaluate(this.env);
        // console.groupEnd();
        // break;
      case 'vector':
        results = Array.from(script, this.evalCompiledScript, this);
        results.__isvector__ = true;
        break;
      case 'symbol':
        // console.group('Getting symbol');
        // console.log(script);
        var value = getEnv(this.env, script, true);
        // If the symbol wasn't found, just return the symbol.
        if (value === null) {
          results = script;
        }
        else {
          // console.log(value);
          results = this.evalCompiledScript(value);
        }
        // console.groupEnd();
        break;
      case 'function':
        throw new Error("evalCompiledScript: function; how did we get here?");
      case 'GraphNode':
      case 'FunctionCall':
      case 'object':
        // console.log(`evalCompiledScript of type ${types.getType(script)}`);
        results = script.evaluate(this.env, args);
        break;
      case 'FunctionDefinition':
        // console.log('Entering FunctionDefinition.evaluate');
        // console.log(this.env.toString());
        // console.log(args);
        results = script.evaluate(this.env, args);
        break;
      default:
        results = script;
        break;
    }

    // console.log(results);
    // console.groupEnd();
    return results;
  }
}
