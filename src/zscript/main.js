const readline = require('./node_readline.js').readline;
const zs = require('./zscript.js');

console.log("Welcome to ZScript");

if (process.argv.length > 2) {

  // TODO Don't hard code the packages
  zs.core.packages["com.indiezen.metazen"] = "../metazen/metazen.zs"

  // Load the file
  var fileName = process.argv[2];
  console.log(`Loading file ${fileName}`);
  zs.compiler.loadFile(fileName, zs.compiler.globalEnv);

  if (process.argv.length > 3) {
    var jsfileName = process.argv[3];
    require(jsfileName);
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
