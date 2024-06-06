const express = require('express');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const postRoutes = require('./routes/post');
require('./config/passport');

dotenv.config();

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/layout');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: null }, // Set the cookie to expire when the browser closes
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: 'todoapp'
  })
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use(methodOverride('_method'));

app.use('/auth', authRoutes);
app.use('/', indexRoutes);
app.use('/posts', postRoutes);


const PORT = process.env.PORT || 3000;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connection established.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
