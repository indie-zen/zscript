var appRoot = 'src/';

// Translated interpreter
var zscript_exe = 'dist/';

module.exports = {
  roots : {
    zscript_exe : zscript_exe,    // Babel converted zscript interpreter
    spec_dist : 'spec-dist/'
  },
  paths : {
    zscript_src : appRoot +'**/*.js',
    spec_src: 'spec/**/*.js',
  }
};
