import { prisma } from "../config/prisma.config.js";


/* =========================================================
   ADMIN MANAGEMENT
========================================================= */

// CREATE ADMIN
export const createAdmin = async (req, res) => {
  try {
    const { name, gymName, adminId, address, phone, email, username, password, status, planName, planPrice, planDuration, planDescription } = req.body;

    // Generate adminId if not provided
    const generatedAdminId = adminId || `ADM${Date.now().toString().slice(-4)}`;

    // Prepare plans array
    const plans = planName ? [{
      planName,
      price: planPrice,
      duration: planDuration,
      description: planDescription
    }] : [];

    const admin = await prisma.user.create({
      data: {
        name,
        gymName,
        adminId: generatedAdminId,
        address,
        phone,
        email,
        username,
        password,
        status: status || "ACTIVE",
        role: "ADMIN",
        plans: plans.length > 0 ? plans : undefined,
        createdBy: req.user.id,
      },
    });
    res.json({ success: true, message: "Admin created", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LIST ADMINS
export const listAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ADMIN BY ID
export const getAdminById = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ADMIN
export const updateAdmin = async (req, res) => {
  try {
    const { name, adminId, address, phone, email, username, status, planName, planPrice, planDuration, planDescription } = req.body;

    // Prepare plans array
    const plans = planName ? [{
      planName,
      price: planPrice,
      duration: planDuration,
      description: planDescription
    }] : [];

    const admin = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        adminId,
        address,
        phone,
        email,
        username,
        status,
        plans: plans.length > 0 ? plans : undefined,
      },
    });
    res.json({ success: true, message: "Admin updated", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE ADMIN
export const deleteAdmin = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true, message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ADMIN STATUS
export const updateAdminStatus = async (req, res) => {
  try {
    const admin = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status },
    });
    res.json({ success: true, message: "Status updated", admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   PLAN REQUEST MANAGEMENT
========================================================= */

// // LIST ALL REQUESTS
// export const listPlanRequests = async (req, res) => {
//   try {
//     const requests = await prisma.planRequest.findMany({
//       include: { plan: true, user: true },
//     });
//     res.json({ success: true, requests });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // APPROVE REQUEST
// export const approveRequest = async (req, res) => {
//   try {
//     const id = Number(req.params.id);

//     const request = await prisma.planRequest.update({
//       where: { id },
//       data: {
//         status: "APPROVED",
//         approvedBy: req.user.id,
//         approvedAt: new Date(),
//       },
//     });

//     res.json({ success: true, message: "Request approved", request });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // REJECT REQUEST
// export const rejectRequest = async (req, res) => {
//   try {
//     const id = Number(req.params.id);
//     const { reason } = req.body;

//     const request = await prisma.planRequest.update({
//       where: { id },
//       data: {
//         status: "REJECTED",
//         rejectionReason: reason,
//         approvedBy: req.user.id,
//       },
//     });

//     res.json({ success: true, message: "Request rejected", request });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // UPDATE STATUS (GENERIC)
// export const updateRequestStatus = async (req, res) => {
//   try {
//     const request = await prisma.planRequest.update({
//       where: { id: Number(req.params.id) },
//       data: { status: req.body.status },
//     });
//     res.json({ success: true, message: "Status updated", request });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
