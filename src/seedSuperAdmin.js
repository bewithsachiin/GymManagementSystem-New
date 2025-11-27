import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './config/prisma.js';

dotenv.config();

async function seedSuperAdmin() {
  try {
    const email = 'superadmin@gym.com';

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log('SuperAdmin already exists');
      return;
    }

    const hashed = await bcrypt.hash('superpassword', 10);

    const user = await prisma.user.create({
      data: {
        name: 'Main SuperAdmin',
        email,
        password: hashed,
        role: 'SUPERADMIN',
        staffRole: 'NONE',
        status: 'ACTIVE'
      }
    });

    console.log('SuperAdmin created:', user.email);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();
         