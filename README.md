# Mongoose Divide and Conquer

Allows you to divide and conquer an entire mongo collection using
mongoose.

## An example using pika-queue:

### Divide

We can give divide a model, and it will find id ranges for the given
batch size. These can be pushed onto a queue for processing.

```javascript
var waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , daq        = require('mongoose-divide-and-conquer')
  , Model      = require('./some/model')
  , queue      = new PikaQueue()
  ;

everything.divide({
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
});
```

### Conquer

We can pop batches off the queue, and give them to conquer with two
methods.

The first method is used to process one document. The second method is
called when all documents have been processed. All documents from the
batch are processed in parallel.

```javascript
var waitress   = require('waitress')
  , PikaQueue  = require('pika-queue')
  , daq        = require('mongoose-divide-and-conquer')
  , Model      = require('./some/model')
  , queue      = new PikaQueue()
  ;

queue.monitorJobQueue('divide-and-conquer', function(batch, cb) {
  everything.conquer(
    {
      batch: batch,
      model: Model
    },
    function(doc, done) {
      // do something with the document
      process.stdout.write('.');
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
```
