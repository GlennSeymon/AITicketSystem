import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export default async function globalSetup() {
  const backendDir = path.resolve(__dirname, '../backend');
  const testEnv = parseEnvFile(path.join(backendDir, '.env.test'));
  const env = { ...process.env, ...testEnv };

  console.log('\n[e2e] Running migrations on test database...');
  execSync('bunx prisma migrate deploy', { cwd: backendDir, env, stdio: 'inherit' });

  console.log('[e2e] Seeding test database...');
  execSync('bun src/seed.test.ts', { cwd: backendDir, env, stdio: 'inherit' });
}
