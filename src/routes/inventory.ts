import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { InventoryItem, IInventoryItem } from '../models/inventoryItem.js';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate());

inventoryRouter.get('/', requireRoles('admin', 'receptionist'), async (_req: Request, res: Response) => {
  try {
    const items = await InventoryItem.find().sort({ name: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

inventoryRouter.post('/', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<IInventoryItem>;
    const created = await InventoryItem.create(payload);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create inventory item' });
  }
});

inventoryRouter.patch('/:id/adjust', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { delta, set } = req.body as { delta?: number; set?: number };
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (typeof set === 'number') item.quantity = set;
    if (typeof delta === 'number') item.quantity += delta;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Failed to adjust inventory' });
  }
});

inventoryRouter.get('/alerts', requireRoles('admin', 'receptionist'), async (_req: Request, res: Response) => {
  try {
    const low = await InventoryItem.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).lean();
    res.json(low);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});


