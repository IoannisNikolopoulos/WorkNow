const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/worknow',
    collectionName: 'sessions',
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24,
    secure: true,
    httpOnly: false,
  },
});

const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Session configuration
module.exports = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // It's better to use an environment variable for the secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/worknow', // Use .env for configuration
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day session duration
    secure: process.env.NODE_ENV === 'production', // Set secure cookies in production
    httpOnly: true, // Ensure cookie is not accessible via client-side scripts
  },
});
