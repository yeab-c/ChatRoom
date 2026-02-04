import { prisma } from '@/config/database';
import { connectMongoDB, connectPostgreSQL, disconnectDatabases } from '@/config/database';
import { logger } from '@/utils/logger';

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      {
        clerkId: 'user_test1',
        email: 'test1@bitscollege.edu.et',
        name: 'Test User 1',
        avatar: 'https://i.pravatar.cc/150?img=1',
        bio: 'Test user for development',
      },
      {
        clerkId: 'user_test2',
        email: 'test2@bitscollege.edu.et',
        name: 'Test User 2',
        avatar: 'https://i.pravatar.cc/150?img=2',
        bio: 'Another test user',
      },
      {
        clerkId: 'user_test3',
        email: 'test3@bitscollege.edu.et',
        name: 'Test User 3',
        avatar: 'https://i.pravatar.cc/150?img=3',
        bio: 'Third test user',
      },
    ];

    for (const userData of users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });
    }

    logger.info(`Seeded ${users.length} test users`);
  } catch (error) {
    logger.error('Error seeding users:', error);
  }
};

// Main seed function
const runSeed = async (): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Connect to databases
    await connectPostgreSQL();
    await connectMongoDB();

    // Run seed tasks
    await seedUsers();

    logger.info('Database seeding complete!');

    // Disconnect
    await disconnectDatabases();

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed if executed directly
if (require.main === module) {
  runSeed();
}

export { runSeed, seedUsers };