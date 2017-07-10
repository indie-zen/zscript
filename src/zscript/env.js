// @flow
const types = require('./types.js');

class EnvironmentModel extends Object {
  toString() : string {
    var symbols = Object.getOwnPropertySymbols(this);
    return "EnvironmentModel { " + Array.from(symbols,
        k => `${Symbol.keyFor(k)} : ${this[k]}`).join(', ')
      + " }";
  }
}

export class Environment {
  $model : EnvironmentModel;
  
  constructor(model : ?EnvironmentModel) {
    this.$model = $newEnv(model || new EnvironmentModel());
  }
  
  toString() : string {
    return ` Environment { ${this.$model.toString()} }`;
  }
  
  newEnv(binds : Array<any> = [], exprs : Array<any>=[]) : Environment {
    return new Environment($newEnv(this.$model, binds, exprs));
  }

  /**
   * Convert to a symbol
   * @todo should this be here or in types?  Probably types
   */
  toSymbol(str : string | Symbol) : Symbol {
    if(typeof str === 'string') {
      return types._symbol(str);
    // $FlowFixMe
    } else if (typeof str === 'symbol') {
      return str;
    }
    // Support other conversions?
    throw new Error(`Cannot convert ${typeof str} to a symbol`);
  }
  
  /**
   * Get a symbol from this environment.
   * 
   * @param {symbol|string} key - if this is a string then it is converted
   *  to a symbol.
   * @param {bool} ignoreNotFound if false and the key is not found then
   *  an exception is thrown; if true and the key is not found, undefined is
   * returned.
   * @return {any} value for the key, or undefined if the key is not found.
   */
  get(key : Symbol | string, ignoreNotFound : boolean = false) {
    var symbol;
    if (typeof key === 'string') {
      symbol = this.toSymbol(key);
    }
    else {
      symbol = key;
    }
    return $getEnv(this.$model, symbol, ignoreNotFound);
  }

  /**
   * Set a value in this environment.
   * 
   * @param {symbol|string} key to use to index the value.  
   *  If this is a string then it is converted to a symbol.
   * @param {any} value to set
   */
  set(key : Symbol | string, value : any) {
    var symbol;
    if (typeof key === 'string') {
      symbol = this.toSymbol(key);
    }
    else {
      symbol = key;
    }
    return $setEnv(this.$model, symbol, value);
  }
  
}

// TODO These functions (newEnv, getEnv, setEnv) should be private
function $newEnv(outer=new EnvironmentModel(), binds=[], exprs=[]) : EnvironmentModel {
    // $FlowFixMe - flow gets this wrong
    var e : EnvironmentModel = Object.setPrototypeOf(new EnvironmentModel(), outer)
    // Bind symbols in binds to values in exprs
    for (var i=0; i<binds.length; i++) {
        if (types.getType(binds[i]) === "vector") {
          if (types.getType(exprs[i]) === "vector") {
            // func [[x y]](...) [1 2]
            // Positional destructuring
            for (var p = 0; p < binds[i].length; p++) {
              e[binds[i][p]] = exprs[i][p];
            }
          }
          else {
            // func [[x y]](...) 1 2
            // Error, we don't support this yet.
            throw Error('Positional destructuring is only supported when the right side is a list.');
          }
        } else if (Symbol.keyFor(binds[i]) === "&") {
            e[binds[i+1]] = exprs.slice(i) // variable length arguments
            break
        } else {
            e[binds[i]] = exprs[i]
        }
    }
    return e;
}

const $getEnv = (env : EnvironmentModel, sym : Symbol, ignoreNotFound=false) => {
    // $FlowFixMe
    if (sym in env) {
        return env[sym]
    } else {
        let symText : string = Symbol.keyFor(sym);
        let symbols : Array<string> = symText.split('.');
        if(symbols.length > 1) {
          let value = env;
          for(let x = 0; x < symbols.length; x++) {
            sym = Symbol.for(symbols[x]);
            if(sym in value) {
              value = value[sym];
            } 
            else if(typeof value === 'Environment') {
              value = value.get(sym);
            }
            else {
              if (ignoreNotFound) {
                return null;
              }
              // console.log(value);
              throw Error(`'${symbols[x]}' not found`);
            }
          }
          // console.log(`fqn ${symText} resulted in`);
          // console.log(value);
          return value;
        }
        throw Error(`'${Symbol.keyFor(sym)}' not found`);
    }
}

function $setEnv(env : Object, sym : Symbol, val : any) {
  if(typeof sym === 'symbol') {
    console.log(`Set ${Symbol.keyFor(sym)}`);
    env[sym] = val;
  }
  else {
    throw new Error(`Cannot set environment using key of type ${typeof sym}`);
  }
}
