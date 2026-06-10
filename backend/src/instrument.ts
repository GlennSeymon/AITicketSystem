import * as Sentry from '@sentry/node';

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.SENTRY_ENVIRONMENT,
	tracesSampleRate: 1.0,
});
