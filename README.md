# Timer

Not finished.

A Node.js beacon for collecting stats from the
[Navigation Timing API](https://developer.mozilla.org/en/docs/Web/API/Navigation_timing_API)
& [Resource Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API/Using_the_Resource_Timing_API)
to a [StatsD](https://github.com/etsy/statsd) backend.

This project is loosely based around SOASTA's
[Boomerang](https://soasta.github.io/boomerang/doc/) [RUM](https://en.wikipedia.org/wiki/Real_user_monitoring).

## Installation
In a helpful copy/paste format
(it's assumed you know what all the commands below are doing):
```bash
npm install
```
## Running
To run the server locally on port 7080, just run
```bash
npm start
```
This README does not cover the steps to put the application on a production
environment, or more standardised port (80, 443).

By default the application will launched in a clustered mode, so you will see several node processes running.
Additional things, like compression, are not implemented.

## Testing
There are a number of [Mocha](https://mochajs.org) tests to check basic
implementation details, using [sinon](http://sinonjs.org) as a stubbing tool - 
to stop requests to a statsd server.
```bash
npm test
```
For simple linting checks using [ESLint](http://eslint.org), just run:
```bash
npm run eslint
```
This will check the code style against the default ESLint [recommendations](http://eslint.org/docs/rules/).

### Coverage
You can generate [Istanbul](https://github.com/gotwarlost/istanbul) coverage
reports by running the coverage command.
This creates JSON and HTML representation of code coverage of the application.
```bash
npm run coverage
```

## User-flow
1. A user vists a page with the beacon JS
2. When the user leaves the page (beforeunload) a beacon request is made with JSON payload (containing timing/resource data)
3. The beacon quicky returns a response with 204 (No Content)
4. Post response the beacon then formats payload into a statsd format, and sends the requests over UDP (fire & forget) to a StatsD endpoint


## Assumptions
You've got NPM/NodeJS installed, on a CentOS base sandbox, type:
```
yum install -y nodejs
npm install npm -g
```
[Node.js](https://nodejs.org/en/) provides further documentation on how to
setup Node.js on other environments.

## Addendum
The sample [index.html file](index.html) provides a basic way of adding stats to your website - by simply including it in a convenient non-blocking place (as it scrapes information from the browser APIs, if supported, it can happily be deferred until after page-load).

Some browsers (namely Safari) don't allow direct access to the timing object,
and don't support [Navigator Beacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
requests, so you need to shim that behaviour - by copying results out into a
new object & using a XHR request on the ```unload``` event handler
(the example will abort after 1 second, to save holding up any forwarding
page load time).

Due to the high number of possible stats varients, and therefore [IOPS](https://en.wikipedia.org/wiki/IOPS), there are a few overrides to reduce the number of requests.

## TODO
Move overrides & the statsd hosts into a seperate configuration file.
