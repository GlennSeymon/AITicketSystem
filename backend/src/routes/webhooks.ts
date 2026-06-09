import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';
import { requireWebhookSecret } from '../require-webhook-secret';
import { ReplyDirection, SenderType, TicketCategory, TicketStatus } from '../generated/prisma/client';
import { classifyTicket } from '../services/classifyTicket';

const router = Router();

const inboundEmailSchema = z.object({
	fromEmail: z.string().email(),
	fromName: z.string().min(1),
	subject: z.string().min(1),
	body: z.string().min(1),
});

function normalizeSubject(subject: string): string {
	let s = subject;
	let prev: string;
	do {
		prev = s;
		s = s.replace(/^(re|fwd?|fw):\s*/gi, '').trim();
	} while (s !== prev);
	return s;
}

router.post('/inbound-email', requireWebhookSecret, asyncHandler(async (req, res) => {
	const parsed = inboundEmailSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.issues[0].message });
		return;
	}

	const { fromEmail, fromName, subject, body } = parsed.data;
	const normalizedSubject = normalizeSubject(subject);

	const existing = await prisma.ticket.findFirst({
		where: {
			fromEmail,
			status: TicketStatus.OPEN,
			subject: { equals: normalizedSubject, mode: 'insensitive' },
		},
	});

	if (existing) {
		await prisma.reply.create({
			data: { ticketId: existing.id, body, direction: ReplyDirection.INBOUND, senderType: SenderType.CUSTOMER },
		});
		res.status(200).json(existing);
		return;
	}

	const ticket = await prisma.$transaction(async (tx) => {
		const t = await tx.ticket.create({
			data: {
				subject: normalizedSubject,
				fromEmail,
				fromName,
				body,
				category: TicketCategory.UNCATEGORISED,
			},
		});
		await tx.reply.create({
			data: { ticketId: t.id, body, direction: ReplyDirection.INBOUND, senderType: SenderType.CUSTOMER },
		});
		return t;
	});

	res.status(201).json(ticket);

	classifyTicket(ticket);
}));

export default router;
