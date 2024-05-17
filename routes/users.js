//users.js
const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default:'anonymous'},
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  date: { type: Date, default: Date.now },
  profileImage: {
    type: String,
    default: "account.png" // replace with the path to a default profile image
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model('User', userSchema);
