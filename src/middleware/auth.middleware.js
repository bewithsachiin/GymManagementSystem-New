import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Validate secret on startup, not at runtime
if (!JWT_SECRET || JWT_SECRET.trim().length < 10) {
  console.error("FATAL ERROR: JWT_SECRET is missing or too weak");
  process.exit(1);
}

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    // Safe verify wrapper
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Ensure decoded payload is valid
    if (!decoded || typeof decoded !== "object" || !decoded.id || !decoded.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error("authenticate middleware error:", error);
    return res.status(500).json({ message: "Internal authentication error" });
  }
};


export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const role = req.user?.role;

      if (!role) {
        return res.status(403).json({ message: "Forbidden: no role assigned" });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient privileges" });
      }

      next();

    } catch (error) {
      console.error("authorizeRoles middleware error:", error);
      return res.status(500).json({ message: "Internal authorization error" });
    }
  };
};
