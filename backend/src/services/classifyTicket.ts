import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ticketCategoryEnum } from '@repo/core';
import { prisma } from '../prisma';
import { Ticket, TicketCategory } from '../generated/prisma/client';

type TicketCategoryValue = z.infer<typeof ticketCategoryEnum>;
type ClassifyTicketInput = Pick<Ticket, 'id' | 'subject' | 'body'>;

const classificationSchema = z.object({
	category: ticketCategoryEnum,
});

const categoryDescriptions: Record<TicketCategoryValue, string> = {
	TECHNICAL: 'issues requiring technical expertise: bugs, error messages, software setup and installation, configuration problems, code questions, tool or environment troubleshooting, video playback failures',
	REFUND: 'refund requests, billing disputes, payment issues, cancellations',
	GENERAL: 'everything else: account management (password changes, profile updates), course content questions, general how-to enquiries, feedback, scheduling',
	UNCATEGORISED: 'unclear or ambiguous content that does not fit any other category',
};

export async function classifyTicket(ticket: ClassifyTicketInput): Promise<void> {
	try {
		const { object } = await generateObject({
			model: openai('gpt-4o-mini'),
			schema: classificationSchema,
			prompt: `Classify this customer support ticket into exactly one category:

${ticketCategoryEnum.options.map(cat => `${cat} — ${categoryDescriptions[cat]}`).join('\n')}

Subject: ${ticket.subject}
Body: ${ticket.body}

Respond with the single best-matching category.`,
		});

		await prisma.ticket.update({
			where: { id: ticket.id },
			data: { category: object.category as TicketCategory },
		});
	} catch (err) {
		console.error(`[ai] Failed to classify ticket ${ticket.id}:`, err);
	}
}
