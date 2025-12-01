import { prisma } from "../config/prisma.config.js";

/* ============================================================
   1. CREATE CLASS
   ============================================================ */
export const createClass = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { className, trainerName, date, time, scheduleDay, status, branchId } = req.body;

    if (!className || !trainerName || !branchId) {
      return res.status(400).json({ message: "Class name, trainer and branchId are required." });
    }

    // Verify admin owns the branch
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });

    if (!branch) {
      return res.status(403).json({ message: "Not authorized for this branch." });
    }

    const newClass = await prisma.class.create({
      data: {
        className,
        trainerName,
        date: date ? new Date(date) : new Date(),
        time,
        scheduleDay,
        status: status || "ACTIVE",
        adminId,
        branchId
      }
    });

    res.status(201).json({
      message: "Class created successfully",
      class: newClass
    });

  } catch (error) {
    console.error("createClass error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/*/* ============================================================
   2. GET ALL CLASSES
============================================================ */
export const getAllClasses = async (req, res) => {
  try {
    const adminId = req.user.id;

    const classes = await prisma.class.findMany({
      where: { adminId },
      include: {
        members: { select: { id: true, name: true, branchId: true } },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = classes.map(cls => ({
      ...cls,
      totalMembers: cls.members.length,
      branchMemberCount: cls.members.filter(m => m.branchId === cls.branchId).length
    }));

    return res.json({ classes: formatted });

  } catch (error) {
    console.error("getAllClasses error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   3. GET CLASS BY ID
============================================================ */
export const getClassById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const classId = Number(req.params.id);

    const gymClass = await prisma.class.findFirst({
      where: { id: classId, adminId },
      include: {
        members: { select: { id: true, name: true, branchId: true } },
        branch: { select: { id: true, name: true } }
      }
    });

    if (!gymClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    return res.json({
      class: {
        ...gymClass,
        totalMembers: gymClass.members.length,
        branchMemberCount: gymClass.members.filter(m => m.branchId === gymClass.branchId).length
      }
    });

  } catch (error) {
    console.error("getClassById error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   4. UPDATE CLASS
   ============================================================ */
export const updateClass = async (req, res) => {
  try {
    const adminId = req.user.id;
    const classId = Number(req.params.id);

    const existing = await prisma.class.findFirst({
      where: { id: classId, adminId }
    });

    if (!existing) {
      return res.status(404).json({ message: "Class not found or unauthorized" });
    }

    const { className, trainerName, date, time, scheduleDay, status, branchId } = req.body;

    // If branchId is changed validate admin owns new branch
    if (branchId && branchId !== existing.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, adminId }
      });

      if (!branch) {
        return res.status(403).json({ message: "Not authorized for new branch." });
      }
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        className,
        trainerName,
        date: date ? new Date(date) : existing.date,
        time,
        scheduleDay,
        status,
        branchId
      }
    });

    res.json({ message: "Class updated", class: updated });

  } catch (error) {
    console.error("updateClass error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   5. DELETE CLASS
   ============================================================ */
export const deleteClass = async (req, res) => {
  try {
    const adminId = req.user.id;
    const classId = Number(req.params.id);

    const existing = await prisma.class.findFirst({
      where: { id: classId, adminId }
    });

    if (!existing) {
      return res.status(404).json({ message: "Class not found or unauthorized" });
    }

    await prisma.class.delete({
      where: { id: classId }
    });

    res.json({ message: "Class deleted" });

  } catch (error) {
    console.error("deleteClass error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   6. ADD MEMBER TO CLASS
   (Rules: same branch only, avoid duplicates)
   ============================================================ */
export const addMemberToClass = async (req, res) => {
  try {
    const adminId = req.user.id;
    const classId = Number(req.params.id);
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: "memberId is required" });
    }

    // Fetch class
    const gymClass = await prisma.class.findFirst({
      where: { id: classId, adminId },
      include: { branch: true }
    });

    if (!gymClass) {
      return res.status(404).json({ message: "Class not found or unauthorized." });
    }

    // Fetch member
    const member = await prisma.user.findFirst({
      where: { id: memberId, role: "MEMBER", status: "ACTIVE" },
      select: { id: true, branchId: true, name: true }
    });

    if (!member) {
      return res.status(400).json({ message: "Invalid member" });
    }

    // Rule: member must belong to same branch
    if (member.branchId !== gymClass.branchId) {
      return res.status(403).json({
        message: `Member does not belong to this branch.`
      });
    }

    // Check if already exists in class
    const alreadyExists = await prisma.class.findFirst({
      where: { id: classId, members: { some: { id: memberId } } }
    });

    if (alreadyExists) {
      return res.status(400).json({ message: "Member already added in this class." });
    }

    // Add to relation
    await prisma.class.update({
      where: { id: classId },
      data: {
        members: { connect: { id: memberId } }
      }
    });

    res.json({ message: `Member '${member.name}' added successfully.` });

  } catch (error) {
    console.error("addMemberToClass error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   7. REMOVE MEMBER FROM CLASS
   ============================================================ */
export const removeMemberFromClass = async (req, res) => {
  try {
    const adminId = req.user.id;
    const classId = Number(req.params.id);
    const { memberId } = req.body;

    const gymClass = await prisma.class.findFirst({
      where: { id: classId, adminId }
    });

    if (!gymClass) {
      return res.status(404).json({ message: "Class not found or unauthorized." });
    }

    await prisma.class.update({
      where: { id: classId },
      data: {
        members: { disconnect: { id: memberId } }
      }
    });

    res.json({ message: "Member removed from class." });

  } catch (error) {
    console.error("removeMemberFromClass error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
