// Tests for specific portions of ZScript

const zs = require('./zscript.js');

function assert(condition, message="Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

var env1 = zs.env.newEnv();
console.log('New environment:');
console.log(env1);
var test = zs.types._symbol("test");

zs.env.setEnv(env1, test, "value");
console.log(env1);

assert(zs.env.getEnv(env1, test) === "value", "environment get/set failure");

console.log(zs.env.getEnv(env1, test));

console.log(Array.from(env1, (v, k) => [Symbol.keyFor(k), v]));
console.log(env1.getOwnPropertySymbols);
