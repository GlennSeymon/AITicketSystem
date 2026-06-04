import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../async-handler';

const router = Router();

router.get(
	'/',
	asyncHandler(async (_req, res) => {
		const agents = await prisma.user.findMany({
			where: { isActive: true },
			select: { id: true, name: true, email: true },
			orderBy: { name: 'asc' },
		});
		res.json(agents);
	}),
);

export default router;
