var Promise = require('promise');
var assert = require('better-assert');
var throat = require('./');

function job() {
  var resolve, reject;
  var promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  var isRun = false;
  function executeJob() {
    if (isRun) throw new Error('Job was run multiple times');
    isRun = true;
    return promise;
  }
  executeJob.fail = function (err) {
    reject(err);
  };
  executeJob.complete = function (val) {
    resolve(val);
  };
  executeJob.isRun = function () {
    return isRun;
  };
  return executeJob;
}
describe('throat(n)', function () {
  it('returns a throttle function with n workers', function () {
    assert(typeof throat(2) === 'function');
  });
  describe('.workers()', function () {
    it('returns the number of workers', function () {
      assert(throat(2).workers() === 2);
    });
  });
  describe('.workers(n)', function () {
    it('sets the number of workers to n', function () {
      var t2 = throat(2);
      t2.workers(5);
      assert(t2.workers() === 5);
    });
  });
  describe('.running()', function () {
    it('returns the number of running jobs', function (done) {
      var t2 = throat(2);
      assert(t2.running() === 0);
      var j = job();
      t2(j);
      assert(t2.running() === 1);
      j.complete(true);
      setTimeout(function () {
        assert(t2.running() === 0);
        done();
      }, 5);
    });
  });
});