import gulp from 'gulp'
import babel from 'gulp-babel'
import cache from 'gulp-cached'

const flow = 'src/index.js.flow'

const paths = {
  src: 'src/**/*'
}

gulp.task('transpile', ['flow'], () => gulp.src([paths.src, '!' + flow])
  .pipe(cache('src'))
  .pipe(babel())
  .pipe(gulp.dest('dist')))

gulp.task('watch', () => {
  gulp.watch(paths.src, ['transpile'])
})

gulp.task('flow', () => gulp.src(flow)
  .pipe(gulp.dest('dist')))

gulp.task('default', ['watch', 'transpile', 'flow'])
