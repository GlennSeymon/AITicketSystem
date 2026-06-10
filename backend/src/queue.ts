import { PgBoss } from 'pg-boss';
import { classifyTicket } from './services/classifyTicket';
import { autoResolveTicket } from './services/autoResolve';
import { sendEmail } from './services/email';

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });

export const Queues = {
	classifyTicket: 'classify-ticket',
	autoResolve: 'auto-resolve',
	sendEmail: 'send-email',
} as const;

export async function startQueue(): Promise<void> {
	boss.on('error', (err: Error) => console.error('[queue]', err));
	await boss.start();

	await boss.createQueue(Queues.classifyTicket);
	await boss.work<{ id: number; subject: string; body: string }>(
		Queues.classifyTicket,
		async (jobs) => {
			await classifyTicket(jobs[0].data);
		},
	);

	await boss.createQueue(Queues.autoResolve);
	await boss.work<{ id: number; subject: string; body: string; fromName: string; fromEmail: string }>(
		Queues.autoResolve,
		async (jobs) => {
			const result = await autoResolveTicket(jobs[0].data);
			if (result.emailPayload) {
				await boss.send(Queues.sendEmail, result.emailPayload);
			}
		},
	);

	await boss.createQueue(Queues.sendEmail);
	await boss.work<{ to: string; subject: string; body: string }>(
		Queues.sendEmail,
		async (jobs) => {
			const { to, subject, body } = jobs[0].data;
			await sendEmail(to, subject, body);
		},
	);

	console.log('[queue] started');
}
