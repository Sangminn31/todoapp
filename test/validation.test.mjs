import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';

describe('Form Validation', function () {
  this.timeout(20000); // Increase timeout for this suite

  it('should not register a user with a short password', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: 'testuser',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(res.status).to.equal(400);
    expect(res.text).to.equal('Password must be at least 8 characters long');
  });

  it('should not register a user with empty username', async () => {
    const res = await request(app).post('/auth/signup').send({
      username: '',
      password: 'testpassword',
      confirmPassword: 'testpassword',
    });
    expect(res.status).to.equal(400);
    expect(res.text).to.equal('Username is required');
  });
});
