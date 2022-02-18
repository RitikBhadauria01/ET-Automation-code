import gulp from 'gulp';
import babel from 'gulp-babel';
import path from 'path';
import uglify from 'gulp-uglify';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';

const plugins = gulpLoadPlugins();

const paths = {
  js: ['./**/*.js', '!dist/**', '!node_modules/**', '!coverage/**'],
  nonJs: ['./package.json', './.gitignore', './**/*.ejs', './**/*.html', './**/*.yaml', '!dist'],
  tests: './server/tests/*.js',
};

export const clean = () => del(['dist/**', 'coverage/**', '!dist', '!coverage']);

export const compile = () => {
  return gulp
    .src([...paths.js, '!gulpfile.babel.js'], { base: '.', sourcemaps: true })
    .pipe(plugins.newer('dist'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
};

export const copy = () =>
  gulp
    .src(paths.nonJs)
    .pipe(plugins.newer('dist'))
    .pipe(gulp.dest('dist'));

export const nodemon = () =>
  plugins
    .nodemon({
      script: path.join('dist', 'index.js'),
      ext: 'js',
      ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
    })
    .on('restart', gulp.series(compile, copy));

export const serve = gulp.series(clean, gulp.parallel(copy, compile), nodemon);

const build = gulp.series(clean, gulp.parallel(copy, compile));

export default build;
