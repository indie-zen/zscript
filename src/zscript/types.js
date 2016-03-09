

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
