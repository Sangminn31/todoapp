const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');

const router = express.Router();

router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    title: 'Login',
    layout: 'layouts/layout',
    messages: req.flash()
  });
});

router.get('/signup', ensureGuest, (req, res) => {
  res.render('signup', {
    title: 'Sign Up',
    layout: 'layouts/layout',
    messages: req.flash(),  // Ensure flash messages are passed
    errors: []
  });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash('success_msg', 'You are logged in');
      return res.redirect('/');
    });
  })(req, res, next);
}, (req, res) => {
  // Render the login view with flash messages
  res.render('login', {
    title: 'Login',
    layout: 'layouts/layout',
    messages: req.flash()
  });
});

router.post('/signup', async (req, res) => {
  const { username, email, password, password2 } = req.body;
  let errors = [];

  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('signup', {
      errors,
      username,
      email,
      password,
      password2,
      title: 'Sign Up',
      layout: 'layouts/layout',
      messages: req.flash()
    });
  } else {
    try {
      let user = await User.findOne({ email: email });
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('signup', {
          errors,
          username,
          email,
          password,
          password2,
          title: 'Sign Up',
          layout: 'layouts/layout',
          messages: req.flash()
        });
      } else {
        const newUser = new User({
          username,
          email,
          password
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
      }
    } catch (err) {
      console.error(err);
      res.render('signup', {
        errors: [{ msg: 'Something went wrong, please try again' }],
        username,
        email,
        password,
        password2,
        title: 'Sign Up',
        layout: 'layouts/layout',
        messages: req.flash()
      });
    }
  }
});


// GET profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/auth/login');
    }
    res.render('profile', {
      user,
      title: 'Profile',
      layout: 'layouts/layout',
      messages: req.flash()
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong, please try again');
    res.redirect('/auth/login');
  }
});


// Logout
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
