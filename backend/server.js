const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const UserInquiry = require('./models/userInquiry.model');

// Load environment variables when not preloaded by node -r
try {
  require('dotenv').config();
} catch (e) {
  // dotenv may already be preloaded via node -r dotenv/config
  console.warn('Could not load .env file, proceeding with existing environment variables');
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public", "browser")));

// Build MongoDB URI from env variables
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoHost = process.env.MONGO_HOST || 'cluster0.6gx8cuw.mongodb.net';
const mongoDb = process.env.MONGO_DB || '';

let MONGO_URI;
if (mongoUser && mongoPass) {
  const dbSegment = mongoDb ? `/${mongoDb}` : '';
  MONGO_URI = `mongodb+srv://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPass)}@${mongoHost}${dbSegment}?retryWrites=true&w=majority`;
} else if (process.env.MONGO_URI) {
  MONGO_URI = process.env.MONGO_URI;
} else {
  console.error('MongoDB credentials not provided via environment variables. Set MONGO_USER and MONGO_PASS or MONGO_URI.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API endpoint
app.post('/api/userInquiry', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      whereToMeet,
      comments
    } = req.body;

    console.log(`Received data: ${JSON.stringify(req.body)}`);

    if (!firstName || !lastName || !email || !phone || !address) {
      return res.status(400).json({ message: 'firstName and lastName are required' });
    }

    const userInquiry = new UserInquiry({ firstName, lastName, email, phone, address, whereToMeet, comments });
    await userInquiry.validate();
    await userInquiry.save();
    console.log('UserInquiry saved:', userInquiry);
    return res.status(201).json({ message: 'UserInquiry created', userInquiry });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
