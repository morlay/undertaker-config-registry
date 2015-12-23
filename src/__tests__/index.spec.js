import { expect } from 'chai';

import Undertaker from 'undertaker';
import UndertakerConfigRegistry from '../index';

describe(__filename, () => {
  let config;
  let taskConfFns;
  let taskDefFns;

  beforeEach(() => {
    config = {
      src: '/'
    };
    taskConfFns = {
      clean: () => {
        return {};
      }
    };
    taskDefFns = {
      clean: () => {
        return {};
      }
    };
  });

  context('when create', () => {
    it('should bind config & taskConfFns & taskDefFns', () => {
      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      expect(undertakerConfigRegistry.config).to.eql(config);
      expect(undertakerConfigRegistry.taskConfFns).to.eql(taskConfFns);
      expect(undertakerConfigRegistry.taskDefFns).to.eql(taskDefFns);
    });
  });

  context('when init', () => {
    let taker;

    beforeEach(() => {
      taker = new Undertaker();
    });

    it('should bind auto init tasks by taskDefFns', () => {
      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, null, taskDefFns);

      taker.registry(undertakerConfigRegistry);

      expect(undertakerConfigRegistry.get('clean')).is.a('function');
    });
  });

  context('when task running', () => {
    let taker;

    beforeEach(() => {
      taker = new Undertaker();
    });

    it('should show error, if taskConfFn is not return an object', () => {
      taskConfFns.clean = function clean() {
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      expect(() => {
        undertakerConfigRegistry.get('clean')();
      }).to.throw('');
    });

    it('should make commonConfig as taskConf, if taskConfFn is missing', () => {
      taskDefFns.clean = function clean(conf) {
        expect(conf).to.eql(config);
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, null, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      undertakerConfigRegistry.get('clean')();
    });

    it('taskConfFn should get common config', () => {
      taskConfFns.clean = (conf) => {
        expect(conf).to.eql(config);
        return conf;
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      undertakerConfigRegistry.get('clean')();
    });

    it('should get taskConfFn in some folder', () => {
      taskConfFns.clean = {
        index: (conf) => {
          expect(conf).to.eql(config);
          return conf;
        }
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      undertakerConfigRegistry.get('clean')();
    });

    it('should get taskConfFn from babel compiled source ', () => {
      taskConfFns.clean = {
        default: (conf) => {
          expect(conf).to.eql(config);
          return conf;
        }
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      undertakerConfigRegistry.get('clean')();
    });


    it('taskDefFn should get task config', () => {
      taskConfFns.clean = (conf) => {
        return { src: conf.src + '**' };
      };

      taskDefFns.clean = function clean(taskConf) {
        expect(taskConf).to.eql(taskConfFns.clean(config));
      };

      const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
      taker.registry(undertakerConfigRegistry);

      undertakerConfigRegistry.get('clean')();
    });

    context('multi configuration', () => {
      it('taskDefFn should call multi and auto merge options', () => {
        taskConfFns.clean = (conf) => {
          return {
            files: [
              {
                src: conf.src + '**',
                options: {
                  a: 2
                }
              },
              { src: conf.src + '**/1' }
            ],
            options: {
              a: 1
            }
          };
        };

        const results = [];

        taskDefFns.clean = function clean(taskConf, done) {
          results.push(taskConf);
          done();
        };

        const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
        taker.registry(undertakerConfigRegistry);

        undertakerConfigRegistry.get('clean')(() => {
          const taskConf = taskConfFns.clean(config).files.length;
          expect(results.length).to.eql(taskConf.length);
          expect(results[0]).to.eql({
            ...taskConf.files[0],
            options: {
              ...taskConf.options,
              ...taskConf.files[0].options
            }
          });
          expect(results[1]).to.eql({
            ...taskConf.files[1],
            options: taskConf.options
          });
        });
      });
    });

    context('dev model', () => {
      it('taskDefFn should call watch function', () => {
        taskConfFns.clean = (conf) => {
          return { src: conf.src + '**' };
        };

        function clean(taskConf) {
          expect(taskConf).to.eql(taskConfFns.clean(config));
        }

        clean.watch = (taskConf, taskFn) => {
          expect(taskConf).to.eql(taskConfFns.clean(config));
          expect(taskFn.displayName).to.eql('clean');
          expect(taskFn.name).to.eql('taskRunner');
        };

        taskDefFns.clean = clean;

        const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
        taker.registry(undertakerConfigRegistry);

        undertakerConfigRegistry.enableDevMode();

        undertakerConfigRegistry.get('clean')();
      });

      it('some callback settings should set before task running', () => {
        taskConfFns.clean = (conf) => {
          return { src: conf.src + '**' };
        };

        function clean(taskConf) {
          expect(global.SOME_TEST).to.eql(1);
          expect(taskConf).to.eql(taskConfFns.clean(config));
        }

        clean.watch = (taskConf, taskFn) => {
          expect(global.SOME_TEST).to.eql(1);
          expect(taskConf).to.eql(taskConfFns.clean(config));
          expect(taskFn.displayName).to.eql('clean');
          expect(taskFn.name).to.eql('taskRunner');
        };

        taskDefFns.clean = clean;

        const undertakerConfigRegistry = new UndertakerConfigRegistry(config, taskConfFns, taskDefFns);
        taker.registry(undertakerConfigRegistry);

        undertakerConfigRegistry.enableDevMode(() => {
          global.SOME_TEST = 1;
        });

        undertakerConfigRegistry.get('clean')();
      });
    });
  });
});
