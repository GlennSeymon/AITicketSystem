import { z } from 'zod';

export const ticketStatusEnum = z.enum(['OPEN', 'RESOLVED', 'CLOSED']);
export const ticketCategoryEnum = z.enum(['GENERAL', 'TECHNICAL', 'REFUND', 'UNCATEGORISED']);
export const senderTypeEnum = z.enum(['CUSTOMER', 'AGENT']);
export const replyDirectionEnum = z.enum(['INBOUND', 'OUTBOUND']);

export const TicketStatus = ticketStatusEnum.enum;
export const TicketCategory = ticketCategoryEnum.enum;
export const SenderType = senderTypeEnum.enum;
export const ReplyDirection = replyDirectionEnum.enum;

export const createTicketSchema = z.object({
	subject: z.string().trim().min(1, 'Subject is required').max(255, 'Subject must be 255 characters or fewer'),
	fromEmail: z.string().email('Invalid email').max(254, 'Email must be 254 characters or fewer'),
	fromName: z.string().trim().min(1, 'From name is required').max(100, 'From name must be 100 characters or fewer'),
	body: z.string().trim().min(1, 'Body is required').max(2000, 'Body must be 2,000 characters or fewer'),
	category: ticketCategoryEnum.optional(),
});

export const updateTicketSchema = z.object({
	status: ticketStatusEnum.optional(),
	category: ticketCategoryEnum.nullable().optional(),
	assignedAgentId: z.string().nullable().optional(),
});

export const createReplySchema = z.object({
	body: z.string().trim().min(1, 'Reply cannot be empty').max(2000, 'Reply must be 2,000 characters or fewer'),
});

export const polishReplySchema = z.object({
	prompt: z.string().trim().min(1, 'Prompt is required').max(2000, 'Prompt must be 2,000 characters or fewer'),
	customerName: z.string().trim().optional(),
	assigneeName: z.string().trim().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type PolishReplyInput = z.infer<typeof polishReplySchema>;
