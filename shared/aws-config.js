require('dotenv').config();
const AWS = require('aws-sdk');

// Configure region for AWS
AWS.config.update({ region: 'ap-south-1' });

module.exports = AWS;