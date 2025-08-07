import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

const generateDatabaseURL = (schema: string) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable');
  }

  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.append('schema', schema);
  return url.toString();
};

const schemaId = randomBytes(6).toString('hex');
const databaseURL = generateDatabaseURL(schemaId);

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseURL,
    },
  },
});

export async function setupTestDatabase() {
  try {
    // Create schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`);
    
    // Push schema
    execSync('npx prisma db push --skip-generate', {
      env: {
        ...process.env,
        DATABASE_URL: databaseURL,
      },
    });
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test database teardown failed:', error);
    throw error;
  }
}