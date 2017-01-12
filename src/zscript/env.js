const types = require('./types.js');

class EnvironmentModel {
  toString() {
    var symbols = Object.getOwnPropertySymbols(this);
    return "Environment { " + Array.from(symbols,
        k => `${Symbol.keyFor(k)} : ${this[k]}`).join(', ')
      + " }";
  }
}

export class Environment {
  constructor(env) {
    this.$model = env || newEnv();
  }

  /**
   * Convert to a symbol
   * @todo should this be here or in types?  Probably types
   */
  toSymbol(str) {
    if(typeof str === 'string') {
      return types._symbol(str);
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
  get(key, ignoreNotFound = false) {
    var symbol = this.toSymbol(key);
    return getEnv(this.$model, symbol, ignoreNotFound);
  }

  /**
   * Set a value in this environment.
   * 
   * @param {symbol|string} key to use to index the value.  
   *  If this is a string then it is converted to a symbol.
   * @param {any} value to set
   */
  set(key, value) {
    var symbol = this.toSymbol(key);
    return setEnv(this.$model, symbol, value);
  }
  
}

// TODO These functions (newEnv, getEnv, setEnv) should be private
export function newEnv(outer=new EnvironmentModel(), binds=[], exprs=[]) {
    var e = Object.setPrototypeOf(new EnvironmentModel(), outer)
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
    return e
}

export const getEnv = (env, sym, ignoreNotFound=false) => {
    if (sym in env) {
        return env[sym]
    } else {
        var symText = Symbol.keyFor(sym);
        var symbols = symText.split('.');
        if(symbols.length > 0) {
          var value = env;
          for(var x = 0; x < symbols.length; x++) {
            console.log("Looking for symbol " + symbols[x]);
            if(types._symbol(symbols[x]) in value) {
              value = value[types._symbol(symbols[x])];
            } else {
                if (ignoreNotFound) {
                  return null;
                }
                console.log(value);
                throw Error(`'${symbols[x]}' not found`);
            }
          }
          console.log(`fqn ${symText} resulted in`);
          console.log(value);
          return value;
        }
        throw Error(`'${Symbol.keyFor(sym)}' not found`);
    }
}

export function setEnv(env, sym, val) {
  env[sym] = val;
}
