// Tests for specific portions of ZScript

const zs = require('./zscript.js');

function assert(condition, message="Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

var testsStruct = zs.env.getEnv(zs.compiler.globalEnv, zs.types._symbol('tests'))
console.log("Got tests");
console.log(testsStruct);
console.log("Running tests: ");

var resolveEnv = zs.env.newEnv();

var evaled = testsStruct.resolve(resolveEnv);

var tests = testsStruct.eval(zs.compiler.globalEnv)
console.log("Got results from evaluating the tests");
console.log(tests);
