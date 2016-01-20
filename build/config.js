var appRoot = 'src/';

// Translated generator
var gen_exe = 'dist/';

module.exports = {
  roots : {
    gen_exe : gen_exe,    // Babel converted generator
    //gen_src : appRoot  // ES6 generator code
  },
  paths : {
    gen_src : appRoot +'**/*.js',
    //gen_exe : xgen + '**/*.js'
  }
};
