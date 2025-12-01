// controllers/attendance.controller.js
import { prisma } from "../config/prisma.config.js";
import { computeAttendanceStatus, parseTimeOnDate } from "../utils/attendance.utils.js";
import { parseISO, startOfDay } from "date-fns";

/**
 * NOTE: all endpoints expect req.user to exist and contain { id, role }.
 * Admin endpoints should check req.user.role === 'ADMIN' or 'SUPERADMIN' accordingly.
 */

/* ------------------- SHIFTS ------------------- */

// Create a new shift (admin creates per branch)
export const createShift = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { key, name, startTime, endTime, graceMins = 15, branchId } = req.body;

    if (!key || !name || !startTime || !endTime || !branchId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Ensure admin manages that branch
    const branch = await prisma.branch.findUnique({ where: { id: Number(branchId) } });
    if (!branch || branch.adminId !== adminId) {
      return res.status(403).json({ success: false, message: "Not authorized for this branch" });
    }

    const shift = await prisma.shift.create({
      data: { key, name, startTime, endTime, graceMins: Number(graceMins), adminId, branchId: Number(branchId) }
    });

    res.status(201).json({ success: true, shift });
  } catch (err) {
    console.error("createShift:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const listShifts = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { branchId } = req.query;

    const where = { adminId };
    if (branchId) where.branchId = Number(branchId);

    const shifts = await prisma.shift.findMany({ where, orderBy: { startTime: "asc" } });
    res.json({ success: true, shifts });
  } catch (err) {
    console.error("listShifts:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------- ATTENDANCE ------------------- */

// Add attendance record (admin records or system)
export const addAttendance = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      staffId,
      branchId,
      shiftId,     // optional
      date,        // "YYYY-MM-DD"
      checkinAt,   // ISO string
      checkoutAt,
      mode = "Manual",
      notes
    } = req.body;

    if (!staffId || !branchId || !date) {
      return res.status(400).json({ success: false, message: "staffId, branchId and date required" });
    }

    // confirm admin rights on branch
    const branch = await prisma.branch.findUnique({ where: { id: Number(branchId) } });
    if (!branch || branch.adminId !== adminId) {
      return res.status(403).json({ success: false, message: "Not authorized for this branch" });
    }

    // confirm staff exists and belongs to the same branch
    const staff = await prisma.user.findUnique({ where: { id: Number(staffId) } });
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    if (staff.branchId !== Number(branchId)) {
      return res.status(400).json({ success: false, message: "Staff is not linked to this branch" });
    }

    // load shift if provided
    const shift = shiftId ? await prisma.shift.findUnique({ where: { id: Number(shiftId) } }) : null;

    const checkinDate = checkinAt ? new Date(checkinAt) : null;
    const checkoutDate = checkoutAt ? new Date(checkoutAt) : null;

    const statusObj = computeAttendanceStatus({
      shift: shift ? { startTime: shift.startTime, endTime: shift.endTime, graceMins: shift.graceMins } : null,
      dateStr: date,
      checkinAt: checkinDate,
      checkoutAt: checkoutDate
    });

    const record = await prisma.staffAttendance.create({
      data: {
        staffId: Number(staffId),
        branchId: Number(branchId),
        shiftId: shift ? Number(shiftId) : undefined,
        date: new Date(date + "T00:00:00"),
        checkinAt: checkinDate,
        checkoutAt: checkoutDate,
        mode,
        status: statusObj.status,
        notes,
        createdBy: adminId
      }
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    console.error("addAttendance:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update attendance (admin)
export const updateAttendance = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);
    const { checkinAt, checkoutAt, mode, notes, shiftId } = req.body;

    const existing = await prisma.staffAttendance.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Attendance record not found" });

    // verify admin rights on branch
    const branch = await prisma.branch.findUnique({ where: { id: existing.branchId } });
    if (!branch || branch.adminId !== adminId) return res.status(403).json({ success: false, message: "Not authorized" });

    const shift = shiftId ? await prisma.shift.findUnique({ where: { id: Number(shiftId) } }) : null;

    const checkinDate = checkinAt ? new Date(checkinAt) : existing.checkinAt;
    const checkoutDate = checkoutAt ? new Date(checkoutAt) : existing.checkoutAt;
    const dateStr = existing.date.toISOString().split("T")[0];

    const statusObj = computeAttendanceStatus({
      shift: shift ? { startTime: shift.startTime, endTime: shift.endTime, graceMins: shift.graceMins } : null,
      dateStr,
      checkinAt: checkinDate,
      checkoutAt: checkoutDate
    });

    const updated = await prisma.staffAttendance.update({
      where: { id },
      data: {
        checkinAt: checkinDate,
        checkoutAt: checkoutDate,
        mode,
        notes,
        shiftId: shift ? Number(shiftId) : undefined,
        status: statusObj.status
      }
    });

    res.json({ success: true, updated });
  } catch (err) {
    console.error("updateAttendance:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete attendance
export const deleteAttendance = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);

    const existing = await prisma.staffAttendance.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    const branch = await prisma.branch.findUnique({ where: { id: existing.branchId } });
    if (!branch || branch.adminId !== adminId) return res.status(403).json({ success: false, message: "Not authorized" });

    await prisma.staffAttendance.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteAttendance:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// List / query attendance with filters
export const listAttendance = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { branchId, staffId, from, to, status, shiftId } = req.query;

    // base where: only branches this admin owns
    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (staffId) where.staffId = Number(staffId);
    if (status) where.status = status;
    if (shiftId) where.shiftId = Number(shiftId);
    if (from && to) {
      where.date = { gte: new Date(from + "T00:00:00"), lte: new Date(to + "T23:59:59") };
    } else if (from) {
      where.date = { gte: new Date(from + "T00:00:00") };
    } else if (to) {
      where.date = { lte: new Date(to + "T23:59:59") };
    }

    // Ensure admin only sees records for his branches
    const branches = await prisma.branch.findMany({ where: { adminId }, select: { id: true } });
    const adminBranchIds = branches.map(b => b.id);
    where.branchId = where.branchId ? where.branchId : { in: adminBranchIds };

    const records = await prisma.staffAttendance.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, branchId: true } },
        shift: true,
        branch: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" }
    });

    res.json({ success: true, records });
  } catch (err) {
    console.error("listAttendance:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ------------------- SALARY CALC ------------------- */

/**
 * Simple salary calculator:
 * - uses staff.fixed_salary (monthly fixed) from user.fixedSalary or user.fixed_salary
 * - Overtime minutes -> paid at overtimeRatePerMin (passed or derived)
 * - returns summary for date range
 */
export const salarySummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { staffId } = req.params;
    const { from, to, overtimeRatePerHour } = req.query;

    const staff = await prisma.user.findUnique({ where: { id: Number(staffId) } });
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    // Ensure branch admin relationship (staff.branchId belongs to one of admin's branches)
    const branch = await prisma.branch.findUnique({ where: { id: staff.branchId } });
    if (!branch || branch.adminId !== adminId) return res.status(403).json({ success: false, message: "Not authorized" });

    const fromDate = from ? new Date(from + "T00:00:00") : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to + "T23:59:59") : new Date();

    const records = await prisma.staffAttendance.findMany({
      where: {
        staffId: Number(staffId),
        date: { gte: fromDate, lte: toDate }
      },
      include: { shift: true }
    });

    // compute overtime minutes for each record
    let totalOvertimeMinutes = 0;
    for (const r of records) {
      if (r.shift && r.checkoutAt) {
        const shiftEnd = parseTimeOnDate(r.date.toISOString().split("T")[0], r.shift.endTime);
        const checkout = r.checkoutAt;
        if (checkout > shiftEnd) {
          const diffMs = checkout - shiftEnd;
          totalOvertimeMinutes += Math.round(diffMs / 60000);
        }
      }
    }

    const fixedSalary = staff.fixed_salary || staff.fixedSalary || 0;
    const overtimeRatePerHourNum = Number(overtimeRatePerHour || 200); // default INR 200/hour
    const overtimePay = (totalOvertimeMinutes / 60) * overtimeRatePerHourNum;

    const totalPay = fixedSalary + overtimePay;

    res.json({
      success: true,
      summary: {
        staffId: staff.id,
        staffName: staff.name,
        period: { from: fromDate.toISOString().split("T")[0], to: toDate.toISOString().split("T")[0] },
        fixedSalary,
        totalOvertimeMinutes,
        overtimeRatePerHour: overtimeRatePerHourNum,
        overtimePay,
        totalPay,
        attendanceCount: records.length,
      }
    });
  } catch (err) {
    console.error("salarySummary:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
