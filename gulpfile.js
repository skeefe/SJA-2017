"use strict";

/* ---- ==== PLUGINS ==== ---- */

// General
const gulp = require("gulp");
const browserSync = require('browser-sync');
const connectHistoryAPIFallback = require('connect-history-api-fallback');
const runSequence = require('run-sequence');
const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const del = require("del");

// Typescript
const tsc = require("gulp-typescript");
const tsProject = tsc.createProject("tsconfig.json");
const tslint = require('gulp-tslint');

// Styles
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');

// Images
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');

// JS
const uglify = require('gulp-uglify');
const useref = require('gulp-useref');


/* ---- ==== LAB TASKS ==== ---- */


/* General */

// Default - Starts the dev site and watches.
gulp.task('default', function (callback) {
	runSequence(
		['browserSync:lab', 'watch'],
		callback
	)
})

// Watch
gulp.task('watch', ['browserSync:lab'], function () {

	// Typescript
	gulp.watch(["lab/**/*.ts"], ['compile']);

	// Styles
	gulp.watch('lab/**/*.scss', ['sass']);

	// Markup
	gulp.watch('lab/**/*.htm', browserSync.reload);

	// JS
	gulp.watch('lab/assets/**/*.js', browserSync.reload);

	//Images
	gulp.watch('lab/assets/**/*.+(png|jpg|jpeg|gif|svg)', browserSync.reload);

});

// Create Lab Server
gulp.task('browserSync:lab', function () {
	browserSync({
		port: 4,
		server: {
			baseDir: 'lab',
			index: 'index.htm',
			middleware: [
				require('connect-history-api-fallback')({ index: '/index.htm' })
			]
		},
		ui: false,
		logLevel: "info",
		logFileChanges: false
	})
})


/* TypeScript */

// Compiles Typescript.
gulp.task('compile', ['tslint'], () => {
	let tsResult = gulp.src('lab/**/*.ts')
		.pipe(sourcemaps.init())
		.pipe(tsc(tsProject));
	return tsResult.js
		.pipe(sourcemaps.write('.', { sourceRoot: '/lab' }))
		.pipe(gulp.dest('lab'))
		.pipe(browserSync.stream());
});

// Assesses (lints) on all custom TypeScript files.
gulp.task('tslint', () => {
	return gulp.src("lab/**/*.ts")
		.pipe(tslint({
			formatter: 'prose'
		}))
		.pipe(tslint.report());
});

// Removes compiled Typescript files.
gulp.task('decompile', (cb) => {
	return del(['lab/app/**/*.+(js|map)'], cb);
});

/* Styles */

// Compiles SASS
gulp.task('sass', function () {
	return gulp.src('lab/assets/scss/skeefe.scss') // Retrieves skeefe.scss
		.pipe(sourcemaps.init()) // Adds Sourcemaps	
		.pipe(sass()) // Compiles SASS
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('lab/assets/css')) // Outputs CSS file.
		.pipe(browserSync.stream()); // Injects updated CSS.
});


/* JS */

// Copies all required libraries into build directory.
gulp.task("vendor", () => {
	return gulp.src([
		'core-js/client/shim.min.js',
		'systemjs/dist/system-polyfills.js',
		'systemjs/dist/system.src.js',
		'reflect-metadata/Reflect.js',
		'rxjs/**/*.js',
		'zone.js/dist/**',
		'@angular/**/bundles/**',
		'flickity/dist/flickity.pkgd.min.js',
		'flickity/dist/flickity.min.css'
	], { cwd: "node_modules/**" })
		.pipe(gulp.dest("lab/assets/vendor"));
});





/* ---- ==== DISTILLERY TASKS ==== ---- */

/* General */

// Build
gulp.task('build', function (callback) {
	runSequence(
		'clean', // Deletes the distillery.
		'markup', // Replaces Markup.
		'useref', // Optimises and replaces CSS and vendor JS.
		'vendor', // Optimises and replaces Vendor JS. NOTE: Slows the build process signifincantly.
		'app', // Optimises and replaces app JS.
		'images', // Optimises and replaces Images.
		'fonts', // Replaces Fonts.
		'data', // Replaces Data.
		'config', // Replaces config files.

		['browserSync:distillery'], // Launches BrowserSync.
		callback
	)
})

// Clean
gulp.task('clean', (callback) => {
	return del(["distillery"], callback)
});

// Create Distillery Server
gulp.task('browserSync:distillery', function () {
	browserSync({
		port: 8,
		server: {
			baseDir: 'distillery',
			index: 'index.htm',
			middleware: [
				require('connect-history-api-fallback')({ index: '/index.htm' })
			]
		},
		ui: false,
		logLevel: "info",
		logFileChanges: false
	})
})


/* Markup */

// Replaces markup.
gulp.task("markup", () => {
	return gulp.src(["lab/**/{.htm,html/**}"])
		.pipe(gulp.dest("distillery"));
});


/* Concatenate */

// Concatenates CSS and JavaScript.
gulp.task('useref', function () {
	return gulp.src('lab/**/*.htm')
		.pipe(useref())
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', cssnano()))
		.pipe(gulp.dest('distillery'))
});


/* Vendor */

// Concatenates vendor JavaScript and CSS.
gulp.task('vendor', function () {
	return gulp.src('lab/assets/vendor/**/*')
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulpIf('*.css', cssnano()))
		.pipe(gulp.dest('distillery/assets/vendor/'))
});


/* App JS */

//Optimises and replaces App JS.
gulp.task("app", () => {
	return gulp.src('lab/app/**/*.js')
		.pipe(uglify())
		.pipe(gulp.dest("distillery/app"));
});


/* Images */

// Optimises and replaces images.
gulp.task('images', function () {
	return gulp.src('lab/assets/images/**/*.+(png|jpg|jpeg|gif|ico|svg)')
		.pipe(gulpIf('*.+(png|jpg|jpeg|gif|ico)', cache(imagemin({//Bug running on svg files.
			interlaced: true
		}))))
		.pipe(gulp.dest('distillery/assets/images/'))
});


/* Fonts */

//Replaces fonts.
gulp.task('fonts', function () {
	return gulp.src('lab/assets/fonts/**/*')
		.pipe(gulp.dest('distillery/assets/fonts'))
})


/* Data */

//Replaces fonts.
gulp.task('data', function () {
	return gulp.src('lab/data/**/*.json')
		.pipe(gulp.dest('distillery/data'))
})


/* Config */

//Relaces config files.
gulp.task("config", () => {
	return gulp.src(["lab/*.+(js|config)"])
		.pipe(gulpIf('*.js', uglify()))
		.pipe(gulp.dest("distillery/"));
});