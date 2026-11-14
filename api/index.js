import app from '../backend/index.js';
import { initMongoDB } from '../backend/mongo.js';

export default async function handler(req, res) {
  // Ensure DB connection is initialized
  try {
    await initMongoDB();
  } catch (e) {
    // Handled gracefully inside mongoDao
  }

  // Handle URL normalization if stripped by serverless rewrites
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}

