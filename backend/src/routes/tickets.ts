import { Router } from 'express';
import { createTicketSchema, updateTicketSchema, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, type PageSize } from '@repo/core';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';
import {
	MessageDirection,
	TicketCategory,
	TicketStatus,
} from '../generated/prisma/client';

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
			...(status && { status: status as TicketStatus }),
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
			await tx.message.create({
				data: { ticketId: t.id, body, direction: MessageDirection.INBOUND },
			});
			return t;
		});

		res.status(201).json(ticket);
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
					messages: { orderBy: { createdAt: 'asc' } },
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
				},
				select: TICKET_SELECT,
			});

		res.json(ticket);
	}),
);

export default router;
