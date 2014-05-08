var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    inject = require('gulp-inject');

var paths = {
    scripts: ['src/**/*.js', 'spec/*.js', 'spec/fixtures/*.js', 'spec/fixtures/Project.js']
};

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

gulp.task('dev', function() {
    var files = gulp.src(paths.scripts);

    return gulp.src('spec/SpecRunner.html')
        .pipe(inject(files, { addRootSlash: false }))
        .pipe(gulp.dest('.'))
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['dev']);
});