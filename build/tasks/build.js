var gulp = require('gulp');
var babel = require('gulp-babel');
var config = require('../config');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');

gulp.task('build-generator', function() {
  return gulp.src(config.paths.gen_src)
    .pipe(babel(assign({}, compilerOptions)))
    .pipe(gulp.dest(config.roots.gen_exe));
});
