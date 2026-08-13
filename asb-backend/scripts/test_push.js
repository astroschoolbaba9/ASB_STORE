const mongoose = require('mongoose');
require('dotenv').config();

const DeviceToken = require('../src/models/DeviceToken');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const { sendExpoPushMultiple, isExpoPushToken } = require('../src/utils/expoPush');

async function sendTestNotification() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asb_crystal');
    console.log('Connected to MongoDB.');

    const title = '✨ ASB Special Message';
    const message = 'hello user enjoy';

    // 1. Create Broadcast Notification in Database
    const notification = await Notification.create({
      isBroadcast: true,
      title,
      message,
      type: 'broadcast',
      link: '',
    });
    console.log('Notification record created in DB:', notification._id);

    // 2. Fetch device tokens & user tokens
    const [deviceRecords, userRecords] = await Promise.all([
      DeviceToken.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken').lean(),
      User.find({ pushToken: { $exists: true, $ne: '' } }).select('pushToken').lean(),
    ]);

    const rawTokens = [
      ...deviceRecords.map((d) => d.pushToken),
      ...userRecords.map((u) => u.pushToken),
    ];

    const pushTokens = Array.from(new Set(rawTokens.filter(isExpoPushToken)));
    console.log(`Found ${pushTokens.length} valid Expo Push Tokens:`, pushTokens);

    if (pushTokens.length > 0) {
      console.log('Sending Expo push notification to devices...');
      const ticketChunk = await sendExpoPushMultiple({
        pushTokens,
        title,
        body: message,
        data: { type: 'broadcast' },
      });
      console.log('Push dispatch tickets:', ticketChunk);
    } else {
      console.log('No registered push tokens found in DB yet.');
    }

    console.log('Test notification process finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error sending test push notification:', err);
    process.exit(1);
  }
}

sendTestNotification();
