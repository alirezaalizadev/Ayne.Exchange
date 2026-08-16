/**
 * Interactive admin creation. Run: `npm run admin:create`.
 * Prompts for email + password, hashes with bcrypt, stores the admin.
 * Passwords are never logged or stored in plaintext.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { stdin, stdout } from 'process';

const prisma = new PrismaClient();

function ask(question: string, { mask = false } = {}): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  return new Promise((resolve) => {
    if (mask) {
      // Best-effort masking for password input.
      const anyRl = rl as unknown as { _writeToOutput?: (s: string) => void };
      anyRl._writeToOutput = (s: string) => {
        if (s.trim().length === 0) stdout.write(s);
        else stdout.write('*');
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

function isStrong(pw: string): boolean {
  return pw.length >= 10 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
}

async function main() {
  console.log('\n=== Create Ayne Exchange admin ===\n');
  const email = (await ask('Email: ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Invalid email.');
    process.exit(1);
  }
  const name = (await ask('Display name: ')) || 'Administrator';
  const password = await ask('Password (min 10 chars, upper/lower/number): ', { mask: true });
  if (!isStrong(password)) {
    console.error('Password too weak. Use at least 10 chars with upper, lower and a number.');
    process.exit(1);
  }
  const confirm = await ask('Confirm password: ', { mask: true });
  if (password !== confirm) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.admin.update({
      where: { email },
      data: { passwordHash, name, isActive: true, sessionsValidFrom: new Date() },
    });
    console.log(`\nUpdated existing admin: ${email}\n`);
  } else {
    const count = await prisma.admin.count();
    await prisma.admin.create({
      data: {
        email,
        name,
        passwordHash,
        role: count === 0 ? 'OWNER' : 'ADMIN',
      },
    });
    console.log(`\nCreated admin: ${email} (${count === 0 ? 'OWNER' : 'ADMIN'})\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
