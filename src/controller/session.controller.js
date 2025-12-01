import { prisma } from "../config/prisma.config.js";
import { computeSessionStatus } from "../utils/sessionStatus.utlis.js";

/* =====================================================
   1. CREATE SESSION
===================================================== */
export const createSession = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { sessionName, trainer, date, time, duration, description, branchId } = req.body;

    if (!sessionName || !trainer || !date || !time || !description || !branchId)
      return res.status(400).json({ message: "Required fields missing." });

    // Validate admin owns the branch
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });

    if (!branch)
      return res.status(403).json({ message: "Unauthorized branch access." });

    const newSession = await prisma.session.create({
      data: {
        adminId,
        branchId,
        sessionName,
        trainer,
        date: new Date(date),
        time,
        duration: duration || 60,
        description,
        status: "Upcoming"
      }
    });

    res.status(201).json({ message: "Session created", session: newSession });
  } catch (err) {
    console.error("createSession", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   2. GET ALL SESSIONS (Auto-Status Update)
===================================================== */
export const getSessions = async (req, res) => {
  try {
    const adminId = req.user.id;

    let sessions = await prisma.session.findMany({
      where: { adminId },
      include: {
        branch: { select: { id: true, name: true } }
      },
      orderBy: { date: "asc" }
    });

    const updates = [];

    sessions = sessions.map((s) => {
      const autoStatus = computeSessionStatus(s);

      if (autoStatus !== s.status) {
        updates.push(
          prisma.session.update({
            where: { id: s.id },
            data: { status: autoStatus }
          })
        );
        s.status = autoStatus;
      }
      return s;
    });

    if (updates.length > 0) await prisma.$transaction(updates);

    res.json({ sessions });
  } catch (err) {
    console.error("getSessions", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   3. GET SINGLE SESSION
===================================================== */
export const getSessionById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const sessionId = Number(req.params.id);

    let session = await prisma.session.findFirst({
      where: { id: sessionId, adminId },
      include: {
        branch: { select: { id: true, name: true } }
      }
    });

    if (!session)
      return res.status(404).json({ message: "Session not found" });

    const autoStatus = computeSessionStatus(session);

    if (autoStatus !== session.status) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: autoStatus }
      });
      session.status = autoStatus;
    }

    res.json({ session });
  } catch (err) {
    console.error("getSessionById", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   4. UPDATE SESSION
===================================================== */
export const updateSession = async (req, res) => {
  try {
    const adminId = req.user.id;
    const sessionId = Number(req.params.id);

    const old = await prisma.session.findFirst({
      where: { id: sessionId, adminId }
    });

    if (!old)
      return res.status(404).json({ message: "Session not found or unauthorized." });

    const data = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data
    });

    res.json({ message: "Session updated", session: updated });
  } catch (err) {
    console.error("updateSession", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* =====================================================
   5. DELETE SESSION
===================================================== */
export const deleteSession = async (req, res) => {
  try {
    const adminId = req.user.id;
    const sessionId = Number(req.params.id);

    const old = await prisma.session.findFirst({
      where: { id: sessionId, adminId }
    });

    if (!old)
      return res.status(404).json({ message: "Session not found or unauthorized." });

    await prisma.session.delete({ where: { id: sessionId } });

    res.json({ message: "Session deleted" });
  } catch (err) {
    console.error("deleteSession", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
