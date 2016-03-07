

export function getType(obj) {
  if (typeof obj === 'string') {
    if (obj[0] == '\u029e') {
      return 'keyword';
    }
    return 'string';
  }
  if (Array.isArray(obj)) {
    if (obj.__isvector__) {
      return "vector";
    }
    return "array"
  }
  if (typeof obj === 'symbol') {
    return 'symbol';
  }
  switch(typeof(obj)) {
    case 'number': return 'number'
    case 'function': return 'function'
    default:
      return typeof(obj);
  }
}
/*
Function.prototype.clone = function() {
    let that = this
    // New function instance
    let f = function (...args) { return that.apply(this, args) }
    // Copy properties
    for (let k of Object.keys(this)) { f[k] = this[k] }
    return f
}
*/

export const _symbol = name => Symbol.for(name)

export const _keyword = obj => {
  if (getType(obj) === 'keyword') {
    return obj;
  } else {
    return '\u029e' + obj;
  }
}

export function _vector(...args) {
  let v = args.slice(0);
  v.__isvector__ = true;
  return v;
}

export class FunctionDefinition {
  constructor(name, args, body) {
    this.name = name;
    this.args = args;
    this.body = body;
    console.log(`fn name = ${name}`);
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

class FunctionService {
  constructor() {
    this.funcs = new Map();
  }

  createFunction(name, args, body) {
    console.log('creating function');
    console.log(this);
    console.log(this.funcs);
    // TODO Need to support name spaces; should
    // there be a FunctionService for each namespace?
    const nameString = Symbol.keyFor(name);
    console.log(`Creating new function ${nameString}`);
    const newFunc = new FunctionDefinition(nameString, args, body);
    this.funcs.set(nameString, newFunc);
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
