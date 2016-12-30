var gulp = require('gulp');
var exec = require('gulp-exec');
var config = require('../config');
var child_process = require('child_process');

gulp.task('done', function() {
  console.log("Done!");
});

gulp.task('zscript', ['build-interpreter'], function(cb) {
  child_process.exec('node ./dist/zscript/main.js', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// Run ZScript interpreter
gulp.task('debug', ['build-interpreter'], function(cb) {
  child_process.exec('node ./dist/zscript/main.js examples/debug.zs', function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('default', ['done']);
