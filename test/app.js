'use strict';

const statsd = require('./../app/statsd');
const timer = require('./../app/timer');
const sinon = require('sinon');

describe('Basic tests', () => {
  let spy;

  beforeEach(() => {
    spy = sinon.stub(statsd, 'timing');
  });
  afterEach(() => {
    statsd.timing.restore();
  });

  describe('Basic Functionality', () => {
    it('does not call statsD when there is no data', () => {
      timer.update({});
      sinon.assert.notCalled(spy);
    });
    it('does not call statsd when there is incomplete data', () => {
      timer.update({page_type: 'taylor'});
      sinon.assert.notCalled(spy);
    });
    it('does not call statsd when there is incorrect data', () => {
      timer.update({timing: {
        domInteractive: 0,
        domComplete: 0
      }});
      sinon.assert.notCalled(spy);
    });
    it('does not call statsd when there is invalid data', () => {
      timer.update({timing: {
        domInteractive: 'geoff',
        domComplete: 0
      }});
      sinon.assert.notCalled(spy);
    });
    it('does call statsd with valid data', () => {
      timer.update({timing: {
        domInteractive: 5,
        domComplete: 2
      }});
      sinon.assert.calledOnce(spy);
    });

    it('does return information from config', () => {
      timer.update({timing: {
        domInteractive: 5,
        domComplete: 2
      }});
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, 'client.dev.unknown.complete', 3);
    });

  });

  describe('page type', () => {
    it('returns a default page type', () => {
      timer.update({timing: {
        domInteractive: 5,
        domComplete: 2
      }});
      sinon.assert.calledWith(spy, 'client.dev.unknown.complete', 3);
    });
    it('sets a page type', () => {
      timer.update({
        page_type: 'geoff',
        timing: {
          domInteractive: 5,
          domComplete: 2
        }
      });
      sinon.assert.calledWith(spy, 'client.dev.geoff.complete', 3);
    });
    it('normalises naughty page types', () => {
      timer.update({
        page_type: 'geoff!lov£s.bacon',
        timing: {
          domInteractive: 5,
          domComplete: 2
        }
      });
      sinon.assert.calledWith(spy, 'client.dev.geoff-lov-s-bacon.complete', 3);
    });
  });

  describe('timing data', () => {
    it('returns incomplete timing data', () => {
      timer.update({
        timing: {
          domInteractive: 5,
          domComplete: 2
        }
      });
      sinon.assert.calledWith(spy, 'client.dev.unknown.complete', 3);
    });
    it('returns complete timing data', () => {
      timer.update({
        timing: {
          connectEnd: 10,
          connectStart: 8,
          domComplete: 18,
          domContentLoadedEventEnd: 17,
          domContentLoadedEventStart: 16,
          domInteractive: 15,
          domLoading: 14,
          domainLookupEnd: 7,
          domainLookupStart: 6,
          fetchStart: 5,
          loadEventEnd: 20,
          loadEventStart: 19,
          navigationStart: 0,
          redirectEnd: 4,
          redirectStart: 1,
          requestStart: 11,
          responseEnd: 13,
          responseStart: 12,
          secureConnectionStart: 9,
          unloadEventEnd: 3,
          unloadEventStart: 2
        }
      });
      sinon.assert.callCount(spy, 11);
      sinon.assert.calledWith(spy, 'client.dev.unknown.unload', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.dns', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.ssl', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.tcp', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.request', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.redirect', 3);
      sinon.assert.calledWith(spy, 'client.dev.unknown.response', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.interactive', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.dom', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.load', 1);
      sinon.assert.calledWith(spy, 'client.dev.unknown.duration', 20);
    });
    it('returns correct values', () => {
      timer.update({
        timing: {
          domInteractive: 1020,
          domComplete: 1000
        }
      });
      sinon.assert.calledWith(spy, 'client.dev.unknown.complete', 20);
    });
  });

  describe('resource data', () => {
    it('adds the name and type to requests', () => {
      timer.update({
        resource: [
          {
            name: 'http://taylor.charlie.im/static-asset',
            initiatorType: 'swift',
            domInteractive: 5,
            domComplete: 2
          }
        ]
      });
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, 'client.dev.unknown.swift.taylor.complete', 3);
    });
    it('deals with compression', () => {
      timer.update({
        resource: {
          'http://': {
            'static.charlie.im': {
              'css/main.css': '2g4,l'
            }
          }
        }
      });
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, 'client.dev.unknown.link.static.duration', 21);
    });
    it('normalises name & type', () => {
      timer.update({
        resource: [
          {
            name: 'https://geoff.charlie.im/geoff',
            initiatorType: '5\/\/1|=t',
            domInteractive: 5,
            domComplete: 2
          }
        ]
      });
      sinon.assert.calledWith(spy, 'client.dev.unknown.1-t.geoff.complete', 3);
    });
    it('handles multiple requests', () => {
      timer.update({
        resource: [
          {
            name: 'https://taylor.charlie.im/geoff',
            initiatorType: 'swift',
            domInteractive: 5,
            domComplete: 2
          },
          {
            name: 'http://selena.charlie.im/jim',
            initiatorType: 'gomez',
            domInteractive: 6,
            domComplete: 2
          }
        ]
      });
      sinon.assert.calledTwice(spy);
      sinon.assert.calledWith(spy, 'client.dev.unknown.swift.taylor.complete', 3);
      sinon.assert.calledWith(spy, 'client.dev.unknown.gomez.selena.complete', 4);
    });
    it('returns duration unmodified', () => {
      timer.update({
        resource: [
          {
            name: 'http://taylor.charlie.im/taytay',
            initiatorType: 'swift',
            duration: 500
          }
        ]
      });
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, 'client.dev.unknown.swift.taylor.duration', 500);
    });

    it('reduces stats names', () => {
      timer.update({
        resource: [
          {
            name: 'http://www.test.com/beacon',
            initiatorType: 'awesome',
            duration: 300
          },
          {
            name: 'example.net',
            initiatorType: 'sweet',
            duration: 400
          },
          {
            name: 'dontcallme',
            initiatorType: 'sweet',
            duration: 700
          }
        ]
      });
      sinon.assert.callCount(spy, 3);
      sinon.assert.calledWith(spy, 'client.dev.unknown.awesome.test.duration', 300);
      sinon.assert.calledWith(spy, 'client.dev.unknown.sweet.example.duration', 400);
      sinon.assert.calledWith(spy, 'client.dev.unknown.sweet.unknown.duration', 700);
    });
  });
  describe('iStats counters', () => {
    let incrementSpy;
    beforeEach(() => {
      incrementSpy = sinon.stub(statsd, 'increment');
    });
    afterEach(() => {
      statsd.increment.restore();
    });
    it('does not call statsD when there are sa stats', () => {
      timer.update({
        resource: [
          {
            name: 'http://www.google-analytics.com/stat',
            initiatorType: 'charlie',
            domInteractive: 5,
            domComplete: 2
          }
        ]
      });
      sinon.assert.notCalled(incrementSpy);
    });
    it('does call statsD when there are no sa stats', () => {
      timer.update({
        resource: [
          {
            name: 'http://not-sa.charlie.im/stat',
            initiatorType: 'charlie',
            domInteractive: 5,
            domComplete: 2
          }
        ]
      });
      sinon.assert.calledOnce(incrementSpy);
      sinon.assert.calledWith(incrementSpy, 'client.dev.unknown.blockstat');
    });
  });
});
