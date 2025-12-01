import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.config.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET || JWT_SECRET.length < 10) {
  console.error("FATAL ERROR: JWT_SECRET is missing or too weak");
  process.exit(1);
}

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      branchId: user.branchId || null,
      staffRole: user.staffRole || null,
      status: user.status,
      planId: user.planId || null
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/* ============================================================
   LOGIN
============================================================ */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Account password not set. Contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Role-based account validation
    if (user.role !== "SUPERADMIN" && user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Account inactive. Please contact administrator."
      });
    }

    if ((user.role === "STAFF" || user.role === "MEMBER") && !user.branchId) {
      return res.status(403).json({
        message: "User not assigned to any branch. Contact admin."
      });
    }

    const token = createToken(user);

    const userPayload = buildUserPayload(user);

    return res.json({
      message: "Login successful",
      mustChangePassword: !user.isPasswordChanged,
      token,
      user: userPayload
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   CHANGE PASSWORD
============================================================ */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      return res.status(400).json({
        message: "Unable to change password. User not found."
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        isPasswordChanged: true
      }
    });

    return res.json({
      message: "Password changed successfully",
      user: buildUserPayload(updatedUser)
    });

  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   ROLE-BASED USER PAYLOAD BUILDER
============================================================ */
function buildUserPayload(user) {
  switch (user.role) {
    case "SUPERADMIN":
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPasswordChanged: user.isPasswordChanged
      };

    case "ADMIN":
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        planId: user.planId,
        planExpireAt: user.planExpireAt,
        isPasswordChanged: user.isPasswordChanged
      };

    case "STAFF":
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRole: user.staffRole,
        branchId: user.branchId,
        status: user.status,
        isPasswordChanged: user.isPasswordChanged
      };

    case "MEMBER":
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        status: user.status,
        isPasswordChanged: user.isPasswordChanged
      };

    default:
      return { id: user.id, role: user.role };
  }
}
