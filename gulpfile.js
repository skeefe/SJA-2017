/* ---- ==== PLUGINS ==== ---- */

// General
var gulp = require('gulp');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var gulpIf = require('gulp-if');
var del = require('del');

// Styles
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');

// Images
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');

// JS
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');



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
			index: 'index.htm'
		},
		ui: false,
		logLevel: 'info',
		logFileChanges: false
	})
})


/* Styles */

// Compiles SASS
gulp.task('sass', function () {
	return gulp.src('lab/assets/scss/sja.scss') // Retrieves sja.scss
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
gulp.task('vendor', () => {
	return gulp.src([
		'flickity/dist/flickity.pkgd.min.js',
		'flickity/dist/flickity.min.css'
	], { cwd: 'node_modules/**' })
		.pipe(gulp.dest('lab/assets/vendor'));
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
		'images', // Optimises and replaces Images.
		'fonts', // Replaces Fonts.

		['browserSync:distillery'], // Launches BrowserSync.
		callback
	)
})

// Clean
gulp.task('clean', (callback) => {
	return del(['distillery'], callback)
});

// Create Distillery Server
gulp.task('browserSync:distillery', function () {
	browserSync({
		port: 8,
		server: {
			baseDir: 'distillery',
			index: 'index.htm'
		},
		ui: false,
		logLevel: 'info',
		logFileChanges: false
	})
})


/* Markup */

// Replaces markup.
gulp.task('markup', () => {
	return gulp.src(['lab/**/{.htm,html/**}'])
		.pipe(gulp.dest('distillery'));
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