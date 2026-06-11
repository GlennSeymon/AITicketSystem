import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { Role } from './generated/prisma/client';

const railwayOrigin = process.env.RAILWAY_PUBLIC_DOMAIN
	? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
	: null;

const trustedOrigins =
	process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ??
	(railwayOrigin ? [railwayOrigin] : null);

if (!trustedOrigins?.length && process.env.NODE_ENV === 'production') {
	throw new Error(
		'Either BETTER_AUTH_TRUSTED_ORIGINS or RAILWAY_PUBLIC_DOMAIN must be set in production',
	);
}

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL ?? railwayOrigin ?? undefined,
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
