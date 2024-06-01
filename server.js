const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
require('dotenv').config();  // Ensure this line is at the top

// Add these lines to check environment variables
console.log("Session Secret:", process.env.SESSION_SECRET);
console.log("DB URL:", process.env.DB_URL);

app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

// Set up sessions and flash
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 },
  store: MongoStore.create({
    mongoUrl: process.env.DB_URL,
    dbName: 'forum'
  })
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
let db;
const url = process.env.DB_URL;
new MongoClient(url).connect().then((client) => {
  console.log('Successfully connected to the DB.');
  db = client.db('forum');
  app.listen(process.env.PORT, function () {
    console.log(`Listening on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.log(err);
});

// Routes

app.get('/news', function (req, res) {
  db.collection('post').insertOne({ title: 'first try' });
});

app.get('/time', (req, res) => {
  res.render('time.ejs', { data: new Date() });
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


app.get('/list', async (req, res) => {
  const pageSize = 5;
  const totalPosts = await db.collection('post').countDocuments();
  const totalPages = Math.ceil(totalPosts / pageSize);
  let posts = await db.collection('post').find().sort({ createdAt: -1 }).limit(pageSize).toArray();
  res.render('list.ejs', {
      posts: posts,
      totalPages: totalPages,
      currentPage: 1
  });
});


app.get('/write', function (req, res) {
  res.render('write.ejs');
});

app.post('/add', async (req, res) => {
  try {
      if (req.body.title === '' || req.body.content === '') {
          res.send('You need to write the title or content.');
      } else {
          await db.collection('post').insertOne({
              title: req.body.title,
              content: req.body.content,
              createdAt: new Date(),
              createdBy: req.user._id  // Track the user who created the post
          });
          res.redirect('/list');
      }
  } catch (e) {
      console.log(e);
      res.status(500).send('Server problem');
  }
});

app.get('/detail/:id', async (req, res) => {
  try {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });
    if (result) {
      res.render('detail.ejs', { result: result });
    } else {
      res.status(404).send('Wrong URL!');
    }
  } catch (e) {
    console.log(e);
    res.status(404).send('Wrong URL');
  }
});

app.get('/edit/:id', async (req, res) => {
  try {
      let post = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });
      if (post && post.createdBy.equals(req.user._id)) {
          res.render('edit.ejs', { result: post });
      } else {
          req.flash('error', 'You are not authorized to edit this post.');
          res.redirect('/list');
      }
  } catch (error) {
      req.flash('error', 'Something went wrong while accessing the post. Please try again after you login.');
      res.redirect('/list');
  }
});


app.put('/edit', async (req, res) => {
  try {
      let post = await db.collection('post').findOne({ _id: new ObjectId(req.body.id) });
      if (post && post.createdBy.equals(req.user._id)) {
          if (req.body.title !== '' && req.body.content !== '') {
              await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) },
                  { $set: { title: req.body.title, content: req.body.content } }
              );
              res.redirect('/list');
          } else {
              req.flash('error', 'Title and content cannot be empty.');
              res.redirect('/edit/' + req.body.id);
          }
      } else {
          req.flash('error', 'You are not authorized to edit this post.');
          res.redirect('/list');
      }
  } catch (error) {
      req.flash('error', 'Something went wrong while updating the post. Please try again after you login.');
      res.redirect('/list');
  }
});


app.delete('/delete', async (req, res) => {
  try {
      let post = await db.collection('post').findOne({ _id: new ObjectId(req.body.docid) });
      if (post && post.createdBy.equals(req.user._id)) {
          let result = await db.collection('post').deleteOne({ _id: new ObjectId(req.body.docid) });
          if (result.deletedCount === 1) {
              req.flash('success', 'Post has been deleted successfully.');
              res.redirect('/list');
          } else {
              req.flash('error', 'Post not found.');
              res.redirect('/list');
          }
      } else {
          req.flash('error', 'You are not authorized to delete this post.');
          res.redirect('/list');
      }
  } catch (error) {
      req.flash('error', 'Something went wrong while deleting the post. Please try again after you login.');
      res.redirect('/list');
  }
});


app.get('/list/:id', async (req, res) => {
  const page = parseInt(req.params.id, 10) || 1;
  const pageSize = 5;
  const skip = (page - 1) * pageSize;
  const totalPosts = await db.collection('post').countDocuments();
  const totalPages = Math.ceil(totalPosts / pageSize);
  let posts = await db.collection('post').find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray();
  res.render('list.ejs', {
      posts: posts,
      totalPages: totalPages,
      currentPage: page
  });
});


app.get('/signup', (req, res) => {
  res.render('signup.ejs');
});

function logincheck(req, res, next) {
  if (req.body.username === '' || req.body.password === '') {
    res.send('No empty box plz');
  } else {
    next();
  }
}

app.post('/signup', logincheck, async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;

  if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/signup');
  }

  let hash = await bcrypt.hash(password, 10); // Correct hashing

  try {
      let userExists = await db.collection('user').findOne({ username: username });

      if (userExists) {
          req.flash('error', 'Username already taken.');
          return res.redirect('/signup');
      }

      let result = await db.collection('user').insertOne({
          username: username,
          password: hash
      });

      if (result.acknowledged) {
          req.flash('success', 'User registered successfully. Please log in.');
          return res.redirect('/login');
      }
  } catch (error) {
      console.error('Signup error:', error);
      req.flash('error', 'Error registering user.');
      return res.redirect('/signup');
  }
});

passport.use(new LocalStrategy(async (username, password, done) => {
  let result = await db.collection('user').findOne({ username: username });
  if (!result) {
    return done(null, false, { message: 'Cannot find the ID from the DB.' });
  }

  if (await bcrypt.compare(password, result.password)) {
    return done(null, result);
  } else {
    return done(null, false, { message: 'Check the password again.' });
  }
}));

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) });
  if (result) {
    delete result.password;
    process.nextTick(() => {
      return done(null, result);
    });
  } else {
    process.nextTick(() => {
      return done(null, false);
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, () => {
      if (error) return next(error);
      res.redirect('/');
    });
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
      if (err) {
          return next(err);
      }
      req.flash('success', 'You have logged out successfully.');
      res.redirect('/login');
  });
});



app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) { // Check if the user is authenticated
    res.render('profile.ejs', { user: req.user }); // Pass the user info to the profile page
  } else {
    res.redirect('/login'); // Redirect to the login page if not authenticated
  }
});


app.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
      req.flash('error', 'Search query cannot be empty.');
      return res.redirect('/list');
  }
  
  try {
      const posts = await db.collection('post').find({ 
          $or: [
              { title: { $regex: query, $options: 'i' } },
              { content: { $regex: query, $options: 'i' } }
          ]
      }).toArray();
      
      res.render('list.ejs', {
          posts: posts,
          totalPages: 1, // No pagination for search results
          currentPage: 1,
          messages: req.flash()
      });
  } catch (error) {
      console.error('Search error:', error);
      req.flash('error', 'Error performing search.');
      res.redirect('/list');
  }
});

app.post('/reset-password', async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/profile');
  }

  try {
      const user = await db.collection('user').findOne({ _id: req.user._id });

      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
          req.flash('error', 'Current password is incorrect.');
          return res.redirect('/profile');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.collection('user').updateOne({ _id: req.user._id }, {
          $set: { password: hashedPassword }
      });

      req.flash('success', 'Password reset successfully.');
      res.redirect('/profile');
  } catch (error) {
      console.error('Password reset error:', error);
      req.flash('error', 'Error resetting password.');
      res.redirect('/profile');
  }
});

