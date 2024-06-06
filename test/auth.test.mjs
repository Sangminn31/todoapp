import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';

describe('Auth Routes', function () {
  this.timeout(20000); // Increase timeout for this suite

  it('should load the signup page', async () => {
    const res = await request(app).get('/auth/signup');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Sign Up');
  });

  it('should load the login page', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Login');
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'testuser',
      password: 'testpassword',
      confirmPassword: 'testpassword',
    });
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/auth/login');
  });

  it('should not register a user with mismatched passwords', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'testuser',
      password: 'testpassword',
      confirmPassword: 'wrongpassword',
    });
    expect(res.status).to.equal(400);
    expect(res.text).to.equal('Passwords do not match');
  });

  it('should login a registered user', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'testuser',
      password: 'testpassword',
    });
    expect(res.status).to.equal(302);
    expect(res.header.location).to.equal('/');
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app).post('/auth/login').send({
      username: 'testuser',
      password: 'wrongpassword',
    });
    expect(res.status).to.equal(401);
    expect(res.text).to.equal('Incorrect password');
  });
});
