var gulp = require('gulp');
var exec = require('gulp-exec');
var config = require('../config');
var child_process = require('child_process');

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

gulp.task('mal', ['build-generator'], function(cb) {
  child_process.exec('node ./dist/mal/mal.js test.mal', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('zscript', ['build-generator'], function(cb) {
  child_process.exec('node ./dist/zscript/main.js test.zs', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('gen', ['generate']);

gulp.task('default', ['done']);
