const path = require('path');

const express = require('express');
const session = require('express-session')
const csrf = require('csurf')
const flash = require('connect-flash')
const mongoose = require('mongoose');
const mongoDbStore = require('connect-mongodb-session')(session)
const multer = require('multer')

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/test'

const app = express();
const store = new mongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions"
})
const csrfProtection = csrf()

const storage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, "images")
  },
  filename: (req, file, cb)=>{
    cb(null, new Date().getTime() + "-" + file.originalname)
  }
})

const fileFilter = (req, file, cb)=>{
  if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
    cb(null, true)
  }else{
    cb(null, false)
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: false }));
app.use(multer({storage: storage, fileFilter: fileFilter}).single("image"))
app.use(express.static(path.join(__dirname, 'public')));
app.use("/images",express.static(path.join(__dirname, 'images')));
app.use(session({
  secret: "My Secret Key",
  resave: false,
  saveUninitialized: false,
  store: store
}))
app.use(csrfProtection)
app.use(flash())

app.use((req, res, next)=>{
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use((req, res, next)=>{
  // throw new Error("outsede ere")
  if(!req.session.user){
    return next()
  }
  User.findById(req.session.user._id)
  .then(user=>{
    // If an error is thrown in a asynchronous code(promises or callbacks), you need to wrap the error with the next() function
    // If the error is thrown in an ordinary function, you don't need to wrap it in a next function, the error middleware is called automatically
    // throw new Error("An errr")
    if(!user){
      return next()
    }
    req.user = user
    next()
  }).catch(err => {
    next(new Error(err))
  })
})


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

app.use((error, req, res, next)=>{
  res.status(500).render('error/500', { pageTitle: 'Server Error', path: 'error/500', isAuthenticated: req.session.isLoggedIn });
})

mongoose.connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
});
