import { EmailClient } from "@azure/communication-email";

const emailClient = new EmailClient(
  process.env.ACS_CONNECTION_STRING
);

export default emailClient;