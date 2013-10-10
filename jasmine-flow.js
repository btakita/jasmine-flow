/* Copyright Brian Takita under the MIT License */
(function(root) {
  root.flow = function flow(name, def) {
    var steps = []
      , checkEnabled = true
      , instance
      ;
    function main() {
      if (jasmine.getEnv().currentSuite) {
        callIt();
      } else {
        describe("", callIt);
      }
      instance = {
        step: step,
        xstep: noop,
        check: check,
        xcheck: noop,
        aver: check,
        xaver: noop,
        macro: macro,
        xmacro: noop,
        stop: stop,
        log: function(name) {
          steps.push(function() {console.log(name)});
          return instance;
        },
        info: function(name) {
          steps.push(function() {console.info(name)});
          return instance;
        }
      };
      if (def) def(instance);
    }
    function callIt() {
      it(name, function(done) {
        function callStep(steps, i, length) {
          if (i < length) {
            var step = steps[i];
            if (step) {
              if (step.done) {
                if (done) done();
              } else if (step.length > 0) {
                step(function() {
                  callStep(steps, i+1, length);
                });
              } else {
                step();
                callStep(steps, i+1, length);
              }
            } else {
              callStep(steps, i+1, length);
            }
          } else {
            if (done) done();
          }
        }
        callStep(steps, 0, steps.length);
      });
    }
    function noop() { }
    function step(name, fn) {
      if (fn) {
        instance.log(name);
      } else {
        fn = name;
      }
      steps.push(fn);
      return instance;
    }
    function check(name, fn) {
      if (checkEnabled) {
        if (fn) {
          instance.log(name);
        } else {
          fn = name;
        }
        steps.push(fn);
      }
      return instance;
    }
    function macro(fn) {
      fn.apply(instance, [instance]);
      return instance;
    }
    function stop() {
      steps.push({done: true});
      return instance;
    }
    main();
    return instance;
  };
  if (typeof module !== "undefined") {
    if (module.exports) {
      module.exports = root.flow;
    }
  }
})(this);