import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import {
 
  // Admin Management
  createAdmin,
  listAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  updateAdminStatus,

  // // Plan Requests
  // listPlanRequests,
  // approveRequest,
  // rejectRequest,
  // updateRequestStatus,
} from "../controller/superaAdmin.controller.js";

const router = Router();




/* ================= PROTECTED ROUTES ================= */
router.use(authenticate, authorizeRoles("SUPERADMIN"));


/* ====== ADMIN MANAGEMENT CRUD ====== */
router.post("/admins", createAdmin);
router.get("/admins", listAdmins);
router.get("/admins/:id", getAdminById);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);
router.patch("/admins/:id/status", updateAdminStatus);

// /* ====== PLAN REQUEST MANAGEMENT ====== */
// router.get("/requests", listPlanRequests);
// router.patch("/requests/:id/approve", approveRequest);
// router.patch("/requests/:id/reject", rejectRequest);
// router.patch("/requests/:id/status", updateRequestStatus);

export default router;
