import * as Sentry from '@sentry/node';
import express from 'express';
import path from 'path';
import type { ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { boss, startQueue } from './queue';
import { requireAuth } from './require-auth';
import { requireAdmin } from './require-admin';
import usersRouter from './routes/users';
import ticketsRouter from './routes/tickets';
import agentsRouter from './routes/agents';
import webhooksRouter from './routes/webhooks';
import sentryTunnelRouter from './routes/sentry-tunnel';

const app = express();
const port = process.env.PORT || 3001;

// Better Auth must be mounted before express.json()
if (process.env.NODE_ENV === 'production') {
	const authLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 10,
		message: { error: 'Too many login attempts, please try again later' },
		standardHeaders: true,
		legacyHeaders: false,
	});
	app.use('/api/auth/sign-in', authLimiter);
}
app.all('/api/auth/*', toNodeHandler(auth));

// Sentry tunnel must be mounted before express.json() to read the raw body from the stream
app.use('/api/sentry-tunnel', sentryTunnelRouter);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});
app.use('/api/users', requireAuth, requireAdmin, usersRouter);
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api/tickets', requireAuth, ticketsRouter);
app.use('/api/webhooks', webhooksRouter);

if (process.env.NODE_ENV === 'production') {
	const frontendDist = path.resolve(import.meta.dir, '../../frontend/dist');
	app.use(express.static(frontendDist));
	app.get('*', (_req, res) => {
		res.sendFile(path.join(frontendDist, 'index.html'));
	});
}

Sentry.setupExpressErrorHandler(app);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	const code = (err as { code?: string })?.code;
	if (code === 'P2002')
		return void res.status(409).json({ error: 'Email already in use' });
	if (code === 'P2025')
		return void res.status(404).json({ error: 'Not found' });
	res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

async function boot() {
	const server = app.listen(port, () => {
		Sentry.captureMessage(`Backend running on http://localhost:${port}`, 'info');
	});

	await startQueue();

	const shutdown = async () => {
		server.close();
		await boss.stop();
		process.exit(0);
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}

boot().catch(async (err) => {
	Sentry.captureException(err);
	await Sentry.flush(2000);
	console.error('[boot] Failed to start:', err);
	process.exit(1);
});
