import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { prisma } from '../prisma';
import { type Ticket, ReplyDirection, SenderType, TicketStatus } from '../generated/prisma/client';

type AutoResolveInput = Pick<Ticket, 'id' | 'subject' | 'body' | 'fromName'>;

const autoResolveSchema = z.object({
	canResolve: z.boolean(),
	escalate: z.boolean(),
	reply: z.string(),
});

const knowledgeBase = readFileSync(resolve(import.meta.dir, '../../knowledge-base.md'), 'utf-8');

export async function autoResolveTicket(ticket: AutoResolveInput): Promise<void> {
	await prisma.ticket.update({
		where: { id: ticket.id },
		data: { status: TicketStatus.PROCESSING },
	});

	let output: z.infer<typeof autoResolveSchema>;
	try {
		({ output } = await generateText({
			model: openai('gpt-4o-mini'),
			output: Output.object({ schema: autoResolveSchema }),
			prompt: `You are a support ticket auto-resolver for an online programming course platform.

KNOWLEDGE BASE:
${knowledgeBase}

SUPPORT TICKET:
Subject: ${ticket.subject}
Customer: ${ticket.fromName}
Message: ${ticket.body}

Determine:
1. canResolve: Can this ticket be fully resolved using only the knowledge base above?
2. escalate: Does this ticket match any escalation rule in section 10 of the knowledge base?
3. reply: If canResolve is true and escalate is false, write a professional reply addressing the customer by name. Otherwise leave this empty.`,
		}));
	} catch (err) {
		console.error(`[ai] Failed to auto-resolve ticket ${ticket.id}:`, err);
		await prisma.ticket.update({
			where: { id: ticket.id },
			data: { status: TicketStatus.OPEN, assignedAgentId: null },
		});
		return;
	}

	if (output.canResolve && !output.escalate && output.reply) {
		await prisma.$transaction(async (tx) => {
			await tx.reply.create({
				data: {
					ticketId: ticket.id,
					body: output.reply,
					direction: ReplyDirection.OUTBOUND,
					senderType: SenderType.AGENT,
				},
			});
			await tx.ticket.update({
				where: { id: ticket.id },
				data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
			});
		});
	} else {
		await prisma.ticket.update({
			where: { id: ticket.id },
			data: { status: TicketStatus.OPEN, assignedAgentId: null },
		});
	}
}
