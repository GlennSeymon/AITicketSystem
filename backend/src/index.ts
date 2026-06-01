import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { requireAuth } from './require-auth';

const app = express();
const port = process.env.PORT || 3001;

// Better Auth must be mounted before express.json()
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
	res.json({ user: req.user, session: req.session });
});

app.listen(port, () => {
	console.log(`Backend running on http://localhost:${port}`);
});
