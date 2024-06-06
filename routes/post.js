const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { ensureAuthenticated } = require('../middleware/auth');

// GET all posts
router.get('/list', async (req, res) => {
    try {
      const posts = await Post.find().populate('user').sort({ createdAt: -1 }); // Ensure the user field is populated
      res.render('list', { 
        posts, 
        title: 'All Posts', 
        layout: 'layouts/layout', 
        messages: req.flash() // Pass the messages variable
      });
    } catch (error) {
      req.flash('error_msg', 'Failed to load posts.');
      res.redirect('/');
    }
  });

// GET post details
router.get('/detail/:id', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found.');
      return res.redirect('/posts/list');
    }
    res.render('detail', { 
      post, 
      title: 'Post Details', 
      layout: 'layouts/layout',
      messages: req.flash() // Pass the messages variable
    });
  } catch (error) {
    req.flash('error_msg', 'Failed to load post details.');
    res.redirect('/posts/list');
  }
});

// GET create post form
router.get('/write', ensureAuthenticated, (req, res) => {
  res.render('write', { 
    title: 'Write Post', 
    layout: 'layouts/layout',
    messages: req.flash() // Pass the messages variable
  });
});

// POST create post
router.post('/write', ensureAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({
      title,
      content,
      user: req.user._id
    });
    await newPost.save();
    req.flash('success_msg', 'Post created successfully');
    res.redirect('/posts/list');
  } catch (error) {
    req.flash('error_msg', 'Failed to create post');
    res.redirect('/posts/write');
  }
});

// GET edit post form
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found.');
      return res.redirect('/posts/list');
    }
    res.render('edit', { 
      post, 
      title: 'Edit Post', 
      layout: 'layouts/layout',
      messages: req.flash() // Pass the messages variable
    });
  } catch (error) {
    req.flash('error_msg', 'Failed to load post.');
    res.redirect('/posts/list');
  }
});

// POST update post
router.post('/update/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error_msg', 'Post not found.');
      return res.redirect('/posts/list');
    }
    post.title = title;
    post.content = content;
    await post.save();
    req.flash('success_msg', 'Post updated successfully.');
    res.redirect('/posts/detail/' + req.params.id);
  } catch (error) {
    req.flash('error_msg', 'Failed to update post.');
    res.redirect('/posts/edit/' + req.params.id);
  }
});

// DELETE post
router.post('/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Post.findByIdAndRemove(req.params.id);
    req.flash('success_msg', 'Post deleted successfully');
    res.redirect('/posts/list');
  } catch (error) {
    req.flash('error_msg', 'Failed to delete post');
    res.redirect('/posts/list');
  }
});

module.exports = router;
