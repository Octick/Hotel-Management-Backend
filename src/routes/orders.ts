import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Order, IOrder, IOrderItem } from '../models/order.js';
import { MenuItem } from '../models/menuItem.js';

export const ordersRouter = Router();
ordersRouter.use(authenticate());

// POST /orders (guest or receptionist)
ordersRouter.post('/', requireRoles('customer', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { items, roomId } = req.body as { items: Array<{ menuItemId: string; quantity: number }>; roomId?: string };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Enrich items with name and price snapshot
    const menuItems = await MenuItem.find({ _id: { $in: items.map((i) => i.menuItemId) } }).lean();
    const itemsMap = new Map(menuItems.map((m) => [m._id.toString(), m]));
    const orderItems: IOrderItem[] = items.map((i) => {
      const mi = itemsMap.get(i.menuItemId);
      if (!mi) throw new Error('Invalid menu item');
      return { menuItemId: mi._id as any, name: mi.name, quantity: i.quantity, price: mi.price };
    });

    const totalAmount = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const user = (req as any).user;
    const order = await Order.create({
      guestId: user.sub,
      roomId,
      items: orderItems,
      totalAmount,
      placedBy: user.sub,
    });
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to place order' });
  }
});

// PATCH /orders/:id/status (kitchen/receptionist)
ordersRouter.patch('/:id/status', requireRoles('kitchen', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: 'Preparing' | 'Ready' | 'Served' | 'Cancelled' };
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update order status' });
  }
});


