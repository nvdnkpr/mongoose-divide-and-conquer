"use strict";

var waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , daq        = require('mongoose-divide-and-conquer')
  , Model      = require('./some/model')
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
    queue.queueJob('divide-and-conquer', batch, function(err) {
      console.log('batch %s finished', i);
      done(err);
    });
  });
})
