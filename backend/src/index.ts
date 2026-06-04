import express from 'express';
import type { ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { requireAuth } from './require-auth';
import { requireAdmin } from './require-admin';
import usersRouter from './routes/users';
import ticketsRouter from './routes/tickets';
import agentsRouter from './routes/agents';
import webhooksRouter from './routes/webhooks';

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

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	const code = (err as { code?: string })?.code;
	if (code === 'P2002') return void res.status(409).json({ error: 'Email already in use' });
	if (code === 'P2025') return void res.status(404).json({ error: 'Not found' });
	console.error(err);
	res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

app.listen(port, () => {
	console.log(`Backend running on http://localhost:${port}`);
});
