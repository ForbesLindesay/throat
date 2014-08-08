# throat

Throttle the parallelism of an asynchronous, promise returning, function / functions.  This has special utility when you set the concurrency to `1`.  That way you get a mutually exclusive lock.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/throat/master.svg)](https://travis-ci.org/ForbesLindesay/throat)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/throat.svg)](https://gemnasium.com/ForbesLindesay/throat)
[![NPM version](https://img.shields.io/npm/v/throat.svg)](http://badge.fury.io/js/throat)

## Installation

    npm install throat

## API

### throat(concurrency)

This returns a function that acts a bit like a lock (exactly as a lock if concurrency is 1).

Example, only 2 of the following functions will execute at any one time:

```js
var Promise = require('promise')
var throat = require('throat')(Promise)
var throat2 = throat(2)

var resA = throat2(function () {
  //async stuff
  return promise
})
var resA = throat2(function () {
  //async stuff
  return promise
})
var resA = throat2(function () {
  //async stuff
  return promise
})
var resA = throat2(function () {
  //async stuff
  return promise
})
var resA = throat2(function () {
  //async stuff
  return promise
})
```

### throat(concurrency, worker)

This returns a function that is an exact copy of `worker` except that it will only execute up to `concurrency` times in parallel before further requests are queued:

```js
var input = ['fileA.txt', 'fileB.txt', 'fileC.txt', 'fileD.txt']
var data = Promise.all(input.map(throat(2, function (fileName) {
  return readFile(fileName)
})))
```

Only 2 files will be read at a time, sometimes limiting parallelism in this way can improve scalability.

## License

  MIT