var gulp = require('gulp');
var babel = require('gulp-babel');
var config = require('../config');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');

gulp.task('build-interpreter', function() {
  return gulp.src(config.paths.zscript_src)
    .pipe(babel(assign({}, compilerOptions)))
    .pipe(gulp.dest(config.roots.zscript_exe));
});

gulp.task('build', ['build-interpreter']); 

gulp.task('test', ['build'], function(cb) {
  var Jasmine = require('jasmine'),
      jasmine = new Jasmine();

  jasmine.loadConfigFile('./spec/support/jasmine.json');
  jasmine.onComplete(function(passed) {
    if(passed) {
      console.log('All tests passed.');
    } else {
      console.log('One or more tests failed.');
    }
    cb();
  });

  jasmine.execute();
});
