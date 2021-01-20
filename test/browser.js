'use strict';

var run = require('sauce-test');
var testResult = require('test-result');

var LOCAL = !process.env.CI && process.argv[2] !== 'sauce';
var USER = 'throat';
var ACCESS_KEY = '57db1bf4-537a-4bde-ab8b-1e82eed9db4b';

run(__dirname + '/index.js', LOCAL ? 'chromedriver' : 'saucelabs', {
  username: USER,
  accessKey: ACCESS_KEY,
  browserify: true,
  disableSSL: true,
  filterPlatforms: function (platform, defaultFilter) {
    // exclude some arbitrary browsers to make tests
    // run faster.  Also excludes beta versions of browsers
    if (!defaultFilter(platform)) return false;
    // these platforms don't support ES5
    var version = +platform.version;
    switch (platform.browserName) {
      case 'MicrosoftEdge':
        return version >= 15;
      case 'internet explorer':
        return false;
      case 'chrome':
        return version >= 55;
      case 'firefox':
        return version >= 52;
      case 'safari':
        return version >= 10.1;
      case 'iphone':
        return version >= 11.0;
      case 'ipad':
        return version >= 13.0;
      case 'android':
        return false;
      default:
        return true;
    }
  },
  bail: true,
  timeout: '30s',
}).done(function (result) {
  if (result.passed) {
    testResult.pass('browser tests');
  } else {
    testResult.fail('browser tests');
  }
});
