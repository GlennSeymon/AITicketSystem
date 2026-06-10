import { Router } from 'express';
import type { IncomingMessage } from 'http';

const router = Router();

function readRawBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
		req.on('error', reject);
	});
}

router.post('/', async (req, res) => {
	try {
		const envelope = await readRawBody(req);

		if (!envelope) {
			res.status(400).json({ error: 'Empty body' });
			return;
		}

		const header = JSON.parse(envelope.split('\n')[0]) as { dsn?: string };

		if (!header.dsn) {
			// Some envelope types (sessions, client reports) legitimately omit the DSN — silently accept
			res.status(200).end();
			return;
		}

		const dsn = new URL(header.dsn);
		if (!dsn.hostname.endsWith('.sentry.io')) {
			res.status(400).json({ error: 'Invalid DSN host' });
			return;
		}

		const projectId = dsn.pathname.replace('/', '');
		const upstream = `https://${dsn.hostname}/api/${projectId}/envelope/`;

		const response = await fetch(upstream, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-sentry-envelope' },
			body: envelope,
		});

		res.status(response.status).end();
	} catch (err) {
		console.error('[sentry-tunnel] error:', err);
		res.status(200).end();
	}
});

export default router;
