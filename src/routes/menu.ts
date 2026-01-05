import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { MenuItem, IMenuItem } from '../models/menuItem.js';

export const menuRouter = Router();
menuRouter.use(authenticate());

menuRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await MenuItem.find({ available: true }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

menuRouter.post('/', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<IMenuItem>;
    const created = await MenuItem.create(payload);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create menu item' });
  }
});


