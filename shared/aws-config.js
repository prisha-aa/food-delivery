require('dotenv').config(); // Load environment variables

const AWS = require('aws-sdk');

console.log("Loaded AWS key:", process.env.AWS_ACCESS_KEY_ID);


// Configure AWS using values from .env
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

module.exports = AWS;
