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
          var imgResized = resizeImageCanvas(req.body.picture, 600, 600);
          var imgBuf = new Buffer(imgResized.replace(/^data:image\/\w+;base64,/, ""),'base64');
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
  });

router.route('/work/:maker_id', upload.single('avatar'))
  .post(function(req, res) {
    var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
    var form = new multiparty.Form();
    console.log('after form init', req.params.maker_id);
    form.on('part', function(part) {
      console.log('inside form on part');
      s3.putObject({
        Bucket: 'shapcontainer',
        Key: req.params.maker_id + ".mp4",
        ACL: 'public-read',
        Body: part,
        ContentLength: part.byteCount,
      }, function(err, data) {

        if (err) throw err;
        console.log("done", data);
        console.log("https://s3.amazonaws.com/" + 'shapcontainer' + '/' + 'req.params.maker_id');

      });
    });


    form.parse(req);
    // Maker.findOne( {fbId: req.params.maker_id}, {_id: 1},
    //   function(err, data){
    //     if (err) console.log(err);
    //     console.log('req.body', req);
    //     var work = new Work();
    //     work.createdBy = data._id;
    //     work.title = req.body.title;
    //     work.description = req.body.description;
    //     work.tags = req.body.tags;

    //     if (req.body.picture != 'null') {
    //       var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
    //       var imgResized = resizeImageCanvas(req.body.picture, 600, 600);
    //       var imgBuf = new Buffer(imgResized.replace(/^data:image\/\w+;base64,/, ""),'base64');
    //       var dateNow = Date.now();
    //       var dataUri = {
    //         Key: req.params.maker_id + "" + dateNow,
    //         Body: imgBuf,
    //         ContentEncoding: 'base64',
    //         ContentType: 'image/png'
    //       };
    //       s3.putObject(dataUri, function(err, data){
    //         if (err) {
    //           console.log(err, 'Error uploading data: ', data);
    //         } else {
    //           console.log('succesfully uploaded the image!', data);
    //           work.video = urlAwsShapContaier + req.params.maker_id + "" + dateNow;
    //           work.save(function(err, data){
    //             res.json({message: 'work with image created', status: 'artImgCreated'});
    //             return;
    //           });
    //         }
    //       });
    //     }

    //     if (req.body.video != 'null') {
    //       console.log('loading video', req.body.video.name);
    //       var s3 = new AWS.S3({params: {Bucket: 'shapcontainer'}});
    //       // var imgBuf = new Buffer(req.body.video.replace(/^data:image\/\w+;base64,/, ""),'base64');
    //       var dateNow = Date.now();
    //       // var dataUri = {
    //       //   Key: req.params.maker_id + "" + dateNow,
    //       //   Body: imgBuf,
    //       //   ContentEncoding: 'base64',
    //       //   ContentType: 'video/mp4'
    //       // };

    //       // s3.putObject(dataUri, function(err, data){
    //         // if (err) {
    //         //   console.log(err, 'Error uploading data: ', data);
    //         // } else {
    //         //   console.log('succesfully uploaded the video!', data);
    //         //   work.videos.push(urlAwsShapContaier + req.params.maker_id + "" + dateNow);
    //         //   work.save(function(err, data){
    //         //     console.log('video data', data);
    //         //     res.json({message: 'Article with image created', status: 'videoCreated'});
    //         //   });
    //         // }
    //       // });
    //       var params = {Key: req.body.video.name, ContentType: req.body.video.type, Body: req.body.video};
    //       console.log(req.body.video.type);
    //       s3.upload(params, function (err, data) {
    //         console.log('inside s3.upload');
    //         if (err) console.log(err);
    //         console.log('upload', data);
    //       });
    //       return;
    //     }

    //     work.save(function(err, data){
    //       res.json({message: 'Article created', status: 'articleCreated'});
    //     });

    //   });

  });

router.route('/aws-s3')
  .get(function(req, res) {
    var s3_params = {
        Bucket: 'shapcontainer',
        Key: 'myKey',
        Expires: 60,
        // ContentType: req.query.file_type,
        ACL: 'public-read'
    };

    s3.getSignedUrl('putObject', s3_params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
          var return_data = {
              signed_request: data,
              url: 'https://'+'shapcontainer'+'.s3.amazonaws.com/'+'myKey'
          };
          res.write(JSON.stringify(return_data));
          res.end();
      }
    })

  })
  .post(function(req, res) {

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