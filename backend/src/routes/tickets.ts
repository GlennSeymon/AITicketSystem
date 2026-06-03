import { Router } from 'express';
import { createTicketSchema, updateTicketSchema } from '@repo/core';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';
import { MessageDirection, TicketCategory, TicketStatus } from '../generated/prisma/client';

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

router.get('/', asyncHandler(async (req, res) => {
	const { status, category } = req.query;

	const tickets = await prisma.ticket.findMany({
		where: {
			...(status && { status: status as TicketStatus }),
			...(category && { category: category as TicketCategory }),
		},
		select: TICKET_SELECT,
		orderBy: { createdAt: 'desc' },
	});

	res.json(tickets);
}));

router.post('/', asyncHandler(async (req, res) => {
	const parsed = createTicketSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.issues[0].message });
		return;
	}

	const { subject, fromEmail, fromName, body, category } = parsed.data;

	const ticket = await prisma.$transaction(async (tx) => {
		const t = await tx.ticket.create({
			data: { subject, fromEmail, fromName, body, ...(category && { category }) },
			select: TICKET_SELECT,
		});
		await tx.message.create({
			data: { ticketId: t.id, body, direction: MessageDirection.INBOUND },
		});
		return t;
	});

	res.status(201).json(ticket);
}));

router.get('/:id', asyncHandler(async (req, res) => {
	const id = parseInt(req.params.id, 10);
	if (isNaN(id)) {
		res.status(400).json({ error: 'Invalid ticket ID' });
		return;
	}

	const ticket = await prisma.ticket.findUnique({
		where: { id },
		include: { messages: { orderBy: { createdAt: 'asc' } } },
	});

	if (!ticket) {
		res.status(404).json({ error: 'Not found' });
		return;
	}

	res.json(ticket);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
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

	const { status, category } = parsed.data;

	const ticket = await prisma.ticket.update({
		where: { id },
		data: {
			...(status !== undefined && { status: status as TicketStatus }),
			...(category !== undefined && { category: category as TicketCategory }),
		},
		select: TICKET_SELECT,
	});

	res.json(ticket);
}));

export default router;
