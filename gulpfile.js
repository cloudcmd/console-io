'use strict';

const gulp = require('gulp');
const jshint = require('gulp-jshint');
const recess = require('gulp-recess');

const LIB = 'lib/';
const LIB_CLIENT = LIB + 'client/';
const LIB_SERVER = LIB + 'server/';
const Src = [
    '*.js',
    'gulp/**/*.js',
    LIB + '*.js',
    LIB_CLIENT + '*.js',
    LIB_SERVER + '**/*.js',
    '!' + LIB_CLIENT + 'jquery.js'
];

gulp.task('jshint', () => {
    gulp.src(Src)
        .pipe(jshint())
        .pipe(jshint.reporter())
        .on('error', onError);
});


gulp.task('css', () => {
    gulp.src('css/*.css')
        .pipe(recess())
        .pipe(recess.reporter())
        .on('error', onError);
});

gulp.task('default', ['jshint', 'css']);

function onError(params) {
    console.log(params.message);
}

