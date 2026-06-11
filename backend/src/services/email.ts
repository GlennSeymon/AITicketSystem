import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
	const {
		BREVO_SMTP_HOST = 'smtp-relay.brevo.com',
		BREVO_SMTP_PORT = '587',
		BREVO_SMTP_USER,
		BREVO_SMTP_PASS,
		BREVO_FROM_EMAIL,
	} = process.env;

	if (!BREVO_SMTP_USER) throw new Error('[email] BREVO_SMTP_USER not set');
	if (!BREVO_SMTP_PASS) throw new Error('[email] BREVO_SMTP_PASS not set');
	if (!BREVO_FROM_EMAIL) throw new Error('[email] BREVO_FROM_EMAIL not set');

	const transporter = nodemailer.createTransport({
		host: BREVO_SMTP_HOST,
		port: parseInt(BREVO_SMTP_PORT, 10),
		auth: { user: BREVO_SMTP_USER, pass: BREVO_SMTP_PASS },
	});
	await transporter.sendMail({ from: BREVO_FROM_EMAIL, to, subject, text: body });
}
