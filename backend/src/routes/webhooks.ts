import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';
import { requireWebhookSecret } from '../require-webhook-secret';
import {
	ReplyDirection,
	SenderType,
	TicketCategory,
	TicketStatus,
} from '../generated/prisma/client';
import { boss, Queues } from '../queue';
import { AI_AGENT_EMAIL } from '../constants';

const router = Router();

const mailboxSchema = z.object({
	Address: z.string().email(),
	Name: z.string(),
});

const brevoInboundSchema = z.object({
	items: z
		.array(
			z.object({
				From: mailboxSchema,
				Subject: z.string().min(1),
				RawTextBody: z.string().optional(),
				ExtractedMarkdownMessage: z.string().optional(),
			}),
		)
		.min(1),
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

router.post(
	'/inbound-email',
	requireWebhookSecret,
	asyncHandler(async (req, res) => {
		const parsed = brevoInboundSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: parsed.error.issues[0].message });
			return;
		}

		const item = parsed.data.items[0];
		const fromEmail = item.From.Address;
		const fromName = item.From.Name || fromEmail;
		const subject = item.Subject;
		const body = item.RawTextBody || item.ExtractedMarkdownMessage || '';
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
				data: {
					ticketId: existing.id,
					body,
					direction: ReplyDirection.INBOUND,
					senderType: SenderType.CUSTOMER,
				},
			});
			res.status(200).json(existing);
			return;
		}

		const aiAgent = await prisma.user.findFirst({
			where: { email: AI_AGENT_EMAIL, isActive: true },
			select: { id: true },
		});

		const ticket = await prisma.$transaction(async (tx) => {
			const t = await tx.ticket.create({
				data: {
					subject: normalizedSubject,
					fromEmail,
					fromName,
					body,
					status: TicketStatus.NEW,
					category: TicketCategory.UNCATEGORISED,
					...(aiAgent && { assignedAgentId: aiAgent.id }),
				},
			});
			await tx.reply.create({
				data: {
					ticketId: t.id,
					body,
					direction: ReplyDirection.INBOUND,
					senderType: SenderType.CUSTOMER,
				},
			});
			return t;
		});

		await Promise.all([
			boss.send(Queues.classifyTicket, ticket),
			boss.send(Queues.autoResolve, ticket),
		]);

		res.status(201).json(ticket);
	}),
);

export default router;
