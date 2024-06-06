import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js'; // Ensure the correct path to your server file

let authenticatedUser;
let postId;

before(async function () {
  this.timeout(20000); // Increase timeout for this hook

  console.log('Connecting to MongoDB...');

  try {
    await new Promise((resolve, reject) => {
      if (global.db) {
        console.log('MongoDB is already connected.');
        resolve();
      } else {
        console.log('Waiting for MongoDB connection...');
        const checkConnection = setInterval(() => {
          if (global.db) {
            clearInterval(checkConnection);
            console.log('MongoDB connection established.');
            resolve();
          }
        }, 100);
      }
    });

    console.log('Attempting to login...');

    const res = await request(app).post('/auth/login').send({
      username: 'testuser',
      password: 'testpassword',
    });

    authenticatedUser = res.headers['set-cookie'];

    console.log('Login successful, cookie:', authenticatedUser);
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
});

describe('Post Routes', () => {
  it('should create a new post', async () => {
    const res = await request(app)
      .post('/posts/add')
      .set('Cookie', authenticatedUser)
      .send({
        title: 'Test Post',
        content: 'This is a test post',
      });

    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/posts/list');
  });

  it('should list all posts', async () => {
    const res = await request(app).get('/posts/list');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Test Post');
  });

  it('should view a post detail', async () => {
    const post = await global.db
      .collection('post')
      .findOne({ title: 'Test Post' });
    const res = await request(app).get(`/posts/detail/${post._id}`);
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Test Post');
  });

  it('should edit a post', async () => {
    const post = await global.db
      .collection('post')
      .findOne({ title: 'Test Post' });
    const res = await request(app)
      .put(`/posts/edit`)
      .set('Cookie', authenticatedUser)
      .send({
        id: post._id,
        title: 'Updated Test Post',
        content: 'This is an updated test post',
      });
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/posts/list');
  });

  it('should delete a post', async () => {
    const post = await global.db
      .collection('post')
      .findOne({ title: 'Test Post' });
    const res = await request(app)
      .delete('/posts/delete')
      .set('Cookie', authenticatedUser)
      .send({
        docid: post._id,
      });

    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/posts/list');
  });
});
