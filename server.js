var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose= require('mongoose');
var session = require('express-session')
var cors = require('cors');
var Canvas = require('canvas');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var multiparty = require('multiparty');

var Maker = require('./app/models/Maker');
var Article = require('./app/models/Article');
var Work = require('./app/models/Work');
var Chat = require('./app/models/Chat');

var dbURI = 'mongodb://manager:shapp@ds033135.mongolab.com:33135/shapp';
var urlAwsShapContaier = 'https://s3-us-west-2.amazonaws.com/shapcontainer/';

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./app/api/s3_config.json');

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
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
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

router.get('/session', function(req, res) {
  console.log(req.session.loggedIn);
  res.json({session: req.session.loggedIn});
})
router.post('/session', function(req, res) {
  req.session.loggedIn = req.body.logOut;
  res.json({session: req.session.loggedIn});
})

router.route('/signupmanual')
  .post(function(req, res) {
    Maker.findOne(
    {
      $or:[
            {email: req.body.email},
            {username: req.body.username}
          ]
    }, function(err, maker) {
      if (maker) {
        console.log('Maker already exists. Please, Log In.', maker);
        res.json({message: 'This is an existent maker. Sign In', status: 'notNew'});
      } else {
        Maker.create({
          username: req.body.username,
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          address: {zipcode: req.body.zipcode}
        }, function(err, maker){
          req.session.loggedIn = true;
          if (err) console.log(err);
          res.json({message: 'Maker created', status: 'successSignUp'});
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
          req.session.loggedIn = true;
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
        res.json({message: 'Welcome!', status: 'successLogin', maker: maker});
      }
    });
  });

router.route('/logout')
  .get(function(req, res) {
    req.session.loggedIn = false;
    res.json({message: 'User logged out', status: 'loggedout'});
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
          res.json({message: 'Welcome!', status: 'successLogin', maker: maker});
        }
      }
    });
  });

function resizeImageCanvas(imgBase64, width, height) {
  var Image = Canvas.Image;
  var image = new Image();
  var canvasURL;

  image.onload = function(){
    var canvas = new Canvas(width, height)
    , ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    canvasURL = canvas.toDataURL('image/png');
  }
  image.src = imgBase64;
  return canvasURL;
}

router.route('/articles')
  .get(function(req, res) {
    console.log('inside get');
    Article.find(function(err, articles) {
    if (err) res.send(err);
      console.log('inside Article');
      res.json({data: articles});
    }).sort( { createdOn: -1 } ).populate('createdBy', 'name');
  });

router.route('/articles/:maker_id')
  .post(function(req, res) {
    Maker.findOne( {fbId: req.params.maker_id}, {_id: 1},
      function(err, data){
        if (err) console.log(err);

        var article = new Article();
        article.createdBy = data._id;
        article.title = req.body.title;
        article.content = req.body.content;
        article.tags = req.body.tags;
        if (req.body.picture != 'null') {
          var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
          // var imgResized = resizeImageCanvas(req.body.picture, 600, 600);
          // var imgBuf = new Buffer(imgResized.replace(/^data:image\/\w+;base64,/, ""),'base64');
          var imgBuf = new Buffer(req.body.picture.replace(/^data:image\/\w+;base64,/, ""),'base64');
          var dateNow = Date.now();
          var dataUri = {
            Key: req.params.maker_id + "" + dateNow,
            Body: imgBuf,
            ContentEncoding: 'base64',
            ContentType: 'image/png'
          };
          s3.putObject(dataUri, function(err, data){
            if (err) {
              console.log(err);
              console.log('Error uploading data: ', data);
            } else {
              console.log('succesfully uploaded the image!', data);
              article.picture = urlAwsShapContaier + req.params.maker_id + "" + dateNow;
              article.save(function(err, data){
                res.json({message: 'Article with image created', status: 'artImgCreated'});
                return;
              });
            }
          });
        }

        article.save(function(err, data){
          res.json({message: 'Article created', status: 'articleCreated'});
        });

      });
  })
  .get(function(req, res) {
    Maker.findOne( {fbId: req.params.maker_id}, {_id: 1},
      function(err, data) {
        Article.find({createdBy: data._id}, function(err, data) {
          res.json({message: 'Retrieve work', data: data});
        })
      });

  });

