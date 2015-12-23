## Undertaker Config Registry

A registry for Gulp 4 ([Undertaker](https://github.com/gulpjs/undertaker))

[![Build Status](https://img.shields.io/travis/morlay/undertaker-config-registry.svg?style=flat-square)](https://travis-ci.org/morlay/undertaker-config-registry)
[![NPM](https://img.shields.io/npm/v/undertaker-config-registry.svg?style=flat-square)](https://npmjs.org/package/undertaker-config-registry)
[![Dependencies](https://img.shields.io/david/morlay/undertaker-config-registry.svg?style=flat-square)](https://david-dm.org/morlay/undertaker-config-registry)
[![License](https://img.shields.io/npm/l/undertaker-config-registry.svg?style=flat-square)](https://npmjs.org/package/undertaker-config-registry)

### How to work

```
commonConf |> taskConfFn => taskConf |> taskDefFn => task
```

#### Gulp Structure

```
gulpfile.babel.js/
config/
  copy.js
tasks/
  copy.js
index.js
```

** filename should be prefer the task name **


```js
// config/copy.js
export default (conf) => {
  return {
    src: `${conf.src}/**`,
    output: `${conf.dist}`
  }
}
```

```js
// tasks/copy.js
import gulp from 'gulp';

function copy(taskConf) {
  return gulp.src(taskConf.src)
    .pipe(gulp.dest(taskConf.output));
}

copy.watch = function copyWatch(taskConf, taskFn) {
  gulp.watch(taskConf.src, taskFn);
};

export default copy;
```


```js
// index.js
import gulp from 'gulp';
import requireDir from 'require-dir';
import ConfigRegistry from 'undertaker-config-registry';

const baseConfig = {
  src: './src',
  dist: './public'
};

const configRegistry = new ConfigRegistry(
  baseConfig,
  requireDir('./config', {
    recurse: true
  }),
  requireDir('./tasks')
);
```

Run `gulp copy` will be work well or defined custom task queues by `gulp.series` or `gulp.parallel`

##### Dev mode

`taskDefFn.watch` will be called only in dev model

```js
configRegistry.enableDevMode(() => {
  // other configuration for dev model
  // ex.
  // process.env.BABEL_ENV = 'development';
})
```

##### Mutli configure

For `taskConfFn`, a special hook be provided.
`files` will help to create sub task and will merge common `options` which exists,
without changing `TaskDefFn`

ex.

```js
export default (conf) => {
  return {
    files: [{
      src: `${conf.src}/target1/**`,
      output: `${conf.dist}/target1`,
      options: {
        a: 2,
        b: 1
      }
    }, {
      src: `${conf.src}/target2/**`,
      output: `${conf.dist}/target2`
    }],
    options: {
      a: 1
    }
  }
}
```

will be

```js
// taskConf_0
{
  src: `${conf.src}/target1/**`,
  output: `${conf.dist}/target1`,
  options: {
    a: 2,
    b: 1
  }
}

// taskConf_1
{
  src: `${conf.src}/target1/**`,
  output: `${conf.dist}/target1`,
  options: {
    a: 1
  }
}
```
