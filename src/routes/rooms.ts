import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Room, IRoom, RoomStatus, RoomType } from '../models/room.js';

export const roomsRouter = Router();

// All routes require authentication
roomsRouter.use(authenticate());

// GET /api/rooms
roomsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, minRate, maxRate } = req.query as {
      status?: RoomStatus;
      type?: RoomType;
      minRate?: string;
      maxRate?: string;
    };

    const filter: any = {};
    // Handle 'All' filter from frontend if necessary
    if (status && status !== 'All' as any) filter.status = status;
    if (type && type !== 'All' as any) filter.type = type;
    
    if (minRate || maxRate) {
      filter.rate = {};
      if (minRate) filter.rate.$gte = Number(minRate);
      if (maxRate) filter.rate.$lte = Number(maxRate);
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 }).lean();
    
    // Map _id to id for frontend compatibility
    const mappedRooms = rooms.map(room => ({
      ...room,
      id: room._id.toString()
    }));

    res.json(mappedRooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms/:id
roomsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id).lean();
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ ...room, id: room._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /api/rooms (admin)
roomsRouter.post('/', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<IRoom>;
    const room = await Room.create(payload);
    res.status(201).json({ ...room.toObject(), id: room._id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create room' });
  }
});

// PUT /api/rooms/:id (admin) - Edit Room
roomsRouter.put('/:id', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<IRoom>;
    const room = await Room.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ ...room.toObject(), id: room._id });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update room' });
  }
});

// DELETE /api/rooms/:id (admin)
roomsRouter.delete('/:id', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// PATCH /api/rooms/:id/status (admin/receptionist)
roomsRouter.patch('/:id/status', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: RoomStatus };
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ ...room.toObject(), id: room._id });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update room status' });
  }
});