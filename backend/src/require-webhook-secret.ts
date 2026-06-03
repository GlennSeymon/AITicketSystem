import type { RequestHandler } from 'express';

export const requireWebhookSecret: RequestHandler = (req, res, next) => {
	const secret = process.env.WEBHOOK_SECRET;
	if (!secret) {
		next();
		return;
	}
	if (req.headers.authorization !== `Bearer ${secret}`) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}
	next();
};
