import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

// helper: check branch belongs to logged admin
const checkBranchOwnership = async (adminId, branchId) => {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, adminId }
  });
  return !!branch;
};

// Admin creates Staff in a branch
export const createStaff = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email, password, branchId, staffRole } = req.body;

    if (!name || !email || !password || !branchId || !staffRole) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ownsBranch = await checkBranchOwnership(adminId, branchId);
    if (!ownsBranch) {
      return res.status(403).json({ message: 'You do not own this branch' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'STAFF',
        staffRole,
        status: 'ACTIVE',
        createdBy: adminId,
        branchId
      }
    });

    return res.status(201).json({
      message: 'Staff created successfully',
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        staffRole: staff.staffRole,
        branchId: staff.branchId
      }
    });
  } catch (error) {
    console.error('createStaff error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin creates Member in a branch
export const createMember = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email, password, branchId } = req.body;

    if (!name || !email || !password || !branchId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ownsBranch = await checkBranchOwnership(adminId, branchId);
    if (!ownsBranch) {
      return res.status(403).json({ message: 'You do not own this branch' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const member = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'MEMBER',
        staffRole: 'NONE',
        status: 'ACTIVE',
        createdBy: adminId,
        branchId
      }
    });

    return res.status(201).json({
      message: 'Member created successfully',
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        branchId: member.branchId
      }
    });
  } catch (error) {
    console.error('createMember error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// list all staff of admin (across branches)
export const listStaff = async (req, res) => {
  try {
    const adminId = req.user.id;

    const staff = await prisma.user.findMany({
      where: {
        role: 'STAFF',
        createdBy: adminId
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffRole: true,
        status: true,
        branchId: true
      }
    });

    return res.json({ staff });
  } catch (error) {
    console.error('listStaff error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// list all members of admin (across branches)
export const listMembers = async (req, res) => {
  try {
    const adminId = req.user.id;

    const members = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
        createdBy: adminId
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        branchId: true
      }
    });

    return res.json({ members });
  } catch (error) {
    console.error('listMembers error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
