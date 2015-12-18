var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose= require('mongoose');
var session = require('express-session')

var Maker = require('./app/models/Maker');
var Article = require('./app/models/Article');
var Work = require('./app/models/Work');
var Chat = require('./app/models/Chat');

var dbURI = 'mongodb://manager:shapp@ds033135.mongolab.com:33135/shapp';

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

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: '1234567890QWERTY', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }));

var port = process.env.PORT || 8000;

var router = express.Router();

router.use(function something(req, res, next){
  console.log('Something is happening');
  next();
})

router.get('/', function(req, res) {
  res.json({message: 'hooray! welcome to our api!'});
})

router.route('/signupmanual')
  .post(function(req, res) {
    Maker.findOne({fbId: req.body.fbId}, function(err, maker) {
      if (maker) {
        console.log('Maker already exists. Please, Log In.');
        res.json({message: 'This is an existent maker. Sign In'});
      } else {
        Maker.create({
          username: req.body.username,
          name: req.body.name,
          fbId: req.body.fbId,
          email: req.body.email,
          picture: req.body.picture,
          password: req.body.password,
          address: {zipcode: req.body.zipcode}
        }, function(err, maker){
          if (err) console.log(err);
          res.json({message: 'Maker created'});
        });
      }
    });
  });

router.route('/signupfb')
  .post(function(req, res) {
    Maker.findOne({fbId: req.body.fbId}, function(err, maker) {
      if (maker) {
        console.log('Maker already exists. Please, Log In.');
        res.json({message: 'This is an existent maker. Sign In', status: 'notNew'});
      } else {
        Maker.create({
          name: req.body.name,
          fbId: req.body.fbId,
          email: req.body.email,
          picture: req.body.picture
        }, function(err, maker){
          if (err) console.log(err);
          res.json({message: 'Maker created', status: 'successSignUp'});
        });
      }
    });
  });

router.route('/loginfb')
  .post(function(req, res) {
    Maker.findOne({fbId: req.body.fbId}, function(err, maker) {
      if (!maker) {
        console.log('Maker does not exist. Please, Sign Up.');
        res.json({message: 'Maker does not exist', status: 'noexist'});
      } else {
        req.session.loggedIn = true;
        console.log('Logged in user: ' + maker.name);
        res.json({message: 'Welcome!', status: 'successLogin'});
      }
    });
  });

router.route('/loginmanual')
  .post(function(req, res) {
    Maker.findOne(
      {
        $or:[
              {email: req.body.email},
              {username: req.body.username}
            ]

      }, {password: 1}, function(err, maker) {
      if (!maker) {
        console.log(maker);
        console.log('Maker does not exist. Please, Sign Up.');
        res.json({message: 'This is a non existent maker. Sign Up', status: 'nonUser'});
      } else {
        if (maker.password != req.body.password) {
          res.json({message: 'Wrong password. Sign Up', status: 'passwordIncorrect'});
        } else {
          req.session.loggedIn = true;
          console.log('Logged in user: ' + maker);
          res.json({message: 'Welcome!', status: 'successLogin'});
        }
      }
    });
  });


router.route('/makers')
  .post(function(req, res) {
    var maker = new Maker();
    maker.name = req.body.name;
    maker.fbId = req.body.fbId; //FB Login
    maker.email = req.body.email; //FB Login
    maker.picture = req.body.picture; //FB Login

    maker.save(function(err) {
      if (err) {
        console.log(err);
        if (err.code===11000) res.redirect('/maker/new?exists=true');
        res.send(err);
      }
      res.json({message: 'Maker created'});
    })
  })
  .get(function(req, res) {
    Maker.find(function(err, makers){
      if (err) res.send(err);
      res.json(makers);
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

app.use('/api', router);
app.listen(port);
console.log('Maggic happen on port ' + port);