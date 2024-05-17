// Define the Like model
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    postID: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
  });

  module.exports = mongoose.model('Like', likeSchema);



