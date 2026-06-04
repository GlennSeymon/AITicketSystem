import type { RequestHandler } from 'express';
import { Role } from './generated/prisma/client';

export const requireAdmin: RequestHandler = (req, res, next) => {
	if (req.user?.role !== Role.ADMIN) {
		res.status(403).json({ error: 'Forbidden' });
		return;
	}
	next();
};
