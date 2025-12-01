import { prisma } from "../config/prisma.config.js";

/* =========================================================
   1. CREATE PERSONAL TRAINING BOOKING
========================================================= */
export const createBooking = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      trainerId,
      memberId,
      type,
      date,
      startTime,
      endTime,
      price,
      paymentStatus,
      bookingStatus,
      totalMembers,
      branchId
    } = req.body;

    // Validate admin → branch
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, adminId }
    });
    if (!branch) {
      return res.status(403).json({ message: "Not authorized for this branch" });
    }

    // Validate member belongs to same branch
    const member = await prisma.user.findFirst({
      where: { id: memberId, role: "MEMBER", branchId }
    });
    if (!member) {
      return res.status(400).json({ message: "Member does not belong to this branch" });
    }

    // Trainer is optional (Guest / Unknown trainer allowed)
    let trainer = null;
    if (trainerId) {
      trainer = await prisma.user.findFirst({
        where: { id: trainerId, role: "STAFF", staffRole: "PERSONAL_TRAINER", branchId }
      });

      if (!trainer) {
        return res.status(400).json({ message: "Trainer not found for this branch" });
      }
    }

    const booking = await prisma.personalTrainingBooking.create({
      data: {
        trainerId: trainer?.id || null,
        memberId,
        branchId,
        type,
        date: new Date(date),
        startTime,
        endTime,
        price: Number(price),
        paymentStatus,
        bookingStatus,
        totalMembers: Number(totalMembers) || 1,

        trainerName: trainer?.name || "Unknown",
        memberName: member.name,
        memberEmail: member.email,
        memberPhone: member.phone,
        memberJoinDate: member.createdAt
      }
    });

    return res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.log("createBooking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   2. GET ALL BOOKINGS FOR ADMIN
========================================================= */
export const getAllBookings = async (req, res) => {
  try {
    const adminId = req.user.id;

    const bookings = await prisma.personalTrainingBooking.findMany({
      where: {
        branch: { adminId }
      },
      include: {
        trainer: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ bookings });
  } catch (error) {
    console.log("getAllBookings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   3. GET BOOKING BY ID
========================================================= */
export const getBookingById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);

    const booking = await prisma.personalTrainingBooking.findFirst({
      where: { id, branch: { adminId } },
      include: {
        trainer: true,
        member: true,
        branch: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({ booking });
  } catch (error) {
    console.log("getBookingById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   4. UPDATE BOOKING
========================================================= */
export const updateBooking = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);

    const existing = await prisma.personalTrainingBooking.findFirst({
      where: { id, branch: { adminId } }
    });

    if (!existing) {
      return res.status(404).json({ message: "Not authorized to update this booking" });
    }

    const updated = await prisma.personalTrainingBooking.update({
      where: { id },
      data: req.body
    });

    return res.json({ message: "Booking updated", updated });
  } catch (error) {
    console.log("updateBooking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   5. DELETE BOOKING
========================================================= */
export const deleteBooking = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);

    const existing = await prisma.personalTrainingBooking.findFirst({
      where: { id, branch: { adminId } }
    });

    if (!existing) {
      return res.status(404).json({ message: "Not authorized" });
    }

    await prisma.personalTrainingBooking.delete({
      where: { id }
    });

    return res.json({ message: "Booking deleted" });
  } catch (error) {
    console.log("deleteBooking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   6. CYCLE BOOKING STATUS (BOOKED → CONFIRMED → CANCELLED)
========================================================= */
export const cycleBookingStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = Number(req.params.id);

    const booking = await prisma.personalTrainingBooking.findFirst({
      where: { id, branch: { adminId } }
    });

    if (!booking) {
      return res.status(404).json({ message: "Not authorized" });
    }

    let newStatus;
    if (booking.bookingStatus === "Booked") newStatus = "Confirmed";
    else if (booking.bookingStatus === "Confirmed") newStatus = "Cancelled";
    else newStatus = "Booked";

    const updated = await prisma.personalTrainingBooking.update({
      where: { id },
      data: { bookingStatus: newStatus }
    });

    return res.json({ message: "Status updated", updated });
  } catch (error) {
    console.log("cycleBookingStatus error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
