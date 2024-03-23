var router = require("express").Router();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { User } = require("../Model/user.js");
const { Counter } = require("../Model/counter.js");

//로그인 성공, 유저의 아이디를 가지고 세션 만들고, 쿠키로 브라우저 전송
passport.serializeUser(function (user, done) {
  done(null, user.userId);
});

//세션에 저장된 아이디를 가지고, user doc 찾아서 req.user 라는 곳에 저장
passport.deserializeUser(function (id, done) {
  User.findOne({ userId: id }).then((userInfo) => {
    done(null, userInfo);
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "userId",
      passwordField: "password",
      passReqToCallback: true,
    },
    function (req, username, password, done) {
      User.findOne({ userId: username }, function (err, user) {
        //몽구스 에러
        if (err) {
          return done(err);
        }
        //사용자가 입력한 아이디에 해당하는 유저가 없을 때
        if (!user) {
          req.flash("message", "입력한 아이디가 없습니다.");
          return done(null, false);
        }
        //사용자가 입력한 비밀번호가 틀렸을 때
        if (password != user.password) {
          req.flash("message", "비밀번호가 일치하지 않습니다.");
          return done(null, false);
        }
        return done(null, user);
      });
    }
  )
);

const alreadyLogin = (req, res, next) => {
  if (req.session.userId) res.status(400).send("이미 로그인 하셨습니다.");
  else next();
};

const loginCheck = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router
  .route("/login")
  .get(alreadyLogin, (req, res) => {
    res.render("user/login.ejs", { message: req.flash("message") });
  })
  .post(
    passport.authenticate("local", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

router
  .route("/register")
  .get(alreadyLogin, (req, res) => {
    res.render("user/register.ejs", { message: req.flash("message") });
  })
  .post((req, res) => {
    let temp = {
      name: req.body.name,
      userId: req.body.userId,
      password: req.body.password,
    };
    const NewUser = new User(temp);
    NewUser.save()
      .then(() => {
        Counter.findOneAndUpdate(
          { name: "counter" },
          {
            $inc: { userNum: 1 },
          }
        )
          .exec()
          .then(() => {
            res.redirect("/login");
          });
      })
      .catch((err) => {
        console.log(err);
        let message;
        if (err.code == 11000) {
          message = "중복된 아이디가 있습니다.";
        } else {
          message = "회원가입에 실패하였습니다.";
        }
        req.flash("message", message);
        res.redirect("/register");
      });
  });

router.get("/mypage", loginCheck, (req, res) => {
  console.log(req.user);
  res.send(req.user.name);
});

router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

module.exports = router;
