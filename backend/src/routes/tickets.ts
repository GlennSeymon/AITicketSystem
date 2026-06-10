import { Router } from 'express';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createTicketSchema, updateTicketSchema, createReplySchema, polishReplySchema, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, type PageSize } from '@repo/core';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';
import {
	ReplyDirection,
	SenderType,
	TicketCategory,
	TicketStatus,
} from '../generated/prisma/client';
import { AI_AGENT_EMAIL } from '../constants';
import { boss, Queues } from '../queue';

interface StatsResponse {
	totalTickets: number;
	openTickets: number;
	resolvedByAI: number;
	aiResolutionPercent: number;
	avgResolutionTimeMs: number | null;
}

interface DailyCount {
	date: string;
	count: number;
}

interface StatsRow {
	total_tickets: bigint;
	open_tickets: bigint;
	resolved_by_ai: bigint;
	ai_resolution_pct: string;
	avg_resolution_ms: number | null;
}

const router = Router();

const TICKET_SELECT = {
	id: true,
	subject: true,
	fromEmail: true,
	fromName: true,
	status: true,
	category: true,
	createdAt: true,
	updatedAt: true,
} as const;

const SORTABLE_FIELDS = [
	'subject',
	'fromName',
	'fromEmail',
	'status',
	'category',
	'createdAt',
	'updatedAt',
] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];


router.get(
	'/',
	asyncHandler(async (req, res) => {
		const { status, category, sortField, sortOrder, page, pageSize } =
			req.query;

		const validSort =
			typeof sortField === 'string' &&
			(SORTABLE_FIELDS as readonly string[]).includes(sortField) &&
			(sortOrder === 'asc' || sortOrder === 'desc');

		const orderBy = validSort
			? { [sortField as SortableField]: sortOrder as 'asc' | 'desc' }
			: { createdAt: 'desc' as const };

		const parsedPage = Math.max(0, parseInt(page as string, 10) || 0);
		const parsedPageSize = PAGE_SIZE_OPTIONS.includes(
			parseInt(pageSize as string, 10) as PageSize,
		)
			? parseInt(pageSize as string, 10)
			: DEFAULT_PAGE_SIZE;

		const where = {
			status: status
				? (status as TicketStatus)
				: { notIn: [TicketStatus.NEW, TicketStatus.PROCESSING] },
			...(category && { category: category as TicketCategory }),
		};

		const [total, tickets] = await Promise.all([
			prisma.ticket.count({ where }),
			prisma.ticket.findMany({
				where,
				select: TICKET_SELECT,
				orderBy,
				skip: parsedPage * parsedPageSize,
				take: parsedPageSize,
			}),
		]);

		res.json({ data: tickets, total });
	}),
);

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const parsed = createTicketSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: parsed.error.issues[0].message });
			return;
		}

		const { subject, fromEmail, fromName, body, category } = parsed.data;

		const ticket = await prisma.$transaction(async (tx) => {
			const t = await tx.ticket.create({
				data: {
					subject,
					fromEmail,
					fromName,
					body,
					...(category && { category }),
				},
				select: TICKET_SELECT,
			});
			await tx.reply.create({
				data: { ticketId: t.id, body, direction: ReplyDirection.INBOUND, senderType: SenderType.CUSTOMER },
			});
			return t;
		});

		res.status(201).json(ticket);
	}),
);

router.get(
	'/daily',
	asyncHandler(async (_req, res) => {
		const rows = await prisma.$queryRaw<{ date: string; count: number }[]>`
			SELECT
				TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
				COUNT(*)::int AS count
			FROM "ticket"
			WHERE "createdAt" >= NOW() - INTERVAL '30 days'
			GROUP BY DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC')
			ORDER BY date ASC
		`;

		const countByDate = new Map(rows.map((r) => [r.date, r.count]));

		const result: DailyCount[] = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date();
			d.setUTCHours(0, 0, 0, 0);
			d.setUTCDate(d.getUTCDate() - i);
			const key = d.toISOString().slice(0, 10);
			result.push({ date: key, count: countByDate.get(key) ?? 0 });
		}

		res.json(result);
	}),
);

router.get(
	'/stats',
	asyncHandler(async (_req, res) => {
		const rows = await prisma.$queryRaw<[StatsRow]>`SELECT * FROM get_ticket_stats(${AI_AGENT_EMAIL})`;

		const row = rows[0];
		const response: StatsResponse = {
			totalTickets: Number(row.total_tickets),
			openTickets: Number(row.open_tickets),
			resolvedByAI: Number(row.resolved_by_ai),
			aiResolutionPercent: Number(row.ai_resolution_pct),
			avgResolutionTimeMs: row.avg_resolution_ms !== null ? Number(row.avg_resolution_ms) : null,
		};

		res.json(response);
	}),
);

