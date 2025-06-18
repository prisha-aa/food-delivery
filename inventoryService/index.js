// inventoryService/index.js
const AWS = require('../shared/aws-config');
require('dotenv').config();

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

const pollMessages = async () => {
  const res = await sqs.receiveMessage({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  }).promise();

  const messages = res.Messages || [];

  for (const msg of messages) {
    const order = JSON.parse(msg.Body);
    const inStock = order.items.every(item => stock[item.name] >= item.quantity);

    const result = {
      orderId: order.orderId,
      amount: order.amount,
      status: inStock ? 'confirmed' : 'failed'
    };

    await sns.publish({
      TopicArn: INVENTORY_TOPIC_ARN,
      Message: JSON.stringify(result),
    }).promise();

    await sqs.deleteMessage({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: msg.ReceiptHandle,
    }).promise();
  }

  setImmediate(pollMessages);
};

pollMessages();
