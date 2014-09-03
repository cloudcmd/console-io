(function() {
    'use strict';
    
    var gulp        = require('gulp'),
        jshint      = require('gulp-jshint'),
        recess      = require('gulp-recess'),
        
        LIB         = 'lib/',
        LIB_CLIENT  = LIB + 'client/',
        LIB_SERVER  = LIB + 'server/',
        Src         = [
            '*.js',
            'gulp/**/*.js',
            LIB + '*.js',
            LIB_CLIENT + '/*.js',
            LIB_SERVER + '/**/*.js',
        ];
    
    ['changelog', 'package'].forEach(function(name) {
        gulp.task(name, require('./gulp/tasks/' + name));
    });
    
    gulp.task('jshint', function() {
        gulp.src(Src)
            .pipe(jshint())
            .pipe(jshint.reporter())
            .on('error', onError);
    });
    
   
    gulp.task('css', function () {
        gulp.src('css/*.css')
            .pipe(recess())
            .pipe(recess.reporter())
            .on('error', onError);
    });
    
    gulp.task('default', ['jshint', 'css']);
    gulp.task('release', ['changelog', 'package']);
    
    function onError(params) {
        console.log(params.message);
    }
    
})();
