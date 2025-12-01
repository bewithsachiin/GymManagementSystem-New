import express from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  recordAttendance,
  generateMonthlySalary,
  getSalaryHistory
} from "../controller/staff.controller.js";

import { upload } from "../utils/upload.utils.js";

const router = express.Router();

// CRUD with profile photo upload
router.post("/create", upload.single("profilePhoto"), createStaff);
router.put("/:id", upload.single("profilePhoto"), updateStaff);

router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.delete("/:id", deleteStaff);

// Attendance
router.post("/:id/attendance", recordAttendance);

// Salary
router.post("/:id/salary/generate", generateMonthlySalary);
router.get("/:id/salary/history", getSalaryHistory);

export default router;
