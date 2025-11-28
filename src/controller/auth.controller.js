import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.config.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// JWT Token
const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      staffRole: user.staffRole,
      status: user.status,
      planId: user.planId // only for admin
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 🔐 LOGIN (Role-Based Payload Response)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // ❗ OLD RULE: Only SUPERADMIN bypasses status
    if (user.role !== 'SUPERADMIN' && user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is not active. Please contact administrator.' });
    }

    // ❗ OLD RULE: Staff/Member must have branch assigned
    if ((user.role === 'STAFF' || user.role === 'MEMBER') && !user.branchId) {
      return res.status(403).json({ message: 'User is not assigned to any branch. Please contact admin.' });
    }

    const token = createToken(user);

    // 🎯 ROLE BASED PAYLOAD
    let userPayload;

    switch (user.role) {
      case 'SUPERADMIN':
        userPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isPasswordChanged: user.isPasswordChanged
        };
        break;

      case 'ADMIN':
        userPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          planId: user.planId,
          planExpireAt: user.planExpireAt,
          isPasswordChanged: user.isPasswordChanged
        };
        break;

      case 'STAFF':
        userPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          staffRole: user.staffRole,
          branchId: user.branchId,
          status: user.status,
          isPasswordChanged: user.isPasswordChanged
        };
        break;

      case 'MEMBER':
        userPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          status: user.status,
          isPasswordChanged: user.isPasswordChanged
        };
        break;
    }

    return res.json({
      message: 'Login successful',
      mustChangePassword: !user.isPasswordChanged,
      token,
      user: userPayload
    });

  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Required fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Compare previous password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password & mark as changed
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        isPasswordChanged: true
      }
    });

    // Prepare role-based payload (same as login)
    let userPayload;

    switch (updatedUser.role) {
      case 'SUPERADMIN':
        userPayload = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isPasswordChanged: updatedUser.isPasswordChanged
        };
        break;

      case 'ADMIN':
        userPayload = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          planId: updatedUser.planId,
          planExpireAt: updatedUser.planExpireAt,
          isPasswordChanged: updatedUser.isPasswordChanged
        };
        break;

      case 'STAFF':
        userPayload = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          staffRole: updatedUser.staffRole,
          branchId: updatedUser.branchId,
          status: updatedUser.status,
          isPasswordChanged: updatedUser.isPasswordChanged
        };
        break;

      case 'MEMBER':
        userPayload = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          branchId: updatedUser.branchId,
          status: updatedUser.status,
          isPasswordChanged: updatedUser.isPasswordChanged
        };
        break;
    }

    return res.json({
      message: 'Password changed successfully',
      user: userPayload
    });

  } catch (error) {
    console.error('changePassword error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
