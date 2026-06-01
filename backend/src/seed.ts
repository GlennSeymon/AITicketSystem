import { auth } from './auth';
import { prisma } from './prisma';
import { Role } from './generated/prisma/client';

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
	process.exit(1);
}

const result = await auth.api.signUpEmail({
	body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin' },
});

if (result.user) {
	await prisma.user.update({
		where: { email: ADMIN_EMAIL },
		data: { role: Role.ADMIN },
	});
	console.log('Admin created:', ADMIN_EMAIL);
} else {
	console.log('Admin may already exist, skipping.');
}

await prisma.$disconnect();
