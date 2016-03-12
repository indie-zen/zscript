const readline = require('./node_readline.js').readline;
const zs = require('./zscript.js');

console.log("Welcome to ZScript");

if (process.argv.length > 2) {
  // TODO load-file
  var f = process.argv[2];
  console.log(`Loading file ${f}`);
  var lines = zs.slurp(f).split('\n');
  for (var lineNo in lines) {
    var line = lines[lineNo];
    var ast = zs.compiler.read(line);
    console.log(`line ${lineNo}: ${line}`);
    var output = zs.compiler.compileScript(ast, zs.compiler.globalEnv);
    console.log(zs.objToString(output));
  }
} else {
  while (true) {
    var line = readline("zscript:> ");
    if (line == null) break;
    try {
      if (line) { console.log(zs.compiler.rep(line)); }
    } catch (e) {
      if (e.stack) {
        console.log(e.stack);
      } else {
        console.log(`Error: ${e}`);
      }
    }
  }
}
