import { PgBoss } from 'pg-boss';
import { classifyTicket } from './services/classifyTicket';

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });

export const Queues = {
	classifyTicket: 'classify-ticket',
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
	console.log('[queue] started');
}
