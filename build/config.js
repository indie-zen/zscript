var appRoot = 'src/';

// Translated interpreter
var zscript_exe = 'dist/';

module.exports = {
  roots : {
    zscript_exe : zscript_exe    // Babel converted zscript interpreter
  },
  paths : {
    zscript_src : appRoot +'**/*.js'
  }
};
