var gulp = require('gulp');
var exec = require('gulp-exec');
var config = require('../config');

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
  return gulp.src(config.roots.gen_exe)
    .pipe(exec('node ./dist/main.js', options))
    .pipe(exec.reporter(reportOptions));
});

gulp.task('done', function() {
  console.log("Done!");
});

gulp.task('gen', ['generate']);

gulp.task('default', ['done']);
