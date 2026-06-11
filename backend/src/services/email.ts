import * as Sentry from '@sentry/node';
import nodemailer from 'nodemailer';

const {
	BREVO_SMTP_HOST = 'smtp-relay.brevo.com',
	BREVO_SMTP_PORT = '587',
	BREVO_SMTP_USER,
	BREVO_SMTP_PASS,
	BREVO_FROM_EMAIL,
} = process.env;

function createTransporter() {
	if (!BREVO_SMTP_USER || !BREVO_SMTP_PASS || !BREVO_FROM_EMAIL) {
		return null;
	}
	return nodemailer.createTransport({
		host: BREVO_SMTP_HOST,
		port: parseInt(BREVO_SMTP_PORT, 10),
		auth: { user: BREVO_SMTP_USER, pass: BREVO_SMTP_PASS },
	});
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
	const transporter = createTransporter();
	if (!transporter) {
		throw new Error('[email] BREVO_SMTP_USER, BREVO_SMTP_PASS, or BREVO_FROM_EMAIL not set — cannot send email');
	}
	await transporter.sendMail({ from: BREVO_FROM_EMAIL, to, subject, text: body });
}
