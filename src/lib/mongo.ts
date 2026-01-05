import mongoose from 'mongoose';
import { logger } from './logger.js';

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI not set');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 20,
    retryWrites: true,
  });
  logger.info('Connected to MongoDB');
}




