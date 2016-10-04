'use strict';

const cluster = require('cluster');

if (cluster.isMaster) {
  const cpus = require('os').cpus();
  cpus.forEach(() => {
    cluster.fork();
  });
  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  const app = express();
  const timer = require('./app/timer');

  app.disable('x-powered-by');
  app.use(cors({origin: true}));
  app.use(bodyParser.json());

  app.listen(7080);

  app.get('/status', (req, res) => {
    res.send('Started!');
  });

  app.post('/beacon', (req, res) => {
    res.status(202).end();
    timer.update(req.body);
  });
}
