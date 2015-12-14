var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Bear = require('./app/models/bear');
var mongoose= require('mongoose');
var dbURI = 'mongodb://bear1:bear@ds029595.mongolab.com:29595/bearsmongoose';

mongoose.connection.on('connected', function(){
  console.log('connected');
})
mongoose.connection.on('error', function(err){
  console.log('err', err);
})

mongoose.connection.on('disconnected', function(){
  console.log('disconnected');
})

mongoose.connect(dbURI);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8000;

var router = express.Router();

router.use(function something(req, res, next){
  console.log('Something is happening');
  next();
})

router.get('/', function(req, res) {
  res.json({message: 'hooray! welcome to our api!'});
})

router.route('/bears')
  .post(function(req, res) {
    var bear = new Bear();
    bear.name = req.body.name;
    bear.save(function(err) {
      if (err) res.send(err);
      res.json({message: 'Bear created'});
    })
  })
  .get(function(req, res) {
    Bear.find(function(err, bears){
      if (err) res.send(err);
      res.json(bears);
    })
  })

router.route('/bears/:bear_id')
  .get(function(req, res) {
    Bear.findById(req.params.bear_id, function(err, bear){
      if (err) res.send(err);
      res.json(bear);
    })
  })
  .put(function(req, res) {
    Bear.findById(req.params.bear_id, function(err, bear) {
      if (err) res.send(err);
      bear.name = req.body.name;
      bear.save(function(err) {
        if (err) res.send(err);
        res.send({message: 'Bear updated'});
      })
    })
  })
  .delete(function(req, res) {
    Bear.remove({
      _id: req.params.bear_id
    }, function(err, bear) {
      if (err) res.send(err);
      res.json({message: 'Successfully deleted'});
    })
  })

app.use('/', function(req, res){
  res.json({message: 'Bear created'});
});

app.use('/api', router);
app.listen(port);
console.log('Maggic happen on port ' + port);