import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
	baseURL: window.location.origin,
	plugins: [
		inferAdditionalFields({
			user: {
				role: { type: 'string' },
				isActive: { type: 'boolean' },
			},
		}),
	],
});
