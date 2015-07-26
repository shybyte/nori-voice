var gulp = require('gulp');
var ts = require('gulp-typescript');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var bower = require('gulp-bower');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('bower', function () {
  return bower()
    .pipe(gulp.dest('bower_components/'))
});

var tsProject = ts.createProject({
  typescript: require('typescript'),
  noImplicitAny: true,
  sortOutput: true
});

gulp.task('typescript-demo', function () {
  var tsResult = gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));
  return tsResult
    .pipe(concat('nori-demo.js')) // You can use other plugins that also support gulp-sourcemaps
    .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('.tmp/scripts'));;
});

gulp.task('typescript', function () {
  var tsResult = gulp.src(['src/**/*.ts','!src/**/nori-demo.ts'])
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));
  return tsResult
    .pipe(concat('nori-facade.js')) // You can use other plugins that also support gulp-sourcemaps
    .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('.tmp/scripts'));
});

gulp.task('sass', function () {
  gulp.src('src/styles/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('default', ['bower', 'sass', 'typescript'], function () {
  browserSync({
    open: false,
    port: 3001,
    server: {
      baseDir: ["src",".tmp"],
      routes: {
        "/bower_components": "bower_components"
      }
    }
  });

  gulp.watch(['src/**/*.scss'], ['sass', browserSync.reload]);
  gulp.watch('src/**/*.ts', ['typescript', browserSync.reload]);
  gulp.watch(['src/**/*.html'], browserSync.reload);
});
