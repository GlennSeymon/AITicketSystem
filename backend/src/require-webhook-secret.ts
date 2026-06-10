import * as Sentry from '@sentry/node';
import type { RequestHandler } from 'express';

if (!process.env.WEBHOOK_SECRET) {
	Sentry.captureMessage('WEBHOOK_SECRET is not set — inbound email webhook is unprotected', 'warning');
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
