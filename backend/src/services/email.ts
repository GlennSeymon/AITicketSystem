export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
	const { BREVO_API_KEY, BREVO_FROM_EMAIL } = process.env;

	if (!BREVO_API_KEY) throw new Error('[email] BREVO_API_KEY not set');
	if (!BREVO_FROM_EMAIL) throw new Error('[email] BREVO_FROM_EMAIL not set');

	const res = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'api-key': BREVO_API_KEY,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			sender: { email: BREVO_FROM_EMAIL },
			to: [{ email: to }],
			subject,
			textContent: body,
		}),
	});

	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`[email] Brevo API error ${res.status}: ${detail}`);
	}
}
