import { Router } from 'express';
import { createUserSchema, updateUserSchema } from '@repo/core';
import { auth } from '../auth';
import { prisma } from '../prisma';
import { Role } from '../generated/prisma/client';
import { asyncHandler } from '../async-handler';

const router = Router();

const USER_SELECT = {
	id: true,
	name: true,
	email: true,
	role: true,
	isActive: true,
	createdAt: true,
} as const;

router.get('/', asyncHandler(async (_req, res) => {
	const users = await prisma.user.findMany({
		select: USER_SELECT,
		orderBy: { createdAt: 'asc' },
	});
	res.json(users);
}));

router.post('/', asyncHandler(async (req, res) => {
	const parsed = createUserSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.issues[0].message });
		return;
	}
	const { name, email, password, role } = parsed.data;

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		res.status(409).json({ error: 'Email already in use' });
		return;
	}

	const ctx = await auth.$context;
	const userId = ctx.generateId({ model: 'user' }) || crypto.randomUUID();
	const accountId = ctx.generateId({ model: 'account' }) || crypto.randomUUID();
	const passwordHash = (await ctx.password.hash(password)) || '';
	const now = new Date();

	await prisma.$transaction([
		prisma.user.create({
			data: {
				id: userId,
				name,
				email,
				emailVerified: false,
				role: role as Role,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			},
		}),
		prisma.account.create({
			data: {
				id: accountId,
				accountId: userId,
				providerId: 'credential',
				userId,
				password: passwordHash,
				createdAt: now,
				updatedAt: now,
			},
		}),
	]);

	const created = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
	res.status(201).json(created);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
	const { id } = req.params;
	const parsed = updateUserSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: parsed.error.issues[0].message });
		return;
	}
	const { name, email, role, isActive } = parsed.data;

	const user = await prisma.user.update({
		where: { id },
		data: {
			...(name !== undefined && { name }),
			...(email !== undefined && { email }),
			...(role !== undefined && { role: role as Role }),
			...(isActive !== undefined && { isActive }),
		},
		select: USER_SELECT,
	});
	res.json(user);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (id === req.user.id) {
		res.status(400).json({ error: 'Cannot delete your own account' });
		return;
	}

	await prisma.user.delete({ where: { id } });
	res.status(204).send();
}));

export default router;
