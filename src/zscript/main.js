const readline = require('./node_readline.js').readline;
const zs = require('./zscript.js');

console.log("Welcome to ZScript");

if (process.argv.length > 2) {
  console.log(`Using global environ ${Object.keys(zs.globalEnv)}`);

  // TODO load-file
  var f = process.argv[2];
  console.log(`Loading file ${f}`);
  var lines = zs.slurp(f).split('\n');
  for (var lineNo in lines) {
    var line = lines[lineNo];
    var ast = zs.read(line);
    console.log(`line ${lineNo}: ${line}`);
    var output = zs.evalScript(ast, zs.globalEnv);
    console.log('Got output');
    console.log(zs.objToString(output));
  }
}

while (true) {
  let line = readline("zscript:> ");
  if (line == null) break;
  try {
    if (line) { console.log(zs.rep(line)); }
  } catch (e) {
    if (e.stack) {
      console.log(e.stack);
    } else {
      console.log(`Error: ${e}`);
    }
  }
}
