import { NextFunction, Request, Response } from 'express';
import admin from '../lib/firebaseAdmin.js';
import { logger } from '../lib/logger.js';
import { User } from '../models/user.js'; 

// 1. Update Interface to include mongoId
export interface AuthUser {
  uid: string;
  email?: string;
  roles: string[];
  mongoId?: string; // ✅ Added this
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization || '';
      
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing bearer token' });
      }

      const token = authHeader.split(' ')[1];

      // 1. Verify Token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // 2. Fetch User from MongoDB
      const dbUser = await User.findOne({ uid: decodedToken.uid }).lean();
      
      const roles = dbUser?.roles || ['customer'];

      // 3. Attach MongoDB _id to the request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        roles: roles,
        mongoId: dbUser?._id?.toString(), // ✅ PASS REAL MONGODB ID
      };

      next();
    } catch (err) {
      logger.error({ err }, 'Authentication failed');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export function requireRoles(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthenticated' });

    if (!allowed.length) return next();

    const hasRole = user.roles.some((r) => allowed.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    return next();
  };
}