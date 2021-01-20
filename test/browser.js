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
    var version = +platform.version;
    switch (platform.browserName) {
      case 'MicrosoftEdge':
        return version === 15 || version >= 87;
      case 'internet explorer':
        return false;
      case 'chrome':
        return version === 55 || version >= 87;
      case 'firefox':
        return version === 52 || version >= 84;
      case 'safari':
        return version === 12 || version >= 14;
      case 'iphone':
      case 'ipad':
        return version === 11.0 || version >= 14;
      case 'android':
        return false;
      default:
        return defaultFilter(platform);
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
