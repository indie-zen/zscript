const types = require('./types.js');

class Environment {
  toString() {
    var symbols = Object.getOwnPropertySymbols(this);
    return "Environment { " + Array.from(symbols,
        k => `${Symbol.keyFor(k)} : ${this[k]}`).join(', ')
      + " }";
  }

  // TODO Move getEnv and setEnv to this class;
  // What about newEnv?  Move to constructor?
}

export function newEnv(outer=new Environment(), binds=[], exprs=[]) {
    var e = Object.setPrototypeOf(new Environment(), outer)
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

export const getEnv = (env, sym) => {
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
