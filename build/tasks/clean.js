var gulp = require('gulp');
var config = require('../config');
var del = require('del');
var vinylPaths = require('vinyl-paths');

gulp.task('clean', function() {
  return gulp.src([config.roots.gen_exe])
    .pipe(vinylPaths(del));
});
