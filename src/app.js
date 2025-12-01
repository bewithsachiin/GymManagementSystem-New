import express from "express";
import cors from "cors";

// ====== ROUTES
import authRoutes from "./routes/auth.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import memberRoutes from "./routes/member.routes.js";
import saasPlanRoutes from "./routes/saasPlan.routes.js";
import classRoutes from "./routes/classes.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import personalTrainingRoutes from "./routes/personalTraining.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import roleRoutes from "./routes/role.routes.js";


const app = express();

/* ============================================================
   CORE MIDDLEWARE
============================================================ */
app.use(cors());

// Built-in express parser (no need for body-parser)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* ============================================================
   ROUTING LAYER
============================================================ */

// Public authentication endpoints
app.use("/api/auth", authRoutes);

// Super admin endpoints
app.use("/api/superadmin", superAdminRoutes);

// SaaS plan management (superadmin)
app.use("/api/superadmin/saas-plan", saasPlanRoutes);

// Admin-scoped features: branches, members, classes
app.use("/api/admin/branches", branchRoutes);
app.use("/api/admin/members", memberRoutes);
app.use("/api/admin/classes", classRoutes);
app.use("/api/admin/staff", staffRoutes);
app.use("/api/admin/attendance", attendanceRoutes);
app.use("/api/admin/personal-training", personalTrainingRoutes);
app.use("/api/admin/sessions", sessionRoutes);
app.use("/api/admin/roles", roleRoutes);

/* ============================================================
   GLOBAL HANDLING FOR UNKNOWN ROUTES (Prevents crashes)
============================================================ */
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ============================================================
   GLOBAL ERROR HANDLER (Prevents runtime crashes)
============================================================ */
app.use((err, req, res, next) => {
  console.error("Express global error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
