import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  cycleBookingStatus
} from "../controller/personlTraining.controller.js";

import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// ADMIN ONLY
router.post("/", authenticate, authorizeRoles("ADMIN"), createBooking);
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllBookings);
router.get("/:id", authenticate, authorizeRoles("ADMIN"), getBookingById);
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateBooking);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteBooking);

// Toggle booking status: Booked → Confirmed → Cancelled → Booked
router.patch("/:id/cycle-status", authenticate, authorizeRoles("ADMIN"), cycleBookingStatus);

export default router;
