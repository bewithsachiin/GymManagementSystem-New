// routes/adminAttendance.routes.js
import express from "express";
import * as attendanceCtrl from "../controller/attendance.controller.js";
import { authenticate,authorizeRoles } from "../middleware/auth.middleware.js"; // implement as needed
import { upload, uploadSingleToCloudinary } from "../middleware/uploadCloudinary.middleware.js";

const router = express.Router();

// All routes are protected; admin only00000
router.use(authenticate);
router.use(authorizeRoles(["ADMIN", "SUPERADMIN"]));

// Shifts
router.post("/shifts", attendanceCtrl.createShift);
router.get("/shifts", attendanceCtrl.listShifts);

// Attendance CRUD
router.post("/attendance", attendanceCtrl.addAttendance);
router.get("/attendance", attendanceCtrl.listAttendance);
router.get("/attendance/:id", attendanceCtrl.getAttendanceById ?? (async (req,res)=>res.status(404).json({message:"not implemented"})) ); // optional
router.put("/attendance/:id", attendanceCtrl.updateAttendance);
router.delete("/attendance/:id", attendanceCtrl.deleteAttendance);

// Salary calculator
router.get("/staff/:staffId/salary-summary", attendanceCtrl.salarySummary);

export default router;
