#! /usr/bin/env node

// console.log('Generating...');
// var GeneratorManager = require('./generator.js');

var meta = require('./meta/main.json');

//var generator = GeneratorManager.getService('nodejs');
//generator.generate();

var x = [1, 2, 3, 4, 5];

// destructuring assignment
const [a0, a1, a2, a3] = x;
console.log([a0, a1, a2, a3]);
console.log(x);
