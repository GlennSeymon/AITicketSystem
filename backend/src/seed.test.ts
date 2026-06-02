import { prisma } from './prisma';
import { auth } from './auth';
import { Role } from './generated/prisma/client';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@e2e.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestAdmin123!';
const AGENT_EMAIL = process.env.AGENT_EMAIL ?? 'agent@e2e.test';
const AGENT_PASSWORD = process.env.AGENT_PASSWORD ?? 'TestAgent123!';

// Clear all auth-related tables in dependency order
await prisma.session.deleteMany();
await prisma.verification.deleteMany();
await prisma.account.deleteMany();
await prisma.user.deleteMany();

const ctx = await auth.$context;
const [adminHash, agentHash] = await Promise.all([
  ctx.password.hash(ADMIN_PASSWORD),
  ctx.password.hash(AGENT_PASSWORD),
]);

const now = new Date();
const adminId = 'e2e-admin-user';
const agentId = 'e2e-agent-user';

// user
await prisma.user.createMany({
  data: [
    {
      id: adminId,
      name: 'Test Admin',
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: Role.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: agentId,
      name: 'Test Agent',
      email: AGENT_EMAIL,
      emailVerified: true,
      role: Role.AGENT,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
});

// account (credential provider — accountId is the user's email)
await prisma.account.createMany({
  data: [
    {
      id: 'e2e-admin-account',
      accountId: ADMIN_EMAIL,
      providerId: 'credential',
      userId: adminId,
      password: adminHash,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'e2e-agent-account',
      accountId: AGENT_EMAIL,
      providerId: 'credential',
      userId: agentId,
      password: agentHash,
      createdAt: now,
      updatedAt: now,
    },
  ],
});

// session (far-future expiry so tests never expire)
const sessionExpiry = new Date('2099-12-31');
await prisma.session.createMany({
  data: [
    {
      id: 'e2e-admin-session',
      token: 'e2e-admin-session-token',
      userId: adminId,
      expiresAt: sessionExpiry,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'e2e-agent-session',
      token: 'e2e-agent-session-token',
      userId: agentId,
      expiresAt: sessionExpiry,
      createdAt: now,
      updatedAt: now,
    },
  ],
});

// verification — empty; no email-verification flow in this app

await prisma.$disconnect();
console.log('[seed.test] Done — admin, agent, accounts, and sessions created');
