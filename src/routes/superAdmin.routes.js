import { Router } from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";
import {
  createPlan,
  listAdmins,
  updateAdminStatus,
  getRequests,
  approveRequest,
  rejectRequest,
  createAdmin,
} from "../controller/superaAdmin.controller.js";


const router = Router();

// all routes require SUPERADMIN
router.use(authenticate, authorizeRoles("SUPERADMIN"));

// SaaS plans
router.post("/plans", createPlan);

// Admin management
router.get("/admins", listAdmins);
router.patch("/admins/status/:id", updateAdminStatus);
router.post("/admins", createAdmin);


// Plan requests
router.get("/requests", getRequests);
router.patch("/requests/approve/:id", approveRequest);
router.patch("/requests/reject/:id", rejectRequest);

export default router;
