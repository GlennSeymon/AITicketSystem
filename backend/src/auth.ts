import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { Role } from './generated/prisma/client';

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',');
if (!trustedOrigins?.length && process.env.NODE_ENV === 'production') {
	throw new Error('BETTER_AUTH_TRUSTED_ORIGINS must be set in production');
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	trustedOrigins: trustedOrigins ?? ['http://localhost:3000'],
	emailAndPassword: { enabled: true, disableSignUp: true },
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: Role.AGENT,
				input: false,
			},
			isActive: {
				type: 'boolean',
				required: true,
				defaultValue: true,
				input: false,
			},
		},
	},
});
