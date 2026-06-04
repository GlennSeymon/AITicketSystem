/**
 * Inbound email webhook — API-level tests
 *
 * Endpoint: POST http://localhost:3002/api/webhooks/inbound-email
 *
 * Covers:
 *  1.  Missing secret header and query param → 401
 *  2.  Wrong secret value → 401
 *  3.  Correct secret via x-webhook-secret header → 201
 *  4.  Correct secret via ?secret= query param → 201
 *  5.  Invalid payload — bad email format → 400
 *  6.  Invalid payload — missing required fields → 400
 *  7.  Happy path — valid payload creates ticket with OPEN status and GENERAL category
 *  8.  Thread detection — "Re:" prefix matches existing OPEN ticket → 200, same ticket id
 *  9.  Thread detection — "Fwd:" prefix matches existing OPEN ticket → 200, same ticket id
 * 10.  Different sender, same subject → new ticket (201)
 * 11.  Same sender, CLOSED ticket, same subject → new ticket (201)
 *
 * These tests are pure API calls — no browser. Playwright's `request` fixture
 * is used throughout. The test backend is on port 3002; all URLs are absolute
 * to avoid relying on the Vite proxy.
 */
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKEND = `http://localhost:${process.env.PORT ?? '3002'}`;
const WEBHOOK_URL = `${BACKEND}/api/webhooks/inbound-email`;
const VALID_SECRET = process.env.WEBHOOK_SECRET ?? '';

const AGENT_EMAIL = process.env.AGENT_EMAIL ?? 'agent@e2e.test';
const AGENT_PASSWORD = process.env.AGENT_PASSWORD ?? 'TestAgent123!';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid payload factory — override any field as needed. */
function makePayload(overrides: Record<string, unknown> = {}) {
	return {
		fromEmail: 'customer@example.com',
		fromName: 'Test Customer',
		subject: 'Help with my account',
		body: 'I need help resetting my password.',
		...overrides,
	};
}

/** Sign in as the agent and return a session cookie string for use in headers. */
async function getAgentSessionCookie(
	request: import('@playwright/test').APIRequestContext,
): Promise<string> {
	const response = await request.post(`${BACKEND}/api/auth/sign-in/email`, {
		data: { email: AGENT_EMAIL, password: AGENT_PASSWORD },
	});
	if (!response.ok()) {
		throw new Error(
			`getAgentSessionCookie: sign-in failed — ${response.status()} ${await response.text()}`,
		);
	}
	// Extract the Set-Cookie header(s) so we can forward the session in subsequent requests.
	const headers = response.headers();
	const rawCookie = headers['set-cookie'];
	if (!rawCookie) {
		throw new Error(
			'getAgentSessionCookie: no Set-Cookie header in sign-in response',
		);
	}
	// set-cookie may be a multi-value string separated by newlines (Playwright joins them).
	// We only need the cookie name=value pairs (strip directives like Path, HttpOnly, etc.).
	return rawCookie
		.split('\n')
		.map((c) => c.split(';')[0].trim())
		.filter(Boolean)
		.join('; ');
}

/** POST to the webhook with the valid secret in the header. Returns the API response. */
async function postWebhook(
	request: import('@playwright/test').APIRequestContext,
	payload: Record<string, unknown>,
	secretOverride?: string,
) {
	return request.post(WEBHOOK_URL, {
		headers: {
			'x-webhook-secret':
				secretOverride !== undefined ? secretOverride : VALID_SECRET,
			'Content-Type': 'application/json',
		},
		data: payload,
	});
}

// ---------------------------------------------------------------------------
// 1 & 2 — Authentication (requireWebhookSecret)
// ---------------------------------------------------------------------------

test.describe('Webhook secret authentication', () => {
	test('request with no secret header or query param is rejected with 401', async ({
		request,
	}) => {
		const response = await request.post(WEBHOOK_URL, {
			headers: { 'Content-Type': 'application/json' },
			data: makePayload(),
		});

		expect(response.status()).toBe(401);
		const body = await response.json();
		expect(body.error).toBe('Invalid or missing webhook secret');
	});

	test('request with wrong secret value is rejected with 401', async ({
		request,
	}) => {
		const response = await request.post(WEBHOOK_URL, {
			headers: {
				'x-webhook-secret': 'totally-wrong-secret',
				'Content-Type': 'application/json',
			},
			data: makePayload(),
		});

		expect(response.status()).toBe(401);
		const body = await response.json();
		expect(body.error).toBe('Invalid or missing webhook secret');
	});
});

