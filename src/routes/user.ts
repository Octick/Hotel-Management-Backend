import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { User } from '../models/user.js';
import { logger } from '../lib/logger.js';
import { auth } from '../lib/firebaseAdmin.js'; 

export const userRouter = Router();

/**
 * @route POST /api/users/register
 * @desc Sync a new Firebase user to MongoDB immediately after sign-up
 * @access Private (Verified Firebase User)
 */
userRouter.post('/register', authenticate(), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone } = req.body;

    // Check if user already exists in MongoDB to prevent duplicate entries
    let user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      user = await User.create({
        uid: req.user.uid,
        email: email || req.user.email,
        name: name || 'New User',
        phone: phone,
        roles: ['customer'] // Default role for self-registration
      });
      logger.info({ uid: user.uid }, 'New user successfully synced to MongoDB');
    }

    res.status(201).json(user);
  } catch (err: any) {
    logger.error({ err }, 'Registration sync failed');
    res.status(500).json({ error: 'Failed to sync user to database' });
  }
});

// GET /api/users - List all users (Admin/Staff only)
userRouter.get('/', authenticate(), requireRoles('admin', 'manager', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch users');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/me - Current Profile
userRouter.get('/me', authenticate(), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findOne({ uid: req.user.uid });
    res.json(user || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me - Update Current Profile
userRouter.put('/me', authenticate(), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, phone } = req.body; 
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { name, phone },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/create - Admin explicitly creates a user
userRouter.post('/create', authenticate(), requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone } = req.body;
    const firebaseUser = await auth.createUser({
      email,
      password: password || 'password123',
      displayName: name,
    });
    const newUser = await User.create({
      uid: firebaseUser.uid,
      email,
      name,
      phone,
      roles: [role || 'customer']
    });
    res.status(201).json(newUser);
  } catch (err: any) {
    logger.error({ err }, 'Create user failed');
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// DELETE /api/users/:id - Admin Delete User
userRouter.delete('/:id', authenticate(), requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    try {
      await auth.deleteUser(user.uid);
    } catch (fbErr) {
      logger.warn({ fbErr }, 'Failed to delete from Firebase, deleting local only');
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});