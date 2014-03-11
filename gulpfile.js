var gulp = require('gulp'),
    concat = require('gulp-concat')
    uglify = require('gulp-uglify')
    rename = require('gulp-rename');

gulp.task('default', function() {
    return gulp.start('build.min');
});

gulp.task('build', function() {
    return gulp.src('src/*.js')
        .pipe(concat('rrm.js'))
        .pipe(gulp.dest('build'))
    ;
});

gulp.task('build.min', ['build'], function() {
    return gulp.src('build/rrm.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('build'))
    ;
});

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['build']);
})