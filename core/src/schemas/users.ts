import { z } from 'zod';

export const roleEnum = z.enum(['ADMIN', 'AGENT']);

export const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	email: z.string().email('Invalid email'),
	password: z.string().trim().min(8, 'Min 8 characters'),
	role: roleEnum.default('AGENT'),
});

export const updateUserSchema = z.object({
	name: z.string().trim().min(1, 'Name cannot be empty').optional(),
	email: z.string().email('Invalid email').optional(),
	role: roleEnum.optional(),
	isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
