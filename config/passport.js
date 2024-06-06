const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return done(null, false, { message: 'No user with that email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Password incorrect' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});

module.exports = passport;
