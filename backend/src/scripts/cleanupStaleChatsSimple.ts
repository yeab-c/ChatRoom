
 // Cleanup Script: Remove stale Chat documents (Simple version)

 //This script removes Chat documents from MongoDB where:
 // The chat is permanent
 // But no SavedChat records exist in PostgreSQL
  
 // Usage: npx ts-node -r tsconfig-paths/register src/scripts/cleanupStaleChatsSimple.ts

import { PrismaClient } from '@prisma/client';
import mongoose, { Schema } from 'mongoose';

// Initialize Prisma
const prisma = new PrismaClient();

// Define Chat schema inline
interface IChat {
  chatId: string;
  participants: string[];
  type: 'temporary' | 'permanent';
  isTemporary: boolean;
  expiresAt?: Date;
  savedBy: string[];
  isSaved: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema({
  chatId: { type: String, required: true, unique: true },
  participants: { type: [String], required: true },
  type: { type: String, enum: ['temporary', 'permanent'], required: true },
  isTemporary: { type: Boolean, default: true },
  expiresAt: Date,
  savedBy: { type: [String], default: [] },
  isSaved: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
}, { timestamps: true });

const Chat = mongoose.model<IChat>('Chat', ChatSchema);

async function cleanupStaleChats() {
  try {
    console.log('Connecting to databases...');
    
    // Get MongoDB URI from environment
    const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/chatroom';
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    // Get all permanent chats from MongoDB
    const allChats = await Chat.find({ type: 'permanent' });
    console.log(`Found ${allChats.length} permanent chats in MongoDB`);

    let deletedCount = 0;
    let keptCount = 0;

    for (const chat of allChats) {
      const [userId1, userId2] = chat.participants;

      // Check if SavedChat exists for either user
      const savedChatExists = await prisma.savedChat.findFirst({
        where: {
          OR: [
            { userId: userId1, otherUserId: userId2 },
            { userId: userId2, otherUserId: userId1 },
          ],
        },
      });

      if (!savedChatExists) {
        // No SavedChat exists - this is a stale chat
        console.log(`Deleting stale chat: ${chat.chatId} (participants: ${userId1}, ${userId2})`);
        await Chat.deleteOne({ _id: chat._id });
        deletedCount++;
      } else {
        keptCount++;
      }
    }

    console.log('\nCleanup complete!');
    console.log(` - Deleted: ${deletedCount} stale chats`);
    console.log(` - Kept: ${keptCount} valid chats`);

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    // Disconnect
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('Disconnected from databases');
  }
}

// Run the cleanup
cleanupStaleChats()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
