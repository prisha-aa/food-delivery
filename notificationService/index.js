const path = require('path');
// require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('Loaded AWS key:', process.env.AWS_ACCESS_KEY_ID);
// Import AWS SDK with shared custom configuration
const AWS = require('../shared/aws-config');

// Load environment variables from .env file
// require('dotenv').config();


// Initialize the SQS service object
const sqs = new AWS.SQS();

// Read the URL of the notification queue from environment variables
const QUEUE_URL = process.env.NOTIFY_QUEUE_URL;

// Function to continuously poll the notification queue for new messages
const pollMessages = async () => {
  // Request up to 1 message from the SQS queue, waiting up to 10 seconds if none are immediately available
  const res = await sqs.receiveMessage({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  }).promise();

  // Extract received messages, or use an empty array if none were returned
  const messages = res.Messages || [];

  // Process each message received
  for (const msg of messages) {
    // Parse the JSON body of the message
    const data = JSON.parse(msg.Body);

    // Log the confirmation message to the console (acts as a stand-in for real notification logic)
    console.log(`📨 Confirmation: Order ${data.orderId} payment ${data.payment}. Amount: ₹${data.amount}`);

    // Delete the message from the queue to prevent it from being processed again
    await sqs.deleteMessage({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: msg.ReceiptHandle,
    }).promise();
  }

  // Continue polling immediately to avoid blocking the event loop
  setImmediate(pollMessages);
};

// Start polling the SQS queue
pollMessages();
