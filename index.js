var Promise = require('promise');

module.exports = throttler;
function throttler(concurrency) {
  var inProgress = 0;
  var queue = [];
  function throttle(fn) {
    if (typeof fn != 'function') {
      return reject(new TypeError(fn + ' is not a function.'));
    }
    if (idle() > 0) {
      var result = resolve(null)
        .then(function () {
          return fn();
        });
      inProgress++;
      result.then(null, function () {})
            .then(function () {
              inProgress--;
              if (queue.length) {
                queue.shift()();
              }
            });
      return result;
    } else {
      return new Promise(function (resolve, reject) {
        queue.push(function () {
          resolve(throttle(fn));
        });
      });
    }
  }
  throttle.workers = workers;
  function workers(val) {
    if (typeof val === 'number')
      return concurrency = val;
    else return concurrency;
  }
  throttle.running = running;
  function running() {
    return inProgress;
  }
  throttle.idle = idle;
  function idle() {
    return concurrency - inProgress;
  }

  throttle.workOn = function (source, worker, errHandler) {
    errHandler = errHandler || function (err) { throw err; };
    function nextJob() {
      throttle(function () {
        return source()
          .then(function (job) {
            nextJob();
            return worker(job);
          });
      })
      .then(null, function (err) {
        process.nextTick(function () {
          errHandler(err);
        });
      });
    }
    nextJob();
  };
  return throttle;
}

function resolve(value) {
  return new Promise(function (resolve) {
    resolve(value);
  });
}
function reject(reason) {
  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}