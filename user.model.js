const mongoose = require("mongoose");

//User model
const userSchema = new mongoose.Schema({
  Name: {
    type: String,
  },
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
