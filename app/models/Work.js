var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkSchema = new Schema({
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Maker'},
  createdOn: {type: Date, default: Date.now},
  identifier: String,
  title: String,
  description: String,
  price: Number,
  category: [String],
  tags: Array,
  pictures: [String],
  videos: [String],
  likes: Number
});

module.exports = mongoose.model('Work', WorkSchema);