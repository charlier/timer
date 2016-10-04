'use strict';
const statsd = require('node-statsd').StatsD;
const statsClient = new statsd('localhost', 8125);

module.exports = {
  timing(key, value) {
    statsClient.timing(key, value);
  },
  increment(key) {
    statsClient.increment(key);
  }
};