// ---------------------------------------------------------------------------
// 3 & 4 — Secret delivery channels
// ---------------------------------------------------------------------------

test.describe('Secret delivery channels', () => {
	test('correct secret via x-webhook-secret header creates a ticket (201)', async ({
		request,
	}) => {
		const response = await request.post(WEBHOOK_URL, {
			headers: {
				'x-webhook-secret': VALID_SECRET,
				'Content-Type': 'application/json',
			},
			data: makePayload({ subject: 'Header secret test' }),
		});

		expect(response.status()).toBe(201);
		const ticket = await response.json();
		expect(ticket.id).toBeGreaterThan(0);
		expect(ticket.status).toBe('OPEN');
	});

	test('correct secret via ?secret= query param creates a ticket (201)', async ({
		request,
	}) => {
		const url = `${WEBHOOK_URL}?secret=${encodeURIComponent(VALID_SECRET)}`;
		const response = await request.post(url, {
			headers: { 'Content-Type': 'application/json' },
			data: makePayload({ subject: 'Query param secret test' }),
		});

		expect(response.status()).toBe(201);
		const ticket = await response.json();
		expect(ticket.id).toBeGreaterThan(0);
		expect(ticket.status).toBe('OPEN');
	});
});

// ---------------------------------------------------------------------------
// 5 & 6 — Payload validation
// ---------------------------------------------------------------------------

