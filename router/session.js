var router = require("express").Router();
const { User } = require("../Model/user.js");
const { Counter } = require("../Model/counter.js");

const alreadyLogin = (req, res, next) => {
  if (req.session.userId) res.status(400).send("이미 로그인 하셨습니다.");
  else next();
};

router
  .route("/login")
  .get(alreadyLogin, (req, res) => {
    res.render("user/login.ejs", { message: req.flash("message") });
  })
  .post((req, res) => {
    User.findOne({ userId: req.body.userId })
      .exec()
      .then((userInfo) => {
        if (!userInfo) {
          req.flash("message", "입력한 아이디가 없습니다.");
          res.redirect("/login");
        } else {
          if (userInfo.password != req.body.password) {
            req.flash("message", "비밀번호가 일치하지 않습니다.");
            res.redirect("/login");
          } else {
            //로그인 성공
            req.session.userId = req.body.userId;
            req.session.userName = userInfo.name;
            res.redirect("/");
          }
        }
      });
  });

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

router.get("/mypage", (req, res) => {
  //myPage를 직접 구현하지는 않았습니다.
  if (req.session.userId) {
    //필요하다면
    User.findOne({ userId: req.session.userId })
      .exec()
      .then((userInfo) => {
        res.render("user/mypage", { userInfo: userInfo });
      });
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
