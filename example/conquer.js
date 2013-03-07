"use strict";

var waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , daq        = require('mongoose-divide-and-conquer')
  , Model      = require('./some/model')
  , queue      = new PikaQueue()
  ;

queue.monitorJobQueue('divide-and-conquer', function(batch, cb) {
  daq.conquer(
    {
      batch: batch,
      model: Model
    },
    function(doc, done) {
      process.stdout.write(doc._id.toString().slice(23));
      done();
    },
    function(err, count) {
      if (err) throw err;
      console.log();
      console.log('processed %d docs', count);
      cb(null, count);
    }
  );
});
