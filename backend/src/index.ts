import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.listen(port, () => {
	console.log(`Backend running on http://localhost:${port}`);
});
