"use strict";

var stewardess  = require('stewardess')
  , waitress    = require('waitress')
  , PikaQueue   = require('pika-queue')
  , progressBar = require('progress-bar')
  ;

function conquer(options, fn, cb) {
  if (!options || !options.model) {
    return cb(new Error('no model specified in options (mongoose-everything)'));
  }

  options.model
    .find(options.query)
    .where('_id').gte(options.batch.start).lt(options.batch.end)
    .exec(function(err, docs) {
      if (err) return cb(err);

      var done = waitress(docs.length, function(err) {
        cb(err, docs.length);
      });

      docs.forEach(function(doc) {
        fn(doc, done);
      });
    });
}

function divide(options, cb) {
  if (!options || !options.model) {
    return cb(new Error('no model specified in options (mongoose-everything)'));
  }

  options.batchSize = options.batchSize || 1000;

  stewardess(
    function getCount(options, next) {
      options.model.count(function(err, count) {
        if (err) return next(err);
        if (!count) return next(new Error('empty collection'));
        options.docCount = count;
        next();
      });
    },

    function calculateBatchCount(options, next) {
      options.batchCount = Math.ceil(options.docCount / options.batchSize);
      console.log(options.batchCount + ' batches to be processed');
      next();
    },

    function getIdsAtIntervals(options, next) {
      var done = waitress(options.batchCount + 1, function(err, ids) {
        ids.sort();
        options.idList = [];
        for (var i = 0; i < ids.length - 1; ++i) {
          options.idList.push({
            start: ids[i],
            end: ids[i + 1]
          });
        }
        // add one to the last end
        options.idList[options.idList.length -1].end = hexAddOne(options.idList[options.idList.length -1].end);
        next();
      });

      var count = 0;
      var bar = progressBar.create(process.stdout, 20);
      bar.update(0);
      for (var i = 0; i < options.batchCount + 1; ++i) {
        options.model
          .find()
          .select('_id')
          .skip(Math.min(i * options.batchSize, options.docCount - 1))
          .sort('_id')
          .limit(1)
          .exec(function(err, docs) {
            if (err) return cb(err);
            if (!docs.length) return cb();
            bar.update(count / options.batchCount);
            count += 1;
            done(err, docs[0]._id.toString());
          });
      }
    }
  )
  .plugin(stewardess.plugins.timer)
  .error(cb)
  .done(function(options) {
    cb(null, options.idList);
  })
  .run(options)
}

function hexAddOne(hex) {
  // we add at least one.
  hex = hex.split('');
  for (var i = hex.length - 1; i > 0; --i) {
    if (hex[i] === 'f') continue;
    hex[i] = 'f';
    break;
  }
  hex = hex.join('');
  return hex;
}

exports.divide = divide;
exports.conquer = conquer;
