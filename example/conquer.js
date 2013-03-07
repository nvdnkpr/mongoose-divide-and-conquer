"use strict";

var stewardess = require('stewardess')
  , waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , everything = require('./index')
  , repo       = 'log-workout'
  , model      = 'WorkoutLog'
  , models     = require('../' + repo + '/models')
  , Model      = models[model]
  , queue      = new PikaQueue()
  ;


queue.monitorJobQueue('user-everything', function(batch, cb) {
  everything.conquer(
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
