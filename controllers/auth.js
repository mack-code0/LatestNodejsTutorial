const User = require("../models/user");
const bcryptjs = require('bcryptjs')
// const sendMail = require("../util/sendMail")
const crypto = require("crypto");
const { validationResult } = require("express-validator/check")




exports.getLogin = (req, res, next) => {
  let error = req.flash('error')
  let errorMessage = error.length>0?error:null
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage,
    oldInput: {email: ""}
  });
};

exports.getSignup = (req, res, next)=>{
  let error = req.flash('error')
  let errorMessage = error.length>0?error:null
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage,
    oldInput: {email: "", password: "", confirmPassword: ""},
    validationErrors: []
  });
}


exports.postLogin = (req, res, next)=>{
  // res.setHeader("Set-Cookie", "loggedIn=true")  
  const {email, password} = req.body
  
  User.findOne({email: email})
  .then(user=>{
    if(!user){
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: "Invalid email or password",
        oldInput: {email},
        validationErrors: []
      });
    }
    bcryptjs.compare(password, user.password)
    .then(doMatch=>{
      if(!doMatch){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: "Invalid email or password",
          oldInput: {email},
          validationErrors: []
        });
      }
      req.session.isLoggedIn = true
      req.session.user = user
      req.session.save(err=>{
        res.redirect("/")
      })
    })
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
}

exports.postSignup = (req, res, next) => {
  const {email, password, confirmPassword} = req.body

  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {email, password, confirmPassword},
      validationErrors: errors.array()
    });
  }


  bcryptjs.hash(password, 12)
  .then(hashedPassword=>{
    const newUser = User({
      password: hashedPassword,
      email,
      cart: { items: [] }
    })
    return newUser.save()
  })
  .then(result=>{
    // sendMail(email, `Thank you for registering with us ${email}`, cb=>{
      res.redirect("/login")
    // })
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
}

exports.postLogout = (req, res, next)=>{
  req.session.destroy(err=>{
    console.log(err);
    res.redirect("/login")
  })
}


exports.getReset = (req, res, next) => {
  let error = req.flash('error')
  let errorMessage = error.length>0?error:null
  res.render('auth/reset-password', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage
  });
};


exports.postReset = (req, res, next)=>{
  crypto.randomBytes(32, (err, buffer)=>{
    if(err){
      console.log(err);
      return res.redirect("/reset")
    }

    const token = buffer.toString("hex")
    User.findOne({email: req.body.email})
    .then(user=>{
      if(!user){
        req.flash("error", "Email not found")
        return res.redirect('/reset');
      }

      user.resetPasswordToken = token
      user.resetPasswordExpiry = Date.now() + 3600000
      return user.save()
    })
    .then(result=>{
      const textToSend = `<h1>You requested a password reset</h1><h1>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</h1>`
      // sendMail(req.body.email, textToSend, cb=>{
        // console.log((cb));
        res.redirect("/login")
      // })
    })
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
}


exports.getNewPassword = (req, res, next)=>{
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpiry: {$gt: Date.now()}})
  .then(user=>{
    let error = req.flash('error')
    let errorMessage = error.length>0?error:null

    res.render('auth/new-password', {
      path: '/reset',
      pageTitle: 'New Password',
      userId: user._id.toString(),
      passwordtoken: req.params.token,
      errorMessage
    });
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
}


exports.setNewPassword = (req, res, next)=>{
  const {userid, passwordtoken, password}  =req.body
  let getUser;
  User.findOne({userId: userid, resetPasswordToken: passwordtoken, resetPasswordExpiry: {$gt: Date.now()}})
  .then(user=>{
    getUser = user
    return bcryptjs.hash(password, 12)
  })
  .then(hashedPassword=>{
    getUser.password = hashedPassword
    getUser.resetPasswordToken = undefined
    getUser.resetPasswordExpiry = undefined
    return getUser.save()
  })
  .then(result=>{
    res.redirect("/login")
  })
  .catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
  });
}