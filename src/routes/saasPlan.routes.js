import { Router } from "express";
import {
  createPlan,
  getAllPlans,
  updatePlan,
  deletePlan,
  createPlanRequest,
  listPlanRequests,
  approveRequest,
  rejectRequest,
} from "../controller/saasPlan.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

/* =========================================================
   PUBLIC ROUTES (Website)
========================================================= */
router.get("/plans", getAllPlans);
router.post("/plan-request", createPlanRequest);


/* =========================================================
   SUPERADMIN ROUTES
========================================================= */

router.use(authenticate, authorizeRoles("SUPERADMIN"));

// PLAN CRUD
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// REQUEST MANAGEMENT
router.get("/plan-requests", listPlanRequests);
router.patch("/plan-requests/:id/approve", approveRequest);
router.patch("/plan-requests/:id/reject", rejectRequest);

export default router;
