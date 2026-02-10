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

console.log("SQL Config:", {
  user: sqlConfig.user,
  server: sqlConfig.server,
  database: sqlConfig.database
});

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
      utmSource,
      county,
      firstResponder,
      faith,
      lawEnforcement,
      age,
      veteran,
      preferredContactMethod,
      employmentStatus,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      gclid,
      fbclid,
      landing_page_url,
      referrer_url
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
      .input('county', sql.NVarChar, county || null)
      .input('whereToMeet', sql.NVarChar, whereToMeet || null)
      .input('firstResponder', sql.NVarChar, firstResponder || null)
      .input('faith', sql.NVarChar, faith || null)
      .input('lawEnforcement', sql.NVarChar, lawEnforcement || null)
      .input('age', sql.NVarChar, age || null)
      .input('veteran', sql.NVarChar, veteran || null)
      .input('preferredContactMethod', sql.NVarChar, preferredContactMethod || null)
      .input('employmentStatus', sql.NVarChar, employmentStatus || null)
      .input('comments', sql.NVarChar, comments || null)
      .input('utmSource', sql.NVarChar, utmSource || 'organic')
      .input('utmMedium', sql.NVarChar, utm_medium || null)
      .input('utmCampaign', sql.NVarChar, utm_campaign || null)
      .input('utmContent', sql.NVarChar, utm_content || null)
      .input('utmTerm', sql.NVarChar, utm_term || null)
      .input('gclid', sql.NVarChar, gclid || null)
      .input('fbclid', sql.NVarChar, fbclid || null)
      .input('landingPageUrl', sql.NVarChar, landing_page_url || null)
      .input('referrerUrl', sql.NVarChar, referrer_url || null)
      .query(`
        INSERT INTO UserInquiry
        (first_name, last_name, email, phone, alternate_phone, best_time_to_contact, city, state, zip_code, county, where_to_meet, first_responder, faith, law_enforcement, age, veteran, preferred_contact_method, employment_status, comments, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, landing_page_url, referrer_url)
        VALUES (@firstName, @lastName, @email, @phone, @alternatePhone, @bestTimeToContact, @city, @state, @zip, @county, @whereToMeet, @firstResponder, @faith, @lawEnforcement, @age, @veteran, @preferredContactMethod, @employmentStatus, @comments, @utmSource, @utmMedium, @utmCampaign, @utmContent, @utmTerm, @gclid, @fbclid, @landingPageUrl, @referrerUrl)
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

// Health check endpoint for Azure
app.get('/health', async (req, res) => {
  return res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
  // try {
  //   const pool = await sql.connect(sqlConfig);
  //   const result = await pool.request().query('SELECT 1 as [value]');
    
  //   if (result.recordset && result.recordset.length > 0) {
  //     return res.status(200).json({ 
  //       status: 'healthy',
  //       timestamp: new Date().toISOString(),
  //       database: 'connected'
  //     });
  //   }
  // } catch (err) {
  //   console.error('Health check error:', err);
  //   return res.status(503).json({ 
  //     status: 'unhealthy',
  //     timestamp: new Date().toISOString(),
  //     database: 'disconnected',
  //     error: err.message
  //   });
  // }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// test build 4