test.describe('Payload validation', () => {
	test('invalid email format returns 400', async ({ request }) => {
		const response = await postWebhook(
			request,
			makePayload({ fromEmail: 'not-an-email' }),
		);

		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	test('missing fromName returns 400', async ({ request }) => {
		const { fromName: _removed, ...payload } = makePayload() as Record<
			string,
			unknown
		>;
		const response = await postWebhook(request, payload);

		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	test('missing subject returns 400', async ({ request }) => {
		const { subject: _removed, ...payload } = makePayload() as Record<
			string,
			unknown
		>;
		const response = await postWebhook(request, payload);

		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});

	test('empty body field returns 400', async ({ request }) => {
		const response = await postWebhook(request, makePayload({ body: '' }));

		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// 7 — Happy path
// ---------------------------------------------------------------------------

test.describe('Happy path — new ticket creation', () => {
	test('valid payload creates ticket with expected fields', async ({
		request,
	}) => {
		const response = await postWebhook(
			request,
			makePayload({
				fromEmail: 'alice@example.com',
				fromName: 'Alice Smith',
				subject: 'Cannot access my account',
				body: 'I have been locked out since yesterday.',
			}),
		);

		expect(response.status()).toBe(201);

		const ticket = await response.json();
		expect(ticket.id).toBeGreaterThan(0);
		expect(ticket.subject).toBe('Cannot access my account');
		expect(ticket.fromEmail).toBe('alice@example.com');
		expect(ticket.fromName).toBe('Alice Smith');
		expect(ticket.status).toBe('OPEN');
		expect(ticket.category).toBe('GENERAL');
	});
});

// ---------------------------------------------------------------------------
// 8 & 9 — Thread detection (subject normalisation)
// ---------------------------------------------------------------------------

test.describe('Thread detection', () => {
	test('Re: prefix on subject appends to existing OPEN ticket (200)', async ({
		request,
	}) => {
		// Create the original ticket
		const originalSubject = 'Order confirmation missing';
		const fromEmail = 'bob@example.com';

		const createResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Bob Jones',
				subject: originalSubject,
				body: 'I never received my order confirmation.',
			}),
		);
		expect(createResponse.status()).toBe(201);
		const originalTicket = await createResponse.json();

		// Reply with Re: prefix — should match and return the existing ticket
		const replyResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Bob Jones',
				subject: `Re: ${originalSubject}`,
				body: 'Still waiting for the confirmation.',
			}),
		);

		expect(replyResponse.status()).toBe(200);
		const returnedTicket = await replyResponse.json();
		expect(returnedTicket.id).toBe(originalTicket.id);
	});

	test('Fwd: prefix on subject appends to existing OPEN ticket (200)', async ({
		request,
	}) => {
		const originalSubject = 'Refund request for invoice 9012';
		const fromEmail = 'carol@example.com';

		const createResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Carol White',
				subject: originalSubject,
				body: 'Please process my refund.',
			}),
		);
		expect(createResponse.status()).toBe(201);
		const originalTicket = await createResponse.json();

		// Forward with Fwd: prefix — should match and return the existing ticket
		const fwdResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Carol White',
				subject: `Fwd: ${originalSubject}`,
				body: 'Forwarding for your attention.',
			}),
		);

		expect(fwdResponse.status()).toBe(200);
		const returnedTicket = await fwdResponse.json();
		expect(returnedTicket.id).toBe(originalTicket.id);
	});

	test('FW: prefix (Outlook-style) on subject appends to existing OPEN ticket (200)', async ({
		request,
	}) => {
		const originalSubject = 'Missing module access';
		const fromEmail = 'dave@example.com';

		const createResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Dave Brown',
				subject: originalSubject,
				body: 'I cannot access module 3.',
			}),
		);
		expect(createResponse.status()).toBe(201);
		const originalTicket = await createResponse.json();

		const fwResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Dave Brown',
				subject: `FW: ${originalSubject}`,
				body: 'Still no access.',
			}),
		);

		expect(fwResponse.status()).toBe(200);
		const returnedTicket = await fwResponse.json();
		expect(returnedTicket.id).toBe(originalTicket.id);
	});

	test('nested prefixes (Re: Re:) are stripped and still match the open ticket (200)', async ({
		request,
	}) => {
		const originalSubject = 'Password reset not working';
		const fromEmail = 'eve@example.com';

		const createResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Eve Green',
				subject: originalSubject,
				body: 'The reset link does not work.',
			}),
		);
		expect(createResponse.status()).toBe(201);
		const originalTicket = await createResponse.json();

		const deepReplyResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Eve Green',
				subject: `Re: Re: ${originalSubject}`,
				body: 'Still broken.',
			}),
		);

		expect(deepReplyResponse.status()).toBe(200);
		const returnedTicket = await deepReplyResponse.json();
		expect(returnedTicket.id).toBe(originalTicket.id);
	});

	// ── 10 — Different sender, same subject → new ticket ────────────────────

	test('different sender with same subject creates a new ticket (201)', async ({
		request,
	}) => {
		const subject = 'Course video not loading';

		// First ticket from sender A
		const firstResponse = await postWebhook(
			request,
			makePayload({
				fromEmail: 'senderA@example.com',
				fromName: 'Sender A',
				subject,
				body: 'The video stops at 30 seconds.',
			}),
		);
		expect(firstResponse.status()).toBe(201);
		const firstTicket = await firstResponse.json();

		// Same subject but from a different email → must create a new ticket
		const secondResponse = await postWebhook(
			request,
			makePayload({
				fromEmail: 'senderB@example.com',
				fromName: 'Sender B',
				subject,
				body: 'Same issue here.',
			}),
		);

		expect(secondResponse.status()).toBe(201);
		const secondTicket = await secondResponse.json();
		expect(secondTicket.id).not.toBe(firstTicket.id);
	});

	// ── 11 — Same sender, CLOSED ticket, same subject → new ticket ──────────

	test('same sender with same subject but CLOSED ticket creates a new ticket (201)', async ({
		request,
	}) => {
		const fromEmail = 'frank@example.com';
		const subject = 'Billing question about invoice 5678';

		// Step 1: create the original ticket via the webhook
		const createResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Frank Black',
				subject,
				body: 'What is this charge for?',
			}),
		);
		expect(createResponse.status()).toBe(201);
		const originalTicket = await createResponse.json();

		// Step 2: close the ticket via PATCH /api/tickets/:id using an agent session
		const sessionCookie = await getAgentSessionCookie(request);

		const patchResponse = await request.patch(
			`${BACKEND}/api/tickets/${originalTicket.id}`,
			{
				headers: {
					'Content-Type': 'application/json',
					Cookie: sessionCookie,
				},
				data: { status: 'CLOSED' },
			},
		);
		expect(patchResponse.ok()).toBeTruthy();
		const updatedTicket = await patchResponse.json();
		expect(updatedTicket.status).toBe('CLOSED');

		// Step 3: send a new email with the same sender + same subject.
		// The webhook must ignore the CLOSED ticket and create a new one.
		const reopenResponse = await postWebhook(
			request,
			makePayload({
				fromEmail,
				fromName: 'Frank Black',
				subject,
				body: 'I have a follow-up question about this charge.',
			}),
		);

		expect(reopenResponse.status()).toBe(201);
		const newTicket = await reopenResponse.json();
		expect(newTicket.id).not.toBe(originalTicket.id);
		expect(newTicket.status).toBe('OPEN');
	});
});
