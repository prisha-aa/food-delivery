
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Load AWS SDK config
const AWS = require('../shared/aws-config');

const sqs = new AWS.SQS();
const sns = new AWS.SNS();

const QUEUE_URL = process.env.INVENTORY_QUEUE_URL;
const INVENTORY_TOPIC_ARN = process.env.INVENTORY_TOPIC_ARN;

// Simulated inventory database
const stock = {
  burger: 30,
  fries: 40,
  coke: 50,
  pizza: 10,
};

// Function to continuously poll the inventory queue for new messages
const pollMessages = async () => {
  console.log("📡 Polling inventory queue...");

  try {
    const res = await sqs.receiveMessage({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
    }).promise();

    const messages = res.Messages || [];

    for (const msg of messages) {
      console.log("📨 Received message:", msg.Body);

      const order = JSON.parse(msg.Body);

      const inStock = order.items.every(item => {
        const available = stock[item.name] || 0;
        console.log(`🔍 Checking stock for ${item.name}: Needed=${item.quantity}, Available=${available}`);
        return available >= item.quantity;
      });

      const result = {
        orderId: order.orderId,
        amount: order.amount,
        status: inStock ? 'confirmed' : 'failed',
      };

      console.log(`📦 Inventory check result for Order ${order.orderId}: ${result.status}`);

      await sns.publish({
        TopicArn: INVENTORY_TOPIC_ARN,
        Message: JSON.stringify(result),
      }).promise();

      console.log("📤 Published inventory result to SNS");

      await sqs.deleteMessage({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: msg.ReceiptHandle,
      }).promise();

      console.log("✅ Message deleted from SQS");
    }
  } catch (err) {
    console.error("🔥 Error while polling inventory queue:", err);
  }

  setImmediate(pollMessages);
};

pollMessages();
