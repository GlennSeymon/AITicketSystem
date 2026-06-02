import express from 'express';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { requireAuth } from './require-auth';

const app = express();
const port = process.env.PORT || 3001;

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: { error: 'Too many login attempts, please try again later' },
	standardHeaders: true,
	legacyHeaders: false,
});

// Better Auth and Postmark webhook must be mounted before express.json()
app.use('/api/auth/sign-in', authLimiter);
app.all('/api/auth/*', toNodeHandler(auth));
// app.post('/api/webhooks/postmark', rawBody, webhookHandler); // mount here when implemented

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

app.listen(port, () => {
	console.log(`Backend running on http://localhost:${port}`);
});
