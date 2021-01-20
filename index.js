'use strict';

var fakeResolvedPromise = {
  then: function (fn) {
    return fn();
  },
};
module.exports = function throat(size, fn) {
  var queue = new Queue();
  function run(fn, self, args) {
    var ready = size
      ? fakeResolvedPromise
      : new Promise(function (resolve) {
          queue.push(resolve);
        });
    if (size) {
      size--;
    }
    return ready
      .then(function () {
        return new Promise(function (resolve) {
          resolve(fn.apply(self, args));
        });
      })
      .then(
        function (result) {
          release();
          return result;
        },
        function (err) {
          release();
          throw err;
        }
      );
  }
  function release() {
    var next = queue.shift();
    if (next) {
      next();
    } else {
      size++;
    }
  }
  if (typeof size === 'function') {
    var temp = fn;
    fn = size;
    size = temp;
  }
  if (typeof size !== 'number') {
    throw new TypeError(
      'Expected throat size to be a number but got ' + typeof size
    );
  }
  if (fn !== undefined && typeof fn !== 'function') {
    throw new TypeError(
      'Expected throat fn to be a function but got ' + typeof fn
    );
  }
  if (typeof fn === 'function') {
    return function () {
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      return run(fn, this, args);
    };
  } else {
    return function (fn) {
      if (typeof fn !== 'function') {
        throw new TypeError(
          'Expected throat fn to be a function but got ' + typeof fn
        );
      }
      var args = [];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      return run(fn, this, args);
    };
  }
};

module.exports.default = module.exports;

function Queue() {
  this._s1 = [];
  this._s2 = [];
}

Queue.prototype.push = function (value) {
  this._s1.push(value);
};

Queue.prototype.shift = function () {
  var s2 = this._s2;
  if (s2.length === 0) {
    var s1 = this._s1;
    if (s1.length === 0) {
      return undefined;
    }
    this._s1 = s2;
    s2 = this._s2 = s1.reverse();
  }
  return s2.pop();
};
