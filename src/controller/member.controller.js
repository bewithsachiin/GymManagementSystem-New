import { prisma } from "../config/prisma.config.js";

export const createMember = async (req, res) => {
  try {
    const adminId = req.user.id;
    const branchId = Number(req.params.branchId);

    const { name, phone, email, gender, dob, address, membershipPlan, startDate, paymentMode, amountPaid } = req.body;

    // Check duplicate phone for this admin's branch
    const exists = await prisma.user.findFirst({
      where: { phone, branchId }
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists in this branch"
      });
    }

    // Compute expiry date based on membership plan
    const start = new Date(startDate);
    const expiry = new Date(start);
    // Default to 30 days if no specific logic, can be adjusted based on plan
    expiry.setDate(expiry.getDate() + 30);

    const member = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        gender,
        address,
        role: "MEMBER",
        dob: dob ? new Date(dob) : null,
        branchId,
        createdBy: adminId,
        planId: membershipPlan ? parseInt(membershipPlan) : null,
        planStartAt: start,
        planExpireAt: expiry
      }
    });

    // (Optional) Save payment record…

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member
    });

  } catch (error) {
    console.error("createMember error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
/* ============================================================*/

export const listMembers = async (req, res) => {
  try {
    const branchId = Number(req.params.branchId);

    const members = await prisma.user.findMany({
      where: { branchId, role: "MEMBER" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        dob: true,
        address: true,
        planId: true,
        planExpireAt: true
      }
    });

    return res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error("listMembers error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ============================================================*/

export const updateMember = async (req, res) => {
  try {
    const { memberId, branchId } = req.params;
    
    const member = await prisma.user.update({
      where: { id: Number(memberId) },
      data: req.body
    });

    return res.json({
      success: true,
      message: "Member updated successfully",
      data: member
    });

  } catch (error) {
    console.error("updateMember error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ============================================================*/

export const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    await prisma.user.delete({
      where: { id: Number(memberId) }
    });

    return res.json({
      success: true,
      message: "Member deleted successfully"
    });
  } catch (error) {
    console.error("deleteMember error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ============================================================*/

export const renewPlan = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { membershipPlan, durationDays, paymentMode, amountPaid } = req.body;

    // Calculate new expiry date
    const currentDate = new Date();
    const newExpiry = new Date(currentDate);
    newExpiry.setDate(newExpiry.getDate() + (durationDays || 30)); // Default to 30 days

    const updated = await prisma.user.update({
      where: { id: Number(memberId) },
      data: {
        planId: membershipPlan ? parseInt(membershipPlan) : null,
        planStartAt: currentDate,
        planExpireAt: newExpiry
      }
    });

    return res.json({
      success: true,
      message: "Membership renewed successfully",
      data: updated
    });

  } catch (err) {
    console.error("renewPlan error", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
/* ============================================================*/

export const getMemberById = async (req, res) => {
  try {
    const { memberId } = req.params;    
    const member = await prisma.user.findUnique({
        where: { id: Number(memberId) },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
            address: true,
            membershipPlan: true,
            planStart: true,
            expiry: true
        }
    });
    if (!member) {
        return res.status(404).json({
            success: false, 
            message: "Member not found"
        });
    }   
    return res.json({
        success: true,
        data: member
    });
  } catch (error) {
    console.error("getMemberDetails error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  } 
};
