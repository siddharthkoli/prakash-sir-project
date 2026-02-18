const { EmailClient } = require("@azure/communication-email");

const emailClient = new EmailClient(
  process.env.ACS_CONNECTION_STRING
);

module.exports = emailClient; 