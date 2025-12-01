import { Router } from "express";
import {
  createRole,
  listRoles,
  getRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  assignRoleToUser,
  unassignRoleFromUser,
  listRoleUsers,
} from "../controller/role.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Role CRUD (admin)
router.post("/", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), createRole);
router.get("/", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), listRoles);
router.get("/:id", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), getRole);
router.put("/:id", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), updateRole);
router.delete("/:id", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), deleteRole);

// Permissions management (admin)
router.get("/permissions", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), listPermissions);
router.post("/permissions", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), createPermission);

// Role assignment to users
router.post("/:id/assign", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), assignRoleToUser);
router.post("/:id/unassign", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), unassignRoleFromUser);
router.get("/:id/users", authenticate, authorizeRoles("SUPERADMIN","ADMIN"), listRoleUsers);

export default router;
