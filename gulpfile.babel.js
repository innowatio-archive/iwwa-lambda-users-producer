import gulp from "gulp";
import eslint from "gulp-eslint";
import mocha from "gulp-spawn-mocha";
import lambdaDeploy from "lambda-deploy";

gulp.task("deploy", function () {
    return lambdaDeploy();
});

gulp.task("test", function () {
    return gulp.src(["test/**/*.js"])
        .pipe(mocha({
            compilers: "js:babel/register",
            env: {
                NODE_ENV: "test",
                NODE_PATH: "./src/"
            },
            istanbul: true
        }));
});

gulp.task("lint", function () {
    return gulp.src(["src/**/*.js"])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task("default", ["test", "lint"], function () {
    return gulp.watch(["src/**/*.js", "test/**/*.js"], ["test", "lint"]);
});
