'use strict';
const statsClient = require('./statsd');
const decompression = require('resourcetiming-compression').ResourceTimingDecompression;
const environment = require('config').get('env');

function normaliseString(string, isDomain) {
  let name = 'unknown';
  const overrides = [
    {'key': 'test', 'match': 'test.com'},
    {'key': 'example', 'match': 'example.net'}
  ];

  if (!string || !string.length || typeof string !== 'string') {
    return name;
  }

  overrides.some((override) => {
    if (string.indexOf(override.match) >= 0) {
      name = override.key;
      return true;
    }
    return false;
  });

  if (name === 'unknown') {
    if (isDomain) {
      const match = string.match(/^https?\:\/\/([^\/?#]+)(?:.charlie\.im)/i);
      if (match && match[1]) {
        name = match[1];
      }
    } else {
      name = string.substring(string.lastIndexOf('/') + 1);
    }
    name = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  }
  return name;
}

function blockStats(pageType, resources) {
  const found = resources.some((resource) => resource.name.includes('//www.google-analytics.com'));
  if (!found) {
    statsClient.increment(`client.${environment}.${pageType}.blockstat`);
  }
}

function validate(time) {
  const oneMinute = 60000;
  const zero = 0;
  return (time > zero && time < oneMinute);
}

function sendStat(pageType, type, value) {
  if (validate(value)) {
    statsClient.timing(`client.${environment}.${pageType}.${type}`, value);
  }
}

function generateStat(pageType, stat) {
  const statsArray = [
    {'key': 'complete', 'value': stat.domInteractive - stat.domComplete},
    {'key': 'interactive', 'value': stat.domInteractive - stat.domLoading},
    {'key': 'load', 'value': stat.loadEventEnd - stat.loadEventStart},
    {'key': 'dom', 'value': stat.domContentLoadedEventEnd - stat.domContentLoadedEventStart},
    {'key': 'dns', 'value': stat.domainLookupEnd - stat.domainLookupStart},
    {'key': 'ssl', 'value': stat.secureConnectionStart - stat.connectStart},
    {'key': 'tcp', 'value': stat.connectEnd - (stat.secureConnectionStart ? stat.secureConnectionStart : stat.connectStart)},
    {'key': 'redirect', 'value': stat.redirectEnd - stat.redirectStart},
    {'key': 'response', 'value': stat.responseStart ? (stat.responseEnd - stat.responseStart) : 0},
    {'key': 'unload', 'value': stat.unloadEventEnd - stat.unloadEventStart},
    {'key': 'duration', 'value': (stat.duration ? stat.duration : (stat.loadEventEnd - stat.navigationStart))},
    {'key': 'request', 'value': stat.responseStart - stat.requestStart}
  ];

  if (stat.initiatorType) {
    pageType += `.${normaliseString(stat.initiatorType)}`;
  }
  if (stat.name) {
    pageType += `.${normaliseString(stat.name, stat.initiatorType)}`;
  }

  statsArray.forEach((item) => {
    sendStat(pageType, item.key, item.value);
  });
}

module.exports = {
  update(page) {
    const pageType = normaliseString(page.page_type);
    if (page.timing) {
      generateStat(pageType, page.timing);
    }
    if (page.resource) {
      const resources = Array.isArray(page.resource) ? page.resource : decompression.decompressResources(page.resource);
      blockStats(pageType, resources);
      resources.forEach((item) => {
        generateStat(pageType, item);
      });
    }
  }
};
