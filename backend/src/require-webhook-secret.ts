import type { RequestHandler } from 'express';

if (!process.env.WEBHOOK_SECRET) {
	console.warn('WEBHOOK_SECRET is not set — inbound email webhook is unprotected');
}

export const requireWebhookSecret: RequestHandler = (req, res, next) => {
	const secret = process.env.WEBHOOK_SECRET;
	if (!secret) {
		next();
		return;
	}
	const provided = req.headers['x-webhook-secret'] ?? req.query.secret;
	if (provided !== secret) {
		res.status(401).json({ error: 'Invalid or missing webhook secret' });
		return;
	}
	next();
};
