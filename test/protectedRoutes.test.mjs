import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js'; // Ensure the correct path to your server file

let authenticatedUser;

before(async function () {
  this.timeout(10000); // Increase timeout for this hook

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

describe('Protected Routes', () => {
  it('should access the write page when authenticated', async () => {
    console.log(
      'Sending request with authenticated cookie:',
      authenticatedUser
    );

    const res = await request(app)
      .get('/posts/write')
      .set('Cookie', authenticatedUser);

    console.log('Response body:', res.text);

    expect(res.status).to.equal(200);
    expect(res.text).to.include('Write a new post');
  });

  it('should not access the write page when not authenticated', async () => {
    const res = await request(app).get('/posts/write');
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/auth/login');
  });
});
