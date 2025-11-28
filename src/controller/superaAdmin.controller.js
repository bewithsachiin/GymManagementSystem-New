import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.config.js';
import { sendWelcomeAdminEmail } from '../config/email.config.js';

// Helper: Today + Days
const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

//
// SUPERADMIN → CREATE ADMIN (Manual)
//
export const createAdmin = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const { name, email, tempPassword, planId } = req.body;

    if (!name || !email || !tempPassword) {
      return res.status(400).json({ message: 'name, email, tempPassword are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Validate plan if given
    let planExpireAt = null;
    if (planId) {
      const plan = await prisma.saaSPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(400).json({ message: 'Invalid planId' });
      planExpireAt = addDays(plan.durationDays);
    }

    const hashed = await bcrypt.hash(tempPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'ADMIN',
        staffRole: 'NONE',
        status: 'ACTIVE',
        isPasswordChanged: false,
        createdBy: superAdminId,
        planId: planId || null,
        planExpireAt
      }
    });

    // Send welcome email
    await sendWelcomeAdminEmail({
      to: admin.email,
      adminName: admin.name,
      tempPassword
    });

    return res.status(201).json({
      message: 'Admin created & login details sent via email.',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
        planId: admin.planId,
        planExpireAt: admin.planExpireAt
      }
    });

  } catch (error) {
    console.error('createAdmin error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// LIST ALL ADMINS
//
export const listAdmins = async (_req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        planId: true,
        planExpireAt: true,
        createdAt: true
      }
    });

    return res.json({ admins });

  } catch (error) {
    console.error('listAdmins error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// UPDATE ADMIN STATUS (ACTIVE/INACTIVE/BLOCKED)
//
export const updateAdminStatus = async (req, res) => {
  try {
    const adminId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: { status }
    });

    return res.json({
      message: `Admin status updated to ${status}`,
      admin: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        status: updated.status
      }
    });

  } catch (error) {
    console.error('updateAdminStatus error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// SUPERADMIN → CREATE PLAN
//
export const createPlan = async (req, res) => {
  try {
    const { name, description, price, durationDays, features } = req.body;

    if (!name || price == null || !durationDays) {
      return res.status(400).json({ message: 'name, price, durationDays are required' });
    }

    const plan = await prisma.saaSPlan.create({
      data: {
        name,
        description,
        price,
        durationDays,
        features: features || []
      }
    });

    return res.status(201).json({ message: 'Plan created successfully', plan });

  } catch (error) {
    console.error('createPlan error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// LIST SAAS PLANS
//
export const listPlans = async (_req, res) => {
  try {
    const plans = await prisma.saaSPlan.findMany({ orderBy: { price: 'asc' } });
    return res.json({ plans });

  } catch (error) {
    console.error('listPlans error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// LIST ALL PLAN REQUESTS (Optional ?status=PENDING)
//
export const getRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const where = status ? { status } : {};

    const requests = await prisma.planRequest.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ requests });

  } catch (error) {
    console.error('getRequests error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// APPROVE REQUEST → CREATE ADMIN + SEND EMAIL
//
export const approveRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { tempPassword } = req.body;

    if (!tempPassword) return res.status(400).json({ message: 'tempPassword required' });

    const request = await prisma.planRequest.findUnique({
      where: { id: requestId },
      include: { plan: true }
    });

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request not in PENDING state' });

    const existing = await prisma.user.findUnique({ where: { email: request.ownerEmail } });
    if (existing) return res.status(400).json({ message: 'User with this email already exists' });

    const hashed = await bcrypt.hash(tempPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: request.ownerName,
        email: request.ownerEmail,
        password: hashed,
        role: 'ADMIN',
        staffRole: 'NONE',
        status: 'ACTIVE',
        isPasswordChanged: false,
        planId: request.planId,
        planExpireAt: addDays(request.plan.durationDays),
        createdBy: req.user.id
      }
    });

    await prisma.planRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    });

    // Send email
    await sendWelcomeAdminEmail({
      to: admin.email,
      adminName: admin.name,
      tempPassword
    });

    return res.json({
      message: 'Request approved, admin created & email sent',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
        planId: admin.planId,
        planExpireAt: admin.planExpireAt
      }
    });

  } catch (error) {
    console.error('approveRequest error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// REJECT PLAN REQUEST
//
export const rejectRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);

    const request = await prisma.planRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request not in PENDING state' });

    await prisma.planRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    return res.json({ message: 'Request rejected successfully' });

  } catch (error) {
    console.error('rejectRequest error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//
// ADMIN STATS (Branches + Staff + Members Count)
//
export const getAdminStats = async (_req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true, status: true, planId: true }
    });

    const stats = [];

    for (const admin of admins) {
      const branchesCount = await prisma.branch.count({ where: { adminId: admin.id } });
      const staffCount = await prisma.user.count({ where: { role: 'STAFF', branch: { adminId: admin.id } } });
      const memberCount = await prisma.user.count({ where: { role: 'MEMBER', branch: { adminId: admin.id } } });

      stats.push({
        adminId: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
        planId: admin.planId,
        branchesCount,
        staffCount,
        memberCount
      });
    }

    return res.json({ stats });

  } catch (error) {
    console.error('getAdminStats error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
