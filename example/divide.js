"use strict";

var waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , daq        = require('../index')
  , repo       = 'log-workout'
  , model      = 'WorkoutLog'
  , models     = require('../../' + repo + '/models')
  , Model      = models[model]
  , queue      = new PikaQueue()
  ;


daq.divide({
  model: Model,
  batchSize: 1000
}, function(err, batches) {
  if (err) throw err;

  var done = waitress(batches.length, function(err) {
    if (err) throw err;
    console.log('all done!');
    process.exit();
  });

  console.log('queueing %d batches', batches.length);
  batches.forEach(function(batch, i) {
    queue.queueJob('user-everything', batch, function(err) {
      console.log('batch %s finished', i);
      done(err);
    });
  });
})
