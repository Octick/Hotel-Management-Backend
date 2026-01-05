import { Router, Request, Response } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { TripPackage } from '../models/tripPackage.js';
import { TripRequest } from '../models/tripRequest.js';

export const tripsRouter = Router();
tripsRouter.use(authenticate());

// GET /trips (public & private)
tripsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const trips = await TripPackage.find({ isPublic: true }).lean();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

tripsRouter.post('/', requireRoles('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const created = await TripPackage.create(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create trip package' });
  }
});

// POST /trips/:id/attach (receptionist) — placeholder hook
tripsRouter.post('/:id/attach', requireRoles('receptionist'), async (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// POST /trip-requests (customer)
tripsRouter.post('/requests', requireRoles('customer'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const created = await TripRequest.create({ requestedBy: user.sub as any, details: req.body.details });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create trip request' });
  }
});


