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
	subject: z.string().trim().min(1, 'Subject is required'),
	fromEmail: z.string().email('Invalid email'),
	fromName: z.string().trim().min(1, 'From name is required'),
	body: z.string().trim().min(1, 'Body is required'),
	category: ticketCategoryEnum.optional(),
});

export const updateTicketSchema = z.object({
	status: ticketStatusEnum.optional(),
	category: ticketCategoryEnum.nullable().optional(),
	assignedAgentId: z.string().nullable().optional(),
});

export const createReplySchema = z.object({
	body: z.string().trim().min(1, 'Reply cannot be empty'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
