const express = require("express");
const app = express();
const port = 5000;

const mongoose = require("mongoose");
require("dotenv").config();
const MongoURL = process.env.MONGO_URI;
const { Post } = require("./Model/post.js");

//////////////////////
//  session-based   //
//////////////////////
const session = require("express-session");
const flash = require("connect-flash");
app.use(
  session({
    secret: "MySecret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

//////////////////////
//     passport     //
//////////////////////
// const passport = require("passport");
// app.use(passport.initialize());
// app.use(passport.session());

//////////////////////
//      default     //
//////////////////////
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
const moment = require("moment");
moment.locale("ko");
app.use(function (req, res, next) {
  res.locals.moment = moment;
  next();
});
/*
const checkSession = (req, res, next) => {
  console.log(req.session);
  next();
};
app.use(checkSession);
*/

//app.user("/", require("./router/session.js")) //session
//app.use("/", require("./router/passport.js")); // passport
//app.use("/", require("./router/jwt.js")); // jwt
app.use("/post", require("./router/post.js"));

app.get("/", (req, res) => {
  res.render("index");
});

app.all("*", (req, res) => {
  res.status(404).send("찾을 수 없는 페이지입니다!");
});

mongoose
  .connect(MongoURL)
  .then(() => {
    console.log("Connecting MongoDB...");
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
