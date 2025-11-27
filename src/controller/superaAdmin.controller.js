import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

// SuperAdmin → create Admin
export const createAdmin = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'ADMIN',
        staffRole: 'NONE',
        status: 'ACTIVE',
        createdBy: superAdminId
      }
    });

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (error) {
    console.error('createAdmin error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// list all Admins
export const listAdmins = async (_req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true
      }
    });

    return res.json({ admins });
  } catch (error) {
    console.error('listAdmins error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
