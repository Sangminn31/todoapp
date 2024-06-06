import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  const client = new MongoClient(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db('forum');
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    await db.collection('user').insertOne({
      username: 'testuser',
      password: hashedPassword,
    });
    console.log('Test user created successfully.');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await client.close();
  }
}

createTestUser();
