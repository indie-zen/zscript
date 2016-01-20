#! /usr/bin/env node
var times = 0;
function main() {

  console.log('Generating...');
  var GeneratorManager = require('./generator.js');

  var meta = require('./meta/main.json');

  var generator = GeneratorManager.getService('nodejs');

  generator.generate();
}

if(times == 0) {
  times = times + 1;
  main();
}
