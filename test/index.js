'use strict';

var assert = require('assert');
var fs = require('fs');
var test = require('testit');
var throat = require('../');

var sentA = {},
  sentB = {},
  sentC = {};
function job() {
  var resolve, reject;
  var promise = new Promise(function (_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });
  function executeJob() {
    if (executeJob.isRun) throw new Error('Job was run multiple times');
    executeJob.isRun = true;
    executeJob.args = Array.prototype.slice.call(arguments);
    return promise;
  }
  executeJob.fail = function (err) {
    reject(err);
  };
  executeJob.complete = function (val) {
    resolve(val);
  };
  executeJob.isRun = false;
  return executeJob;
}

function Processed(val) {
  this.val = val;
}
function worker(max) {
  var concurrent = 0;
  function execute() {
    concurrent++;
    if (concurrent > max)
      throw new Error('Extra processes were run in parallel.');
    var res = new Processed(Array.prototype.slice.call(arguments));
    return new Promise(function (resolve) {
      setTimeout(function () {
        concurrent--;
        resolve(res);
      }, 100);
    });
  }
  return execute;
}

test('throat(n)', function () {
  test('throat(1) acts as a lock', function () {
    var lock = throat(1);
    var a = job(),
      b = job(),
      c = job();
    var resA = lock(a, 123);
    var resB = lock(b, 456);
    var resC = lock(c, 789);
    assert(a.isRun);
    assert(!b.isRun);
    assert(!c.isRun);
    a.complete(sentA);
    return resA
      .then(function (resA) {
        assert(resA === sentA);
        assert(a.isRun);
        assert(b.isRun);
        assert(!c.isRun);
        b.fail(sentB);
        return resB.then(
          function () {
            throw new Error('b should have been rejected');
          },
          function (errB) {
            assert(errB === sentB);
          }
        );
      })
      .then(function () {
        assert(a.isRun);
        assert(b.isRun);
        assert(c.isRun);
        assert.deepEqual(a.args, [123]);
        assert.deepEqual(b.args, [456]);
        assert.deepEqual(c.args, [789]);
        c.complete(sentC);
        return resC;
      })
      .then(function (resC) {
        assert(resC === sentC);
      });
  });
  test('throat(2) lets two processes acquire the same lock', function () {
    var lock = throat(2);
    var a = job(),
      b = job(),
      c = job();
    var resA = lock(a);
    var resB = lock(b);
    var resC = lock(c);
    assert(a.isRun);
    assert(b.isRun);
    assert(!c.isRun);
    a.complete(sentA);
    return resA
      .then(function (resA) {
        assert(resA === sentA);
        assert(a.isRun);
        assert(b.isRun);
        assert(c.isRun);
        b.fail(sentB);
        return resB.then(
          function () {
            throw new Error('b should have been rejected');
          },
          function (errB) {
            assert(errB === sentB);
          }
        );
      })
      .then(function () {
        assert(a.isRun);
        assert(b.isRun);
        assert(c.isRun);
        c.complete(sentC);
        return resC;
      })
      .then(function (resC) {
        assert(resC === sentC);
      });
  });
  test('throat(3) lets three processes acquire the same lock', function () {
    var lock = throat(3);
    var a = job(),
      b = job(),
      c = job();
    var resA = lock(a);
    var resB = lock(b);
    var resC = lock(c);
    assert(a.isRun);
    assert(b.isRun);
    assert(c.isRun);
    a.complete(sentA);
    return resA
      .then(function (resA) {
        assert(resA === sentA);
        assert(a.isRun);
        assert(b.isRun);
        assert(c.isRun);
        b.fail(sentB);
        return resB.then(
          function () {
            throw new Error('b should have been rejected');
          },
          function (errB) {
            assert(errB === sentB);
          }
        );
      })
      .then(function () {
        assert(a.isRun);
        assert(b.isRun);
        assert(c.isRun);
        c.complete(sentC);
        return resC;
      })
      .then(function (resC) {
        assert(resC === sentC);
      });
  });
});

test('throat(n, fn)', function () {
  test('throat(1, fn) acts as a sequential worker', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(1, worker(1)))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
  test('throat(2, fn) works on two inputs in parallel', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(2, worker(2)))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
  test('throat(3, fn) works on three inputs in parallel', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(3, worker(3)))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
});

