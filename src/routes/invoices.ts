import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Invoice, IInvoiceLineItem } from '../models/invoice.js';
import { Booking } from '../models/booking.js';
import { Room } from '../models/room.js';
import { Order } from '../models/order.js';

export const invoicesRouter = Router();
invoicesRouter.use(authenticate());

// GET /invoices/:bookingId — returns latest invoice or computed preview
invoicesRouter.get('/:bookingId', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const existing = await Invoice.findOne({ bookingId }).sort({ createdAt: -1 }).lean();
    if (existing) return res.json(existing);

    const preview = await buildInvoicePreview(bookingId);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /invoices/:bookingId/generate — persists an invoice; optional extra items, serviceFeePct, discount
invoicesRouter.post('/:bookingId/generate', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const extraItems = (req.body?.items || []) as IInvoiceLineItem[];
    const serviceFeePct = Number(req.body?.serviceFeePct ?? 0);
    const discount = Number(req.body?.discount ?? 0);

    const base = await buildInvoicePreview(bookingId);
    const allItems: IInvoiceLineItem[] = [...base.lineItems, ...extraItems];
    const subtotal = allItems.reduce((s, i) => s + i.amount * i.qty, 0);
    const serviceFee = Math.round((subtotal * serviceFeePct) * 100) / 100;
    const total = Math.max(0, subtotal + serviceFee - discount);

    const saved = await Invoice.create({ bookingId, lineItems: allItems, subtotal, total });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to generate invoice' });
  }
});

async function buildInvoicePreview(bookingId: string) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) throw new Error('Booking not found');
  const room = await Room.findById(booking.roomId).lean();
  const nights = Math.max(1, Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (24 * 60 * 60 * 1000)));
  const roomLine: IInvoiceLineItem = { description: `Room ${room?.roomNumber ?? ''} (${nights} night${nights > 1 ? 's' : ''})`, qty: 1, amount: (room?.rate ?? 0) * nights };

  const orders = await Order.find({ guestId: booking.guestId }).lean();
  const ordersTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const diningLine: IInvoiceLineItem | undefined = ordersTotal > 0 ? { description: 'Dining & Room Service', qty: 1, amount: ordersTotal } : undefined;

  const lineItems = [roomLine, ...(diningLine ? [diningLine] : [])];
  const subtotal = lineItems.reduce((s, i) => s + i.amount * i.qty, 0);
  return { bookingId, lineItems, subtotal, total: subtotal };
}


