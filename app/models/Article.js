var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Maker'},
  createdOn: {type: Date, default: Date.now},
  title: String,
  content: String,
  tags: Array,
  picture: String
});

module.exports = mongoose.model('Article', ArticleSchema);