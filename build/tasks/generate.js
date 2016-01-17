var gulp = require('gulp');
var exec = require('gulp-exec');
var paths = require('../paths');

gulp.task('generate', ['build-generator'], function() {
  var options = {
    continueOnError : false,
    pipeStdout: false
  };
  var reportOptions = {
  	err : true,
  	stderr : true,
  	stdout : true
  }
  gulp.src(paths.source)
    .pipe(exec('node ./dist/main.js', options))
    .pipe(exec.reporter(reportOptions));
});
