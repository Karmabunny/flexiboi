const path = require('path');
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-dart-sass');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

const r = path.resolve.bind(null, __dirname);

// Pull in our settings.
const { karmabunny } = require('./package.json');
karmabunny.src = karmabunny.src.map(path => r(path));
karmabunny.target = r(karmabunny.target);

let watched = [];

// A lovely little hack to 'discover' all the watched files.
const _render = sass.compiler.renderSync;
sass.compiler.renderSync = (function(opts) {
    const result = _render(opts);
    watched = result.stats.includedFiles.slice(0);
    return result;
});

function build(cb) {
    gulp.src(karmabunny.src)
    .pipe(sourcemaps.init())
    .pipe(
        sass.sync({
            sourceMap: true,
        })
        .on('error', cb)
    )
    .pipe(
        postcss([
            autoprefixer(),
            cssnano({
                preset: 'default',
            }),
        ])
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(karmabunny.target))
    .on('end', cb);
}

function watch() {
    return gulp.watch(watched, {
        ignoreInitial: true,
        events: 'all',
        delay: 300,
    }, build);
}

function notify() {
    const notifier = require('node-notifier');

    function onError(error) {
        if (!error) return;
        notifier.notify({
            title: 'Gulp error',
            message: error.message,
        })
    }

    return gulp.watch(watched, {
        ignoreInitial: true,
        events: 'all',
        delay: 300,
    }, () => build(onError));
}

exports.default = build;
exports.build = build;
exports.watch = gulp.series(build, watch);
exports.notify = gulp.series(build, notify);
