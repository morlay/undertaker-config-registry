import DefaultRegistry from 'undertaker-registry';
import _ from 'lodash';

class UndertakerConfigRegistry extends DefaultRegistry {
  constructor(config, taskConfFns, taskDefFns) {
    super();
    this.config = config || {};
    this.taskConfFns = taskConfFns || {};
    this.taskDefFns = taskDefFns || {};
  }

  init(taker) {
    this.taker = taker;
    _.forIn(this.taskDefFns, (originTaskDefFn, key) => {
      const taskDefFn = this.resolveFn(originTaskDefFn); // babel 6 support
      const taskName = taskDefFn.displayName || taskDefFn.name;

      if (taskName !== key) {
        console.log(`${taskName}'s 'export default function' is not same as filename in ${taskName}.js`);
      }

      const finalTaskFn = this.getTaskFn(taskName, this.getTaskConf.bind(this, taskName), taskDefFn);
      this.set(taskName, finalTaskFn);
    });
  }

  getTaskFn(originTaskName, originTaskConfFn, originTaskFn) {
    const createTaskFn = (taskName, taskConfFn, taskFn) => {
      let _firstRun = true;
      const taskRunner = (done) => {
        const taskConf = taskConfFn();

        if (!_.isObject(taskConf)) {
          throw new Error(`taskConfFn for ${taskName} should return object`);
        }

        const commonOptions = taskConf.options || {};

        if (_.isArray(taskConf.files)) {
          const taskConfList = [].concat(taskConf.files);

          const subTask = this.taker.parallel.apply(this.taker, _.map(taskConfList, (subTaskConf) => {
            const subTaskConfFn = () => _.merge({}, { options: commonOptions }, subTaskConf);
            return createTaskFn(`__${taskName}`, subTaskConfFn, taskFn);
          }));

          return subTask(done);
        }

        if (_firstRun && _.isFunction(taskFn.watch) && this.DEV_MODE) {
          taskFn.watch(taskConf, taskRunner);
          _firstRun = false;
        }

        return taskFn(taskConf, done);
      };

      taskRunner.displayName = taskName;
      return taskRunner;
    };

    return createTaskFn(originTaskName, originTaskConfFn, originTaskFn);
  }

  getTaskConf(taskName) {
    try {
      const taskConfFn = this.resolveFn(this.taskConfFns[taskName]);
      return taskConfFn(_.merge({}, this.config));
    } catch (e) {
      console.log(`taskConfFn for '${taskName}' is not defined, fallback return common config`);
      return _.merge({}, this.config);
    }
  }

  resolveFn(fn) {
    // could put config function in folder
    const folderCheckedFn = fn.index || fn;
    // babel 6 support
    return folderCheckedFn.default || folderCheckedFn;
  }

  enableDevMode(callback) {
    return new Promise((resolve) => {
      this.DEV_MODE = true;
      if (_.isFunction(callback)) {
        callback();
      }
      resolve();
    });
  }
}

export default UndertakerConfigRegistry;
