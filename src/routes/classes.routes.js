import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addMemberToClass,
  removeMemberFromClass
} from "../controller/classes.controller.js";

const router = Router();

/* ============================================================
   ALL ROUTES REQUIRE ADMIN ACCESS
   (Authenticate first, then require ADMIN)
============================================================ */
router.use(authenticate, authorizeRoles("ADMIN"));

/* ============================================================
   CLASS QUERIES
============================================================ */

// Get all classes for this admin
router.get("/", getAllClasses);

// Get class by ID
router.get("/:id", getClassById);


/* ============================================================
   CLASS CRUD
============================================================ */

// Create class
router.post("/", createClass);

// Update class
router.patch("/:id", updateClass);

// Delete class
router.delete("/:id", deleteClass);


/* ============================================================
   CLASS MEMBER MANAGEMENT
============================================================ */

// Add member to class
router.post("/:id/members", addMemberToClass);

// Remove member from class
router.delete("/:id/members", removeMemberFromClass);

export default router;
