var gulp = require('gulp');
var babel = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');

gulp.task('build', function() {
  return gulp.src(paths.source)
    .pipe(babel(assign({}, compilerOptions)))
    .pipe(gulp.dest(paths.output));
});
