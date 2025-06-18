


// const path = require('path');
// // require('dotenv').config();
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// // Import AWS SDK with custom configuration from a shared config file
// const AWS = require('../shared/aws-config');

// // Load environment variables from .env file

// // Initialize SQS and SNS service objects
// const sqs = new AWS.SQS();
// const sns = new AWS.SNS();

// // Read queue URL and SNS topic ARN from environment variables
// const QUEUE_URL = process.env.PAYMENT_QUEUE_URL;
// const PAYMENT_TOPIC_ARN = process.env.PAYMENT_TOPIC_ARN;

// // Function to continuously poll SQS for new messages
// const pollMessages = async () => {
//   // Receive up to 1 message from the SQS queue, waiting up to 10 seconds if none are immediately available
//   const res = await sqs.receiveMessage({
//     QueueUrl: QUEUE_URL,
//     MaxNumberOfMessages: 1,
//     WaitTimeSeconds: 10,
//   }).promise();

//   // Extract messages or default to an empty array if none are received
//   const messages = res.Messages || [];

//   // Iterate through all received messages
//   for (const msg of messages) {
//     // Parse the message body to JSON
//     const data = JSON.parse(msg.Body);

//     // Check if the payment status is confirmed
//     const success = data.status === 'confirmed';

//     if (success) {
//       // Prepare a result object to publish to SNS
//       const result = {
//         orderId: data.orderId,
//         amount: data.amount,
//         payment: 'success',
//       };

//       // Publish the result to the payment topic (SNS)
//       await sns.publish({
//         TopicArn: PAYMENT_TOPIC_ARN,
//         Message: JSON.stringify(result),
//       }).promise();
//     }

//     // Delete the processed message from the SQS queue to prevent re-processing
//     await sqs.deleteMessage({
//       QueueUrl: QUEUE_URL,
//       ReceiptHandle: msg.ReceiptHandle,
//     }).promise();
//   }

//   // Recursively call pollMessages to keep polling without blocking the event loop
//   setImmediate(pollMessages);
// };

// // Start polling the queue
// pollMessages(); 


const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import AWS SDK with custom configuration from a shared config file
const AWS = require('../shared/aws-config');

// Initialize SQS and SNS service objects
const sqs = new AWS.SQS();
const sns = new AWS.SNS();

// Read queue URL and SNS topic ARN from environment variables
const QUEUE_URL = process.env.PAYMENT_QUEUE_URL;
const PAYMENT_TOPIC_ARN = process.env.PAYMENT_TOPIC_ARN;

// Function to continuously poll SQS for new messages
const pollMessages = async () => {
  console.log("📡 Polling payment queue...");

  try {
    const res = await sqs.receiveMessage({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
    }).promise();

    const messages = res.Messages || [];

    for (const msg of messages) {
      console.log("📨 Received message:", msg.Body);

      const data = JSON.parse(msg.Body);
      const success = data.status === 'confirmed';

      if (success) {
        const result = {
          orderId: data.orderId,
          amount: data.amount,
          payment: 'success',
        };

        console.log("📤 Publishing payment result to SNS:", result);

        await sns.publish({
          TopicArn: PAYMENT_TOPIC_ARN,
          Message: JSON.stringify(result),
        }).promise();
      } else {
        console.log("❌ Payment status not confirmed. Skipping.");
      }

      await sqs.deleteMessage({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: msg.ReceiptHandle,
      }).promise();

      console.log("✅ Message deleted from SQS");
    }
  } catch (err) {
    console.error("🔥 Error while polling payment queue:", err);
  }

  // Recursively call pollMessages to keep polling without blocking the event loop
  setImmediate(pollMessages);
};

// Start polling the queue
pollMessages();
