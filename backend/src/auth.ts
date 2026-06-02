import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
	emailAndPassword: { enabled: true, disableSignUp: true },
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: 'AGENT',
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
