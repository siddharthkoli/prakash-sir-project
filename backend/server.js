const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');


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
const sql = require('mssql');
const sqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASS,
  server: process.env.SQL_HOST,      // example: "mydb.database.windows.net"
  database: process.env.SQL_DB,
  pool: { max: 10, min: 0, idleTimeoutMillis: 15000 },
  options: {
    encrypt: true, // required for Azure
    trustServerCertificate: false
  }
};

try {
  sql.connect(sqlConfig)
    .then(() => console.log("Connected to Azure SQL"))
    .catch(err => console.error("SQL connection error:", err));
} catch (err) {
  console.error("Error setting up SQL connection:", err);
}


// API endpoint
app.post('/api/userInquiry', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      bestTimeToContact,
      address,
      whereToMeet,
      comments,
      utmSource
    } = req.body;

    console.log(`Received data: ${JSON.stringify(req.body)}`);

    if (!firstName || !lastName || !email || !phone || !address) {
      return res.status(400).json({ message: 'firstName, lastName, email, phone, and address are required' });
    }

    const pool = await sql.connect(sqlConfig);

    const result = await pool.request()
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('alternatePhone', sql.NVarChar, alternatePhone || null)
      .input('bestTimeToContact', sql.NVarChar, bestTimeToContact)
      .input('city', sql.NVarChar, address.city)
      .input('state', sql.NVarChar, address.state)
      .input('zip', sql.NVarChar, address.zip)
      .input('whereToMeet', sql.NVarChar, whereToMeet)
      .input('comments', sql.NVarChar, comments)
      .input('utmSource', sql.NVarChar, utmSource || null)
      .query(`
        INSERT INTO UserInquiry
        (firstName, lastName, email, phone, alternatePhone, bestTimeToContact, city, state, zip, whereToMeet, comments, utmSource)
        VALUES (@firstName, @lastName, @email, @phone, @alternatePhone, @bestTimeToContact, @city, @state, @zip, @whereToMeet, @comments, @utmSource)
      `);

    console.log('UserInquiry inserted. Rows affected:', result.rowsAffected[0]);

    return res.status(201).json({ message: 'UserInquiry created' });
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

// test build 3