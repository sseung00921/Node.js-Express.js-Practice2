var router = require("express").Router();
const { User } = require("../Model/user.js");
const { Counter } = require("../Model/counter.js");

const ComparePassword = (req, res, next) => {
  User.findOne({ userId: req.body.userId })
    .exec()
    .then((userInfo) => {
      if (!userInfo) {
        req.flash("message", "입력한 아이디가 없습니다.");
        res.redirect("/login");
      } else {
        //사용자가 입력한 비밀번호가 틀렸을 때
        if (req.body.password != userInfo.password) {
          req.flash("message", "비밀번호가 일치하지 않습니다.");
          res.redirect("/login");
        }
        res.locals.userInfo = userInfo;
        next();
      }
    });
};

const Authentication = (req, res, next) => {
  let token = req.session.token;
  User.getUserByToken(token, (err, doc) => {
    if (doc) {
      res.locals.userInfo = doc;
      next();
    } else res.status(400).redirect("/login");
  });
};

router
  .route("/login")
  .get((req, res) => {
    res.render("user/login.ejs", { message: req.flash("message") });
  })
  .post(ComparePassword, (req, res) => {
    //로그인이 성공, 토큰을 발행
    let userDoc = res.locals.userInfo;
    userDoc.generateToken((err, user) => {
      if (err) return res.status(400).redirect("/login");
      //로그인이 성공 + 토큰도 발행된 상태 > 토큰을 쿠키/세션
      req.session.token = user.token;
      res.status(200).redirect("/");
    });
  });

router
  .route("/register")
  .get((req, res) => {
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

router.get("/mypage", Authentication, (req, res) => {
  res.status(200).send(res.locals.userInfo.name);
});

router.get("/logout", Authentication, (req, res) => {
  let user = res.locals.userInfo;
  user.token = "";
  user
    .save()
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
