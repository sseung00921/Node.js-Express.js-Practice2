const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const PRIVATEKEY = process.env.PRIVATEKEY;

const userSchema = new mongoose.Schema(
  {
    name: String, // String is shorthand for {type: String}
    userId: { type: String, unique: 1 },
    password: String,
    token: {
      type: String,
      default: "",
    },
  },
  { collection: "users" }
);

userSchema.methods.generateToken = function (cb) {
  let user = this; //generateToken을 호출한 doc 할당
  jwt.sign({ userId: user.userId }, PRIVATEKEY, function (err, token) {
    if (err) return cb(err);
    user.token = token;
    user.save((err, user) => {
      if (err) return cb(err);
      cb(null, user);
    });
  });
};

userSchema.statics.getUserByToken = function (token, cb) {
  let User = this; //getUserByToken을 호출한 Model
  jwt.verify(token, PRIVATEKEY, function (err, decoded) {
    if (err) cb(err);
    User.findOne({ userId: decoded.userId, token: token })
      .exec()
      .then((userDoc) => {
        cb(null, userDoc);
      })
      .catch((err) => {
        cb(err);
      });
  });
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
