// orderService/index.js
const express = require('express');
const AWS = require('../shared/aws-config');
const { v4: uuidv4 } = require('uuid'); // Unique ID generator
require('dotenv').config();

const app = express();
app.use(express.json());
const sns = new AWS.SNS();
const ORDER_TOPIC_ARN = process.env.ORDER_TOPIC_ARN;

// Endpoint to place a new order
app.post('/order', async (req, res) => {
  const { customerName, items } = req.body;
  const orderId = uuidv4();
  const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    orderId,
    customerName,
    items,
    amount,
    timestamp: new Date().toISOString()
  };

  await sns.publish({
    TopicArn: ORDER_TOPIC_ARN,
    Message: JSON.stringify(order),
  }).promise();

  res.send({ message: '✅ Order placed successfully', order });
});

app.listen(3001, () => console.log('🟢 Order Service running on port 3001'));
