var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = new Schema({
  address: String,
  zipcode: Number,
  city: String,
  state: String
});

var MakerSchema = new Schema({
  name: String,
  fbID: String,
  address: [AddressSchema],
  email: String,
  bio: String,
  latitute: Number,
  longitude: Number
})

module.exports = mongoose.model('Maker', MakerSchema);




// *SAVING DATA
// MAKERS
//   -name
//   -last name
//   -fbID
//   -address
//     -address
//     -zip code
//     -city
//     -state
//   -email
//   -bio
//   -geographic ubication

// ARTICLES
//   -mongoID
//   -articles
//     -title
//     -content
//     -one picture

// WORK
//   -mongoID
//   -products
//     -title
//     -description
//     -price
//     -category
//     -media
//       -pictures
//       -videos
//     -like

// CHAT
//   -mongoID
//   -friends
//     -friendName
//     -messages
//     -picture

// *RETRIEVING DATA
