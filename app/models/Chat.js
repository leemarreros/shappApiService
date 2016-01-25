 var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  message: String,
  createdOn: {type: Date, default: Date.now},
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Maker'}
});

var ChatSchema = new Schema({
  participants: [{type: mongoose.Schema.Types.ObjectId, ref: 'Maker'}],
  messages: [MessageSchema]
});

module.exports = mongoose.model('Chat', ChatSchema);