test('throat(fn, n)', function () {
  test('throat(fn, 1) acts as a sequential worker', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(worker(1), 1))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
  test('throat(fn, 2) works on two inputs in parallel', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(worker(2), 2))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
  test('throat(fn, 3) works on three inputs in parallel', function () {
    return Promise.all([sentA, sentB, sentC].map(throat(worker(3), 3))).then(
      function (res) {
        assert(
          res[0] instanceof Processed &&
            res[0].val.length > 1 &&
            res[0].val[0] === sentA
        );
        assert(
          res[1] instanceof Processed &&
            res[1].val.length > 1 &&
            res[1].val[0] === sentB
        );
        assert(
          res[2] instanceof Processed &&
            res[2].val.length > 1 &&
            res[2].val[0] === sentC
        );
      }
    );
  });
});

test('type errors', function () {
  test('size as a string', function () {
    try {
      throat('foo');
    } catch (ex) {
      assert(/Expected throat size to be a number/.test(ex.message));
      return;
    }
    throw new Error('Expected a failure');
  });
  test('fn as a string', function () {
    try {
      throat(2, 'foo');
    } catch (ex) {
      assert(/Expected throat fn to be a function/.test(ex.message));
      return;
    }
    throw new Error('Expected a failure');
  });
  test('late fn as a string', function () {
    try {
      throat(2)('foo');
    } catch (ex) {
      assert(/Expected throat fn to be a function/.test(ex.message));
      return;
    }
    throw new Error('Expected a failure');
  });
});

test('sync errors are converted to async errors', function () {
  var lock = throat(1);
  return Promise.all([
    lock(() => {
      throw new Error('whatever');
    }).catch(() => true),
    lock(() => {
      throw new Error('whatever');
    }).catch(() => true),
    lock(() => {
      throw new Error('whatever');
    }).catch(() => true),
  ]).then((results) => {
    assert.deepStrictEqual(results, [true, true, true]);
  });
});

test('handles loads of promises', function () {
  var lock = throat(1, (i) => Promise.resolve(i));
  var results = [];
  var expected = [];
  for (var i = 0; i < 64 * 10 + 1; i++) {
    results.push(lock(i));
    expected.push(i);
  }
  return Promise.all(results).then((results) => {
    assert.deepStrictEqual(results, expected);
  });
});

async function supportsAsyncStackTraces() {
  async function innerFunction() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    throw new Error('whatever');
  }
  async function myOuterFunction() {
    await innerFunction();
  }
  try {
    await myOuterFunction();
  } catch (ex) {
    return ex.stack && /myOuterFunction/.test(ex.stack);
  }
  return false;
}

test('stack traces', async function () {
  if (!(await supportsAsyncStackTraces())) {
    console.warn('Async stack traces not supported');
    return;
  }
  var lock = throat(1);

  async function myInnerFunction() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    throw Object.assign(new Error('My Error'), {code: 'MY_ERROR'});
  }
  async function myOuterFunction() {
    await lock(myInnerFunction);
  }
  return Promise.all([
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
  ]);
});
test('stack traces - ready provided fn', async function () {
  if (!(await supportsAsyncStackTraces())) {
    console.warn('Async stack traces not supported');
    return;
  }
  var lock = throat(1, async function myInnerFunction() {
    await new Promise((resolve) => setTimeout(resolve, 10));
    throw Object.assign(new Error('My Error'), {code: 'MY_ERROR'});
  });
  async function myOuterFunction() {
    await lock();
  }
  return Promise.all([
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
    myOuterFunction().then(
      () => {
        throw new Error('Expected an error to be thrown');
      },
      (ex) => {
        assert(
          /myInnerFunction/.test(ex.stack),
          `Stack should include myInnerFunction: ${ex.stack}\n\n`
        );
        assert(
          /myOuterFunction/.test(ex.stack),
          `Stack should include myOuterFunction: ${ex.stack}\n\n`
        );

        assert.strictEqual(ex.code, 'MY_ERROR');
        assert.strictEqual(ex.message, 'My Error');
      }
    ),
  ]);
});
