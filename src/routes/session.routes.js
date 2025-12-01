import { Router } from "express";
import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession
} from "../controller/session.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Admin only
router.post("/", authenticate, authorizeRoles("ADMIN"), createSession);

router.get("/", authenticate, authorizeRoles("ADMIN"), getSessions);

router.get("/:id", authenticate, authorizeRoles("ADMIN"), getSessionById);

router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateSession);

router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteSession);

export default router;
