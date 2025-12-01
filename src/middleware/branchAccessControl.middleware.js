import { prisma } from "../config/prisma.config.js";

export const allowBranchAccess = async (req, res, next) => {
  try {
    const user = req.user;

    // Strict, safe branchId extraction
    const rawId =
      req.params?.branchId ??
      req.body?.branchId ??
      req.query?.branchId;

    const branchId = Number(rawId);

    // Validate branchId strictly
    if (!rawId || Number.isNaN(branchId) || branchId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid branchId is required"
      });
    }

    // SUPERADMIN bypass
    if (user.role === "SUPERADMIN") {
      return next();
    }

    // ADMIN OWNERSHIP CHECK
    if (user.role === "ADMIN") {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          adminId: user.id
        }
      });

      if (!branch) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this branch"
        });
      }

      return next();
    }

    // STAFF / MEMBER BRANCH-LOCK
    if (user.role === "STAFF" || user.role === "MEMBER") {
      if (!user.branchId) {
        return res.status(403).json({
          success: false,
          message: "User is not assigned to any branch"
        });
      }

      // Strict match
      if (Number(user.branchId) !== branchId) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access another branch"
        });
      }

      return next();
    }

    // Unsupported roles
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });

  } catch (error) {
    console.error("allowBranchAccess ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
