

export class Test {
  constructor(name) {
    this.name = "class " + name;
  }

  @cachingFunc
  cached(x, y, z) {
    console.log(`computing cached using ${x}, ${y}, ${z} ${this.name}`);
    return x + y + z;
  }

  @cachingFuncWithParms(1)
  cachedWithParms(x, y, z) {
    console.log(`computing cached with parms using ${x}, ${y}, ${z} ${this.name}`);
    return x + y + z;
  }
}

// Doesn't work with different arguments
function cachingFunc(target, key, descriptor) {
  console.log(target);
  console.log(descriptor);
  const method = descriptor.value;
  descriptor.value = function(...args) {
    console.log(this);
    var result = method.apply(this, args);
    delete target[key];
    target[key] = (...args) => {
      console.log(`returning cached value ${result}`);
      return result;
    }
    return target[key](...args);
  }
  return descriptor;
}

function cachingFuncWithParms(x) {
  return cachingFunc;
}
