import { prisma } from "../config/prisma.config.js";

/* =========================================================
   SUPERADMIN: MEMBERSHIP PLAN CRUD
========================================================= */

// CREATE PLAN
export const createPlan = async (req, res) => {
  try {
    const { planName, basePrice, billingCycle, status, descriptions } = req.body;

    const plan = await prisma.membershipPlan.create({
      data: {
        planName,
        basePrice: Number(basePrice),
        billingCycle,
        status,
        descriptions
      }
    });

    res.json({ success: true, message: "Plan created", plan });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET ALL ACTIVE PLANS (public + admin)
export const getAllPlans = async (req, res) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { status: "Active" },
      orderBy: { id: "desc" }
    });

    res.json({ success: true, plans });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE PLAN
export const updatePlan = async (req, res) => {
  try {
    const plan = await prisma.membershipPlan.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });

    res.json({ success: true, message: "Plan updated", plan });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE PLAN
export const deletePlan = async (req, res) => {
  try {
    await prisma.membershipPlan.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ success: true, message: "Plan deleted" });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* =========================================================
   WEBSITE: VISITOR CREATES PLAN REQUEST
========================================================= */

export const createPlanRequest = async (req, res) => {
  try {
    const { visitorName, email, phone, gymName, address, planId } = req.body;

    if (!visitorName || !email || !planId) {
      return res.status(400).json({
        success: false,
        message: "visitorName, email, planId are required"
      });
    }

    // Validate plan exists and active
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: Number(planId) }
    });

    if (!plan || plan.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Plan not available"
      });
    }

    const request = await prisma.planRequest.create({
      data: {
        visitorName,
        email,
        phone,
        gymName,
        address,
        planId: Number(planId)
      }
    });

    res.json({ success: true, message: "Request submitted", request });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* =========================================================
   SUPERADMIN: MANAGE REQUESTS
========================================================= */

// LIST ALL REQUESTS
export const listPlanRequests = async (req, res) => {
  try {
    const requests = await prisma.planRequest.findMany({
      orderBy: { id: "desc" },
      include: {
        plan: true,
        approvedByUser: true
      }
    });

    res.json({ success: true, requests });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// APPROVE REQUEST
export const approveRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.planRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: "Request approved",
      updated
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// REJECT REQUEST
export const rejectRequest = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;

    const updated = await prisma.planRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "No reason provided",
        approvedBy: req.user.id
      }
    });

    res.json({
      success: true,
      message: "Request rejected",
      updated
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
