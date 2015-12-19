var AWS = require('aws-sdk');
AWS.config.loadFromPath('./s3_config.json');

// var s3 = new AWS.S3({
//   endpoint: 's3-website-us-west-2.amazonaws.com'
// });
// https://s3-us-west-2.amazonaws.com/shapcontainer/myKey
// var s3bucket = new AWS.S3({params: {Bucket: 'shapcontainer'}});
// s3bucket.createBucket(function() {
//   var params = {Key: 'myKey', Body: 'Hello!'};
//   s3bucket.upload(params, function(err, data) {
//     if (err) {
//       console.log("Error uploading data: ", err);
//     } else {
//       console.log("Successfully uploaded data to myBucket/myKey");
//     }
//   });
// });

// console.log('working')


// LIST ALL BUCKETS
var s3 = new AWS.S3();
// s3.listBuckets(function(err, data) {
//   if (err) { console.log("Error:", err); }
//   else {
//     for (var index in data.Buckets) {
//       var bucket = data.Buckets[index];
//       console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
//     }
//   }
// })

//RETRIEVE OBJECT
var params = {Bucket: 'appcontainer', Key: 'myKey', Body: 'body'};
s3.getSignedUrl('putObject', params, function(err, url){
  console.log('The url is', url)
})