import { prisma } from "../config/prisma.config.js";

/* ============================================================
   CREATE BRANCH (ADMIN)
============================================================ */
export const createBranch = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, address, phone, email, logo, gymTimings, themeColor, website, description } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, address, and phone are required"
      });
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        email: email || null,
        logo: logo || null,
        gymTimings: gymTimings || "6AM - 10PM",
        themeColor: themeColor || "#6EB2CC",
        website: website || null,
        description: description || null,
        adminId
      }
    });

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch
    });
  } catch (error) {
    console.error("createBranch error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* ============================================================
   LIST ADMIN'S BRANCHES WITH STAFF & MEMBER SEPARATION
============================================================ */
export const listMyBranches = async (req, res) => {
  try {
    const adminId = req.user.id;

    const branches = await prisma.branch.findMany({
      where: { adminId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            staffRole: true,
            status: true
          }
        }
      }
    });

    // Separate staff & members + clean response
    const formatted = branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      logo: branch.logo,
      gymTimings: branch.gymTimings,
      themeColor: branch.themeColor,
      website: branch.website,
      description: branch.description,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,

      staff: branch.users.filter(u => u.role === "STAFF"),
      members: branch.users.filter(u => u.role === "MEMBER")
    }));

    return res.json({
      success: true,
      message: "Branches retrieved successfully",
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error("listMyBranches error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* ============================================================
   GET BRANCH BY ID (ADMIN)
============================================================ */

export const getBranchById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const branchId = Number(req.params.id); 
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }
    return res.json({
      success: true,
      message: "Branch retrieved successfully",
      data: branch
    });
  } catch (error) {
    console.error("getBranchById error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } 
};

/* ============================================================

    UPDATE BRANCH (ADMIN) 
============================================================ */

export const updateBranch = async (req, res) => {
  try {
    const adminId = req.user.id;
    const branchId = Number(req.params.id);
    const existingBranch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });
    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"

      });
    }
    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: req.body
    });
    return res.json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch
    });
  } catch (error) {
    console.error("updateBranch error", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
};

/* ============================================================
    DELETE BRANCH (ADMIN) 
============================================================ */
export const deleteBranch = async (req, res) => {
  try {
    const adminId = req.user.id;
    const branchId = Number(req.params.id);
    const existingBranch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });
    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found"
      });
    }
    await prisma.branch.delete({
      where: { id: branchId }
    });
    return res.json({
      success: true,
      message: "Branch deleted successfully"
    });
  } catch (error) {
    console.error("deleteBranch error", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error"
    });
  }
};