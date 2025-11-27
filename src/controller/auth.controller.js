import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      staffRole: user.staffRole,
      branchId: user.branchId,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// OPTIONAL: for testing only, not for production
export const debugRegister = async (req, res) => {
  try {
    const { name, email, password, role, staffRole, status } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        staffRole: role === 'STAFF' ? (staffRole || 'NONE') : 'NONE',
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'User created (debug)',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole,
        status: user.status
      }
    });
  } catch (error) {
    console.error('debugRegister error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // status check for all except superadmin
    if (user.role !== 'SUPERADMIN' && user.status !== 'ACTIVE') {
      return res.status(403).json({
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // staff + member must be assigned to a branch
    if ((user.role === 'STAFF' || user.role === 'MEMBER') && !user.branchId) {
      return res.status(403).json({
        message: 'User is not assigned to any branch. Please contact admin.'
      });
    }

    const token = createToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole,
        branchId: user.branchId,
        status: user.status,
        createdBy: user.createdBy
      }
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
