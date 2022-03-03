const express = require('express');

const { check, body } = require("express-validator")

const authController = require('../controllers/auth');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get("/signup", authController.getSignup)

// check('email').isEmail().withMessage("Please enter a valid Email!").custom(value, {req})=>{throw new Error("")}
router.post("/login", authController.postLogin)

router.post("/signup", 
    check('email').isEmail().withMessage("Please enter a valid Email!").custom((value, {req})=>{
        return User.findOne({email: value})
        .then(user=>{
          if(user){
            return Promise.reject("Email already exists!")
          }
        })
    }),
    check('password', 'Please enter a password with only numbers and text at least 5 characters').isLength({min: 3}).isAlphanumeric(),
    body('confirmPassword').custom((value, {req})=>{
        if(value !== req.body.password){
            throw new Error("Passwords do not match!")
        }
        return true
    }),
    authController.postSignup)

router.post("/logout", authController.postLogout)

router.get("/reset", authController.getReset)

router.post("/reset", authController.postReset)

router.get("/reset/:token", authController.getNewPassword)

router.post("/newpassword", authController.setNewPassword)

module.exports = router;