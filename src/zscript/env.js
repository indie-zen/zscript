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
        if (Symbol.keyFor(binds[i]) === "&") {
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
        throw Error(`'${Symbol.keyFor(sym)}' not found`)
    }
}

export function setEnv(env, sym, val) {
  env[sym] = val;
}