router.route('/workvideos/:maker_id', upload.single('avatar'))
  .post(function(req, res) {
    var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
    var dateNow = Date.now();
    var key = req.params.maker_id + dateNow + ".mp4";
    var form = new multiparty.Form();
    var cloudFrontVName = "http://dj9tqqbq16had.cloudfront.net/" + key;
    console.log('after form init', req.params.maker_id);
    form.on('part', function(part) {
      console.log('inside form on part');
      s3.putObject({
        Bucket: 'shapcontainer',
        Key: key,
        ACL: 'public-read',
        Body: part,
        ContentLength: part.byteCount,
      }, function(err, data) {
        if (err) throw err;
        res.json({
          message: 'Video created',
          status: 'videoCreated',
          cloudFrontVName: cloudFrontVName
        });
      });
    });

    form.parse(req);
  });

router.route('/workimages/:maker_id')
  .post(function(req, res) {
      var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
      // var imgResized = resizeImageCanvas(req.body.picture, 600, 600);
      // var imgBuf = new Buffer(imgResized.replace(/^data:image\/\w+;base64,/, ""),'base64');
      var imgBuf = new Buffer(req.body.picture.replace(/^data:image\/\w+;base64,/, ""),'base64');
      var dateNow = Date.now();
      var key = req.params.maker_id + "" + dateNow;
      var awsImageURL = urlAwsShapContaier + key;
      var dataUri = {
        Key: key,
        Body: imgBuf,
        ContentEncoding: 'base64',
        ContentType: 'image/png'
      };
      s3.putObject(dataUri, function(err, data){
        if (err) {
          console.log(err, 'Error uploading data: ', data);
        } else {
          res.json({
            message: 'Image created',
            status: 'artImgCreated',
            awsImageURL: awsImageURL
          });
        }
      });
  })

router.route('/work/:maker_id')
  .post(function(req, res) {

    Maker.findOne( {fbId: req.params.maker_id}, {_id: 1},
      function(err, data){
        if (err) console.log(err);
        var work = new Work();
        work.createdBy = data._id;
        work.title = req.body.title;
        work.description = req.body.description;
        work.price = req.body.price;
        work.category = req.body.category;
        work.tags = req.body.tags;
        if (req.body.videos.length > 0) req.body.videos.split(",").forEach(function(video){work.videos.push(video)});
        if (req.body.pictures.length > 0) req.body.pictures.split(",").forEach(function(picture){work.pictures.push(picture)});
        work.save(function(err, data){
          res.json({message: 'Article created', status: 'workCreated'});
        });
      });
  })
  .get(function(req, res) {
    Maker.findOne( {fbId: req.params.maker_id}, {_id: 1},
      function(err, data) {
        Work.find({createdBy: data._id}, function(err, data){
          res.json({message: 'Retrieve work', data: data});
        });
    })
  })

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

router.route('/makerprofileupdate')
  .post(function(req, res) {
    var orFilter = [];
    !!req.body.username ? orFilter.push({username: req.body.username}) : null;
    !!req.body.email ? orFilter.push({email: req.body.email}) : null;
    !!req.body.fbId ? orFilter.push({fbId: req.body.fbId}) : null;

    var setFilter = {};
    setFilter.address = {};
    !!req.body.name ? setFilter.name = req.body.name : null;
    !!req.body.username ? setFilter.username = req.body.username : null;
    !!req.body.address ? setFilter.address.address = req.body.address : null;
    !!req.body.city ? setFilter.address.city = req.body.city : null;
    !!req.body.state ? setFilter.address.state = req.body.state : null;
    !!req.body.zipcode ? setFilter.address.zipcode = req.body.zipcode : null;
    !!req.body.latitude ? setFilter.address.latitude = req.body.latitude : null;
    !!req.body.longitude ? setFilter.address.longitude = req.body.longitude : null;
    !!req.body.email ? setFilter.email = req.body.email : null;
    !!req.body.bio ? setFilter.bio = req.body.bio : null;

    console.log('setFilter', setFilter);
    if (Object.keys(setFilter).length === 1 && Object.keys(setFilter.address).length === 0) {
      res.json({message: 'No changes', status: 'noChanges'});

      return;
    }

    Maker.findOne(
    {
      $or: orFilter
    }, function(err, maker) {
      if (maker) {
        Maker.update({_id: maker._id}, {$set: setFilter}, function(err, data){
          if (err) console.log(err);
          res.json({message: 'Update succesfully', status: 'makerUpdated'});
        });
      } else {

        res.json({message: 'Error finding the user', status: 'error'});
      }
    });

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