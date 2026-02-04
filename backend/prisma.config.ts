import { PrismaConfig } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

export const prismaConfig: PrismaConfig = {
  datasources: {
    db: {
      // Provide your database URL here
      adapter: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL!,
      },
    },
  },
};