router.get(
	'/:id',
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid ticket ID' });
			return;
		}

		const ticket = await prisma.ticket.findUnique({
			where: { id },
			include: {
				replies: {
					orderBy: { createdAt: 'asc' },
					include: { author: { select: { id: true, name: true } } },
				},
				assignedAgent: { select: { id: true, name: true, email: true } },
			},
		});

		if (!ticket) {
			res.status(404).json({ error: 'Not found' });
			return;
		}

		res.json(ticket);
	}),
);

router.patch(
	'/:id',
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid ticket ID' });
			return;
		}

		const parsed = updateTicketSchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: parsed.error.issues[0].message });
			return;
		}

		const { status, category, assignedAgentId } = parsed.data;

			if (assignedAgentId) {
				const agent = await prisma.user.findUnique({
					where: { id: assignedAgentId },
					select: { id: true },
				});
				if (!agent) {
					res.status(400).json({ error: 'Agent not found' });
					return;
				}
			}

			const ticket = await prisma.ticket.update({
				where: { id },
				data: {
					...(status !== undefined && { status: status as TicketStatus }),
					...(category !== undefined && { category: category as TicketCategory | null }),
					...(assignedAgentId !== undefined && { assignedAgentId }),
					...((status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) && {
						resolvedAt: new Date(),
					}),
				},
				select: TICKET_SELECT,
			});

		res.json(ticket);
	}),
);

router.post(
	'/:id/replies',
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid ticket ID' });
			return;
		}

		const parsed = createReplySchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: parsed.error.issues[0].message });
			return;
		}

		const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true, fromEmail: true, subject: true } });
		if (!ticket) {
			res.status(404).json({ error: 'Not found' });
			return;
		}

		const reply = await prisma.reply.create({
			data: { ticketId: id, body: parsed.data.body, direction: ReplyDirection.OUTBOUND, senderType: SenderType.AGENT, authorId: req.user.id },
		});

		await boss.send(Queues.sendEmail, { to: ticket.fromEmail, subject: `Re: ${ticket.subject}`, body: parsed.data.body });

		res.status(201).json(reply);
	}),
);

router.post(
	'/:id/summarise',
	asyncHandler(async (req, res) => {
		const id = parseInt(req.params.id, 10);
		if (isNaN(id)) {
			res.status(400).json({ error: 'Invalid ticket ID' });
			return;
		}

		const ticket = await prisma.ticket.findUnique({
			where: { id },
			include: {
				replies: {
					orderBy: { createdAt: 'asc' },
					include: { author: { select: { name: true } } },
				},
			},
		});

		if (!ticket) {
			res.status(404).json({ error: 'Not found' });
			return;
		}

		const lines: string[] = [
			`Subject: ${ticket.subject}`,
			`Customer: ${ticket.fromName} <${ticket.fromEmail}>`,
			'',
		];
		for (const reply of ticket.replies) {
			const sender =
				reply.senderType === SenderType.AGENT
					? (reply.author?.name ?? 'Support Agent')
					: ticket.fromName;
			lines.push(`[${sender}]: ${reply.body}`);
			lines.push('');
		}

		const result = streamText({
			model: openai('gpt-5-nano'),
			system:
				'You are a support ticket assistant. Summarise the following customer support conversation concisely. Include the main issue, key points discussed, any resolutions offered, and the current status. Keep the summary to 3–5 sentences.',
			prompt: lines.join('\n'),
		});

		result.pipeTextStreamToResponse(res);
	}),
);

router.post(
	'/polish-reply',
	asyncHandler(async (req, res) => {
		const parsed = polishReplySchema.safeParse(req.body);
		if (!parsed.success) {
			res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' });
			return;
		}

		const { prompt, customerName, assigneeName } = parsed.data;
		const signerName = assigneeName ?? req.user.name;
		const greeting = customerName ? `Address the customer as "${customerName}" at the start of the reply. ` : '';
		const result = streamText({
			model: openai('gpt-5-nano'),
			system: `You are a professional customer support agent named ${signerName}. Polish the following reply to be clear, empathetic, and professional. ${greeting}End the reply with this exact signature on its own line:\n\n${signerName}\nhttps://ticketsystem.com\n\nReturn only the improved reply text with no explanation or preamble.`,
			prompt,
		});

		result.pipeTextStreamToResponse(res);
	}),
);

export default router;
