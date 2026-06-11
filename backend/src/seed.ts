import { auth } from './auth';
import { prisma } from './prisma';
import { Role } from './generated/prisma/client';
import { AI_AGENT_EMAIL } from './constants';

const { ADMIN_EMAIL, ADMIN_PASSWORD, AGENT_EMAIL, AGENT_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
	process.exit(1);
}

if (!AGENT_EMAIL || !AGENT_PASSWORD) {
	console.error('AGENT_EMAIL and AGENT_PASSWORD must be set');
	process.exit(1);
}

const ctx = await auth.$context;

async function upsertUser(
	email: string,
	password: string,
	name: string,
	role: Role,
): Promise<void> {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log(`${name} already exists, skipping.`);
		return;
	}

	const hashed = await ctx.password.hash(password);
	const now = new Date();
	const id = crypto.randomUUID();

	await prisma.$transaction([
		prisma.user.create({
			data: { id, name, email, emailVerified: true, role, isActive: true, createdAt: now, updatedAt: now },
		}),
		prisma.account.create({
			data: {
				id: crypto.randomUUID(),
				accountId: id,
				providerId: 'credential',
				userId: id,
				password: hashed,
				createdAt: now,
				updatedAt: now,
			},
		}),
	]);

	console.log(`${name} created:`, email);
}

await upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin', Role.ADMIN);
await upsertUser(AGENT_EMAIL, AGENT_PASSWORD, 'Agent', Role.AGENT);

const existingAI = await prisma.user.findUnique({ where: { email: AI_AGENT_EMAIL } });
if (!existingAI) {
	const now = new Date();
	await prisma.user.create({
		data: {
			id: crypto.randomUUID(),
			name: 'AI',
			email: AI_AGENT_EMAIL,
			emailVerified: true,
			role: Role.AGENT,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		},
	});
	console.log('AI agent created:', AI_AGENT_EMAIL);
} else {
	console.log('AI agent already exists, skipping.');
}

await prisma.$disconnect();
