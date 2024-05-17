// models/Post.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: { type: String, default: null },
  text: { type: String, default: null }
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  image: { type: String, default: null }, // Assuming you store the path to the image file
  likes: { type: Number, default: 0 },
  comments: [commentSchema]
});

module.exports = mongoose.model('Post', postSchema);
