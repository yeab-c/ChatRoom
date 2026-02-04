
  // Clear MongoDB Script
  
 // WARNING: This will delete ALL data from MongoDB collections:
 // Chats (all chat documents)
 // GroupChats (all group chat documents)
 // Messages (all messages)
 // MatchQueue (all match queue entries)
 // Reports (all reports)
  
 //PostgreSQL data (users, saved chats, blocks, groups) will NOT be affected.
 
 // Usage: npx ts-node src/scripts/clearMongoDB.ts


import mongoose from 'mongoose';
import { Chat, GroupChat, Message, MatchQueue, Report } from '../models/mongodb.models';
import { config } from '../config/env';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function clearMongoDB() {
  try {
    console.log('WARNING: This will delete ALL MongoDB data!');
    console.log(' - Chats');
    console.log(' - GroupChats');
    console.log(' - Messages');
    console.log(' - MatchQueue');
    console.log(' - Reports');
    console.log('');
    console.log(' PostgreSQL data will NOT be affected.');
    console.log('');

    const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('Operation cancelled');
      rl.close();
      process.exit(0);
    }

    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(config.database.mongoUri);
    console.log('MongoDB connected');

    // Count documents before deletion
    const counts = {
      chats: await Chat.countDocuments(),
      groupChats: await GroupChat.countDocuments(),
      messages: await Message.countDocuments(),
      matchQueue: await MatchQueue.countDocuments(),
      reports: await Report.countDocuments(),
    };

    console.log('\n Current document counts:');
    console.log(` - Chats: ${counts.chats}`);
    console.log(` - GroupChats: ${counts.groupChats}`);
    console.log(` - Messages: ${counts.messages}`);
    console.log(` - MatchQueue: ${counts.matchQueue}`);
    console.log(` - Reports: ${counts.reports}`);
    console.log('\n Deleting all documents...');

    // Delete all documents
    await Chat.deleteMany({});
    console.log(' Chats deleted');

    await GroupChat.deleteMany({});
    console.log(' GroupChats deleted');

    await Message.deleteMany({});
    console.log(' Messages deleted');

    await MatchQueue.deleteMany({});
    console.log(' MatchQueue deleted');

    await Report.deleteMany({});
    console.log(' Reports deleted');

    console.log('\nAll MongoDB data cleared!');
    console.log(' Total documents deleted:', 
      counts.chats + counts.groupChats + counts.messages + counts.matchQueue + counts.reports
    );

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    rl.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
clearMongoDB()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
