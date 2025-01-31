// models/User.js

const mongoose = require("mongoose");

// We'll match the fields your `users` collection might contain.
// Make sure the collection name is "users" if that's what you've used in Mongo.
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  nickname: { type: String },
  password_hash: { type: String },
  avatarUrl: { type: String }, // <<<<< NEW: store avatar URL
}, { collection: "users" });   // ensure it points to the "users" collection

module.exports = mongoose.model("User", UserSchema);
