import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Booking } from '../models/booking.js';
import { Room } from '../models/room.js';

export const bookingsRouter = Router();

// Apply authentication to all routes
bookingsRouter.use(authenticate());

// ==========================================
// GET /api/bookings
// List all bookings (Admin sees all, Customer sees their own)
// ==========================================
bookingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is staff (Admin or Receptionist)
    const isStaff = user.roles.some((r: string) => ['admin', 'receptionist'].includes(r));
    
    // IF Staff -> Show ALL bookings ({})
    // IF Customer -> Show ONLY their bookings ({ guestId: user.mongoId })
    const filter: any = isStaff ? {} : { guestId: user.mongoId };
    
    const bookings = await Booking.find(filter)
      .populate('roomId') // ✅ Get Room Details (Number, Type)
      .populate('guestId', 'name email phone') // ✅ Get Guest Details (Name, Email) for the Admin Table
      .sort({ createdAt: -1 })
      .lean();
      
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ==========================================
// POST /api/bookings
// Create a new booking
// ==========================================
bookingsRouter.post('/', requireRoles('admin', 'receptionist', 'customer'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { roomId, checkIn, checkOut, guestId } = req.body as {
      roomId: string;
      checkIn: string;
      checkOut: string;
      guestId?: string;
    };

    // Determine the Guest ID:
    // 1. If Admin sends 'guestId' in body, use that.
    // 2. Otherwise, use the logged-in user's 'mongoId'.
    const finalGuestId = guestId || user.mongoId;
    
    if (!finalGuestId) {
      return res.status(400).json({ error: "User profile not found. Please refresh or contact support." });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid dates' });
    }
    if (start >= end) {
        return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    // Check for overlaps
    const overlapping = await Booking.findOne({
      roomId,
      status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] },
      $or: [
        { checkIn: { $lt: end }, checkOut: { $gt: start } },
      ],
    });

    if (overlapping) {
        return res.status(409).json({ error: 'Room is already booked for these dates' });
    }

    // Create the booking
    const created = await Booking.create({
      roomId: room._id,
      guestId: finalGuestId, // ✅ Saves the correct MongoDB User ID
      checkIn: start,
      checkOut: end,
      status: 'Confirmed',
      source: 'Local',
    });
    
    res.status(201).json(created);
  } catch (err: any) {
    console.error("Create Booking Error:", err);
    res.status(400).json({ error: err.message || 'Failed to create booking' });
  }
});

// ==========================================
// POST /api/bookings/:id/checkin
// Check-in a guest (Staff only)
// ==========================================
bookingsRouter.post('/:id/checkin', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'CheckedIn' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Update Room Status
    await Room.findByIdAndUpdate(booking.roomId, { status: 'Occupied' });
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: 'Failed to check in' });
  }
});

// ==========================================
// POST /api/bookings/:id/checkout
// Check-out a guest (Staff only)
// ==========================================
bookingsRouter.post('/:id/checkout', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'CheckedOut' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Mark room as dirty/cleaning
    await Room.findByIdAndUpdate(booking.roomId, { status: 'Cleaning' });
    
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: 'Failed to check out' });
  }
});

// ==========================================
// POST /api/bookings/webhooks/ota
// (Optional) Webhook for Booking.com / Expedia
// ==========================================
bookingsRouter.post('/webhooks/ota', (_req: Request, res: Response) => {
  // Placeholder for future OTA integration
  res.status(200).json({ ok: true });
});