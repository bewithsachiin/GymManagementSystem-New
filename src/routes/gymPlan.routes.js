import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { allowBranchAccess } from "../middleware/branchAccessControl.middleware.js";

import {
  createGymPlan,
  listGymPlans,
  updateGymPlan,
  deleteGymPlan,
  toggleGymPlanStatus,
  getSinglePlan
} from "../controller/gymPlan.controller.js";

import {
  listBookingRequests,
  processBookingRequest,
  toggleBookingStatus
} from "../controller/bookingRequest.controller.js";

const router = Router();

// Admin only
router.use(authenticate, authorizeRoles("ADMIN"));

// Gym Plans
router.post("/:branchId/plans", allowBranchAccess, createGymPlan);
router.get("/:branchId/plans", allowBranchAccess, listGymPlans);
router.get("/:branchId/plans/:planId", allowBranchAccess, getSinglePlan);
router.put("/:branchId/plans/:planId", allowBranchAccess, updateGymPlan);
router.delete("/:branchId/plans/:planId", allowBranchAccess, deleteGymPlan);
router.patch("/:branchId/plans/:planId/status", allowBranchAccess, toggleGymPlanStatus);

// Booking Requests
router.get("/:branchId/requests", allowBranchAccess, listBookingRequests);
router.patch("/:branchId/requests/:requestId/process", allowBranchAccess, processBookingRequest);
router.patch("/:branchId/requests/:requestId/toggle", allowBranchAccess, toggleBookingStatus);

export default router;
