

export class Test {
  constructor() {
  }

  cached() {
    // DO something that takes a very long time to calc x
    console.log('Computing...');
    var x = 0;
    delete this.cached
    this.cached = function() { console.log('returning pre-computed'); return x; }
    return this.cached();
  }

  cached2 = cachingFunc((x, y, z, ...args) => {
    console.log(`computing cached2 ${x}, ${y}, ${z}, ...${args}`);
    var result = x + y + z;
    console.log(`result is ${result}`);
    return result;
  })
}

var cachingFunc = (func) => {
  var fobj = {}
  fobj.func = func;
  fobj.calced = false;
  fobj.cfunc = (...args) => {
    if(fobj.calced) {
      console.log(`returning cached value ${fobj.results}`)
      return fobj.results;
    }
    console.log(`cfunc args ${args}`);
    fobj.results = fobj.func.call(null, ...args);
    fobj.calced = true;
    return fobj.results;
  }
  return fobj.cfunc;
}
