const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Conditional email setup based on environment variable
let emailClient = null;
let emailHtml = null;
const emailNotificationsEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

if (emailNotificationsEnabled) {
  try {
    emailClient = require('./emailClient');
    const mjml2html = require("mjml");
    const mjmlTemplateString = fs.readFileSync(path.join(__dirname, 'emailTemplate.mjml'), 'utf-8');
    const { html } = mjml2html(mjmlTemplateString);
    emailHtml = html;
    console.log('✓ Email notifications enabled');
  } catch (err) {
    console.error('✗ Failed to initialize email notifications:', err.message);
    emailClient = null;
    emailHtml = null;
  }
} else {
  console.log('ℹ Email notifications disabled (set ENABLE_EMAIL_NOTIFICATIONS=true to enable)');
}


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

// Lazy health check: only ping DB if approaching sleep threshold (50 min of inactivity)
const IDLE_THRESHOLD_MS = 50 * 60 * 1000; // 50 minutes
let lastQueryTime = Date.now();

async function ensureDbConnection() {
  try {
    const now = Date.now();
    if (now - lastQueryTime > IDLE_THRESHOLD_MS) {
      const pool = await sql.connect(sqlConfig);
      await pool.request().query('SELECT 1 as [value]');
      lastQueryTime = now;
      console.log('Database kept alive');
    }
  } catch (err) {
    console.error('Error keeping DB alive:', err);
  }
}

try {
  sql.connect(sqlConfig)
    .then(() => console.log("Connected to Azure SQL"))
    .catch(err => console.error("SQL connection error:", err));
} catch (err) {
  console.error("Error setting up SQL connection:", err);
}

async function sendEmail({ to, subject, html }) {
  if (!emailNotificationsEnabled || !emailClient) {
    console.log(`ℹ Email would be sent to ${to} (notifications currently disabled)`);
    return { status: 'skipped', reason: 'Email notifications disabled' };
  }

  try {
    const message = {
      senderAddress: "DoNotReply@c2b3abed-e60e-4943-b3b7-e48ffd91753b.azurecomm.net",
      content: {
        subject,
        html
      },
      recipients: {
        to: [{ address: to }]
      }
    };

    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();

    return result;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
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
      preferredLodgeAddress,
      comments,
      utmSource,
      faith,
      age,
      preferredContactMethod,
      employmentStatus,
      employmentTypeCategory,
      employmentType,
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

    // figure out which county we should use when doing a regional lookup
    const effectiveCounty = (preferredLodgeAddress && preferredLodgeAddress.county)
      ? preferredLodgeAddress.county
      : address.county;

    let region = null;
    let district = null;
    let autoLodgeId = null;

    if (effectiveCounty) {
      try {
        const mapping = await pool.request()
          .input('county', sql.NVarChar, effectiveCounty)
          .query(
`          SELECT d.district_name,
                 r.region_name,
                 (SELECT TOP 1 id
                  FROM Lodges
                  WHERE district_id = c.district_id
                  ORDER BY id) AS lodge_id
           FROM county c
           LEFT JOIN Districts d ON d.id = c.district_id
           LEFT JOIN Regions r ON r.id = d.region_id
           WHERE c.county_name = @county`);

        if (mapping.recordset.length) {
          district = mapping.recordset[0].district_name;
          region = mapping.recordset[0].region_name;
          // autoLodgeId = mapping.recordset[0].lodge_id;
        }
      } catch (err) {
        // lookup tables might not exist in this database; ignore and proceed
        console.warn('Could not resolve region/district for county', effectiveCounty, err.message);
      }
    }

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
      .input('county', sql.NVarChar, address.county || null)
      .input('faith', sql.NVarChar, faith || null)
      .input('age', sql.NVarChar, age || null)
      .input('preferredContactMethod', sql.NVarChar, preferredContactMethod || null)
      .input('employmentStatus', sql.NVarChar, employmentStatus || null)
      .input('employmentTypeCategory', sql.NVarChar, employmentTypeCategory || null)
      .input('employmentType', sql.NVarChar, employmentType || null)
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
      .input('lodgeCity', sql.NVarChar, preferredLodgeAddress ? preferredLodgeAddress.city : null)
      .input('lodgeState', sql.NVarChar, preferredLodgeAddress ? preferredLodgeAddress.state : null)
      .input('lodgeZip', sql.NVarChar, preferredLodgeAddress ? preferredLodgeAddress.zip : null)
      .input('lodgeCounty', sql.NVarChar, preferredLodgeAddress ? preferredLodgeAddress.county : null)
      .input('region', sql.NVarChar, region || null)
      .input('district', sql.NVarChar, district || null)
      .input('allocatedLodgeId', sql.Int, autoLodgeId || null)
      .query(`
        INSERT INTO UserInquiry
        (first_name, last_name, email, phone, alternate_phone, best_time_to_contact, city, state, zip_code, county, faith, age, preferred_contact_method, employment_status, employment_type_category, employment_type, comments, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, landing_page_url, referrer_url, lodge_city, lodge_state, lodge_zip_code, lodge_county, region, district, allocated_lodge_id)
        VALUES (@firstName, @lastName, @email, @phone, @alternatePhone, @bestTimeToContact, @city, @state, @zip,@county,@faith,@age,@preferredContactMethod,@employmentStatus,@employmentTypeCategory,@employmentType,@comments,@utmSource,@utmMedium,@utmCampaign,@utmContent,@utmTerm,@gclid,@fbclid,@landingPageUrl,@referrerUrl,@lodgeCity,@lodgeState,@lodgeZip,@lodgeCounty,@region,@district,@allocatedLodgeId)
      `);

    console.log('UserInquiry inserted. Rows affected:', result.rowsAffected[0]);
    lastQueryTime = Date.now(); // Reset keep-alive timer on successful user activity

    // Send email notification if enabled
    if (emailNotificationsEnabled) {
      sendEmail({
        to: email,
        subject: "NY Masons - Inquiry Received",
        html: emailHtml
      }).catch(err => console.error('Failed to send email:', err.message));
    }

    return res.status(201).json({ message: 'UserInquiry created' });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/testEmail', async (req, res) => {
  const to = req.query.to;
  if (!to)
    return res.status(400).json({ message: 'Missing "to" query parameter' });

  if (!emailNotificationsEnabled) {
    return res.status(400).json({ message: 'Email notifications are disabled. Set ENABLE_EMAIL_NOTIFICATIONS=true to enable.' });
  }

  try {
    const result = await sendEmail({
      to,
      subject: "NY Masons - Inquiry Received",
      html: emailHtml
    });
    res.json({ message: 'Email sent', result });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Error sending email', error: err.message });
  }
});

// Health check endpoint for Azure
// Keeps DB alive by pinging only if 50+ mins have passed since last activity
app.get('/health', async (req, res) => {
  const now = Date.now();
  
  // Only ping DB if approaching the 60-min sleep threshold
  if (now - lastQueryTime > IDLE_THRESHOLD_MS) {
    try {
      const pool = await sql.connect(sqlConfig);
      await pool.request().query('SELECT 1 as [value]');
      lastQueryTime = now;
      console.log('Database kept alive via health check');
    } catch (err) {
      console.error('Error keeping DB alive:', err);
      // Don't fail health check — keep app service happy
    }
  }
  
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// test build 4