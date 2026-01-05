import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/user.js';
import { logger } from '../lib/logger.js';

export const userRouter = Router();

// Apply authentication middleware to all routes in this router
userRouter.use(authenticate());

// POST /register - Create a new user in MongoDB after Firebase Auth
userRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const user = req.user; // Set by the authenticate middleware
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ uid: user.uid });
    if (existingUser) {
      return res.status(200).json(existingUser); // Idempotent success
    }

    // Create new user linked to Firebase UID
    const newUser = await User.create({
      uid: user.uid,
      email: email || user.email,
      name: name,
      phone: phone,
      roles: ['customer'] // Default role
    });

    logger.info(`New user registered: ${newUser.email}`);
    res.status(201).json(newUser);
  } catch (err) {
    logger.error({ err }, 'Failed to register user');
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET /me - Get current user profile
userRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await User.findOne({ uid: user.uid });
    
    if (!doc) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json(doc);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch profile');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /me - Update profile
userRouter.put('/me', async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const update = req.body;
    
    // Prevent updating sensitive fields like uid or roles via this endpoint
    delete update.uid;
    delete update.roles; 

    const doc = await User.findOneAndUpdate(
      { uid: user.uid }, 
      update, 
      { new: true }
    );

    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update profile' });
  }
});