import { auth } from './auth';
import { prisma } from './prisma';
import { Role } from './generated/prisma/client';

const { ADMIN_EMAIL, ADMIN_PASSWORD, AGENT_EMAIL, AGENT_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
	process.exit(1);
}

if (!AGENT_EMAIL || !AGENT_PASSWORD) {
	console.error('AGENT_EMAIL and AGENT_PASSWORD must be set');
	process.exit(1);
}

const adminResult = await auth.api.signUpEmail({
	body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin' },
});

if (adminResult.user) {
	await prisma.user.update({
		where: { email: ADMIN_EMAIL },
		data: { role: Role.ADMIN },
	});
	console.log('Admin created:', ADMIN_EMAIL);
} else {
	console.log('Admin may already exist, skipping.');
}

const agentResult = await auth.api.signUpEmail({
	body: { email: AGENT_EMAIL, password: AGENT_PASSWORD, name: 'Agent' },
});

if (agentResult.user) {
	console.log('Agent created:', AGENT_EMAIL);
} else {
	console.log('Agent may already exist, skipping.');
}

await prisma.$disconnect();
