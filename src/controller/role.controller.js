import { prisma } from "../config/prisma.config.js";

/* --------------------
   CREATE ROLE
   Body:
   { name, description?, status?, branchId?, permissionKeys?: ["manage_users","reports"] }
---------------------*/
export const createRole = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, description, status = "Active", branchId, permissionKeys = [] } = req.body;

    // if branchId provided, confirm admin owns that branch
    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, adminId } });
      if (!branch) return res.status(403).json({ message: "Not authorized for this branch." });
    }

    // create or find permissions by key
    const permissions = await Promise.all(permissionKeys.map(async (key) => {
      const p = await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, label: key }
      });
      return p;
    }));

    const role = await prisma.role.create({
      data: {
        name,
        description,
        status,
        branchId: branchId || null,
        permissions: {
          create: permissions.map(p => ({ permissionId: p.id }))
        }
      },
      include: { permissions: { include: { permission: true } } }
    });

    return res.status(201).json({ role });
  } catch (err) {
    console.error("createRole", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* --------------------
   LIST ROLES (filter, search, pagination)
   Query params: q, status, branchId, page, limit
---------------------*/
export const listRoles = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { q, status, branchId, page = 1, limit = 25 } = req.query;

    const where = {};

    if (status) where.status = status;
    if (branchId) where.branchId = Number(branchId);

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    // If branchId not passed, admins usually want roles across branches they manage.
    // Optional: restrict by branches admin owns if needed
    // For now, global admin sees all; branch-specific check handled on create/update.

    const total = await prisma.role.count({ where });
    const roles = await prisma.role.findMany({
      where,
      include: { permissions: { include: { permission: true } }, branch: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: Number(limit)
    });

    return res.json({ meta: { total, page: Number(page), limit: Number(limit) }, roles });
  } catch (err) {
    console.error("listRoles", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* --------------------
   GET SINGLE ROLE
---------------------*/
export const getRole = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } }, branch: true }
    });

    if (!role) return res.status(404).json({ message: "Role not found" });

    return res.json({ role });
  } catch (err) {
    console.error("getRole", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   UPDATE ROLE
   Body: { name?, description?, status?, branchId?, permissionKeys?: [] }
---------------------*/
export const updateRole = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);
    const { name, description, status, branchId, permissionKeys } = req.body;

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Role not found" });

    // if branchId provided, verify admin owns branch
    if (branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: branchId, adminId } });
      if (!branch) return res.status(403).json({ message: "Not authorized for this branch." });
    }

    // handle permissions: upsert keys and sync RolePermission
    let permissionConnectOrCreate = undefined;
    if (Array.isArray(permissionKeys)) {
      const perms = await Promise.all(permissionKeys.map(async (key) => {
        return await prisma.permission.upsert({
          where: { key },
          update: {},
          create: { key, label: key }
        });
      }));
      // Prepare new permission set (disconnect all current, connect new)
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      for (const p of perms) {
        await prisma.rolePermission.create({ data: { roleId: id, permissionId: p.id } });
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        status,
        branchId: branchId ?? existing.branchId
      },
      include: { permissions: { include: { permission: true } }, branch: true }
    });

    return res.json({ role: updated });
  } catch (err) {
    console.error("updateRole", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   DELETE ROLE
---------------------*/
export const deleteRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    // optionally check cascade effects: assignments exist?
    const assignments = await prisma.userRoleAssignment.count({ where: { roleId: id } });
    if (assignments > 0) {
      return res.status(400).json({ message: "Role has assigned users. Unassign first." });
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });

    return res.json({ message: "Role deleted" });
  } catch (err) {
    console.error("deleteRole", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   PERMISSIONS LIST + CREATE
---------------------*/
export const listPermissions = async (req, res) => {
  try {
    const perms = await prisma.permission.findMany({ orderBy: { key: "asc" } });
    return res.json({ permissions: perms });
  } catch (err) {
    console.error("listPermissions", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { key, label, description } = req.body;
    if (!key || !label) return res.status(400).json({ message: "key and label required" });
    const p = await prisma.permission.create({ data: { key, label, description } });
    return res.status(201).json({ permission: p });
  } catch (err) {
    console.error("createPermission", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   ASSIGN ROLE TO USER
   Body: { userId }
   — if role.branchId set then user.branchId must match
---------------------*/
export const assignRoleToUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const roleId = Number(req.params.id);
    const { userId } = req.body;

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ message: "Role not found" });

    // If role is scoped to a branch, verify admin owns that branch
    if (role.branchId) {
      const branch = await prisma.branch.findFirst({ where: { id: role.branchId, adminId } });
      if (!branch) return res.status(403).json({ message: "Not authorized for this branch." });
    }

    // fetch user and ensure exists
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // If role.branchId exists ensure user.branchId matches
    if (role.branchId && user.branchId !== role.branchId) {
      return res.status(400).json({ message: "User does not belong to role's branch" });
    }

    // create assignment (idempotent)
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: Number(userId), roleId } },
      update: {},
      create: { userId: Number(userId), roleId }
    });

    return res.json({ message: "Role assigned to user" });
  } catch (err) {
    console.error("assignRoleToUser", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   UNASSIGN ROLE FROM USER
   Body: { userId }
---------------------*/
export const unassignRoleFromUser = async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const { userId } = req.body;

    await prisma.userRoleAssignment.deleteMany({
      where: { roleId, userId: Number(userId) }
    });

    return res.json({ message: "Role unassigned from user" });
  } catch (err) {
    console.error("unassignRoleFromUser", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* --------------------
   LIST USERS ASSIGNED TO A ROLE
   Query: page/limit
---------------------*/
export const listRoleUsers = async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const { page = 1, limit = 25 } = req.query;

    const total = await prisma.userRoleAssignment.count({ where: { roleId } });
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { roleId },
      include: { user: true },
      skip: (page - 1) * limit,
      take: Number(limit)
    });

    return res.json({ meta: { total, page: Number(page), limit: Number(limit) }, assignments });
  } catch (err) {
    console.error("listRoleUsers", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
