import { prisma } from "../config/prisma.config.js";
import { deleteCloudinaryFile } from "../utils/cloudinaryDelete.utils.js";

/* ===============================================================
   CREATE STAFF WITH CLOUDINARY IMAGE
================================================================ */
export const createStaff = async (req, res) => {
  try {
    const adminId = req.user.id;

    const {
      firstName, lastName, gender, dob,
      email, phone, branchId,
      role, joinDate, exitDate,
      salaryType, fixedSalary,
      loginEnabled, username, password
    } = req.body;

    // Validate branch belongs to current admin
    const branch = await prisma.branch.findFirst({
      where: { id: Number(branchId), adminId }
    });

    if (!branch)
      return res.status(403).json({ message: "Admin not authorized for this branch" });

    const staffCode = `STAFF${Date.now()}`;

    const profilePhoto = req.file ? req.file.path : null;

    const newStaff = await prisma.staff.create({
      data: {
        staffCode,
        firstName,
        lastName,
        gender,
        dob: new Date(dob),
        email,
        phone,
        profilePhoto,
        role,
        status: "ACTIVE",
        branchId: Number(branchId),
        joinDate: new Date(joinDate),
        exitDate: exitDate || null,
        salaryType,
        fixedSalary: Number(fixedSalary),
        loginEnabled: loginEnabled === "true",
        username,
        password,
        adminId
      }
    });

    return res.status(201).json({ staff: newStaff });

  } catch (error) {
    console.error("createStaff error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ===============================================================
   UPDATE STAFF WITH CLOUDINARY REPLACEMENT
================================================================ */
export const updateStaff = async (req, res) => {
  try {
    const staffId = Number(req.params.id);
    const adminId = req.user.id;

    const existing = await prisma.staff.findFirst({
      where: { id: staffId, adminId }
    });

    if (!existing)
      return res.status(404).json({ message: "Staff not found" });

    const {
      firstName, lastName, gender, dob,
      email, phone, branchId,
      role, joinDate, exitDate,
      fixedSalary, loginEnabled,
      username, password, status
    } = req.body;

    // If branch changed, validate admin ownership
    if (branchId && branchId !== existing.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: Number(branchId), adminId }
      });

      if (!branch)
        return res.status(403).json({ message: "Admin not authorized for this branch" });
    }

    let profilePhoto = existing.profilePhoto;

    // If a new image is uploaded, delete old one
    if (req.file) {
      if (existing.profilePhoto) await deleteCloudinaryFile(existing.profilePhoto);
      profilePhoto = req.file.path;
    }

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: {
        firstName,
        lastName,
        gender,
        dob: new Date(dob),
        email,
        phone,
        role,
        status,
        branchId: Number(branchId),
        joinDate: new Date(joinDate),
        exitDate: exitDate ? new Date(exitDate) : null,
        fixedSalary: Number(fixedSalary),
        loginEnabled: loginEnabled === "true",
        username,
        password,
        profilePhoto
      }
    });

    return res.json({ staff: updated });

  } catch (error) {
    console.error("updateStaff error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ===============================================================
   DELETE STAFF WITH IMAGE DELETE
================================================================ */
export const deleteStaff = async (req, res) => {
  try {
    const staffId = Number(req.params.id);
    const adminId = req.user.id;

    const existing = await prisma.staff.findFirst({
      where: { id: staffId, adminId }
    });

    if (!existing)
      return res.status(404).json({ message: "Staff not found" });

    // Remove profile photo from Cloudinary
    if (existing.profilePhoto) {
      await deleteCloudinaryFile(existing.profilePhoto);
    }

    await prisma.staff.delete({
      where: { id: staffId }
    });

    return res.json({ message: "Staff deleted successfully" });

  } catch (error) {
    console.error("deleteStaff error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



/*
const formData = new FormData();
formData.append("firstName", values.firstName);
formData.append("lastName", values.lastName);
formData.append("gender", values.gender);
formData.append("dob", values.dob);
formData.append("email", values.email);
formData.append("phone", values.phone);

formData.append("branchId", values.branchId);
formData.append("role", values.role);
formData.append("joinDate", values.joinDate);

formData.append("fixedSalary", values.fixedSalary);
formData.append("loginEnabled", values.loginEnabled);

if (selectedFile) {
  formData.append("profilePhoto", selectedFile);
}

axios.post("/api/staff/create", formData);



*/

/* ============================================================
   ROLE-BASED STAFF PAYLOAD BUILDER
============================================================ */

export const getAllStaff = async (req, res) => {
  try {
    const adminId = req.user.id;
    const staffList = await prisma.staff.findMany({
        where: { adminId }
    });
    return res.json({ staff: staffList });
  } catch (error) {
    console.error("getAllStaff error", error);
    res.status(500).json({ message: "Internal server error" });
  }     
};

/* =========================================================

    RECORD ATTENDANCE
========================================================= */

export const recordAttendance = async (req, res) => {
  try {
    const { staffId, date, status } = req.body; 
    const attendance = await prisma.staffAttendance.create({
        data: {
            staffId: Number(staffId),
            date: new Date(date),
            status
        }
    });
    res.json({ success: true, attendance });
  } catch (error) {
    console.error("recordAttendance error", error);
    res.status(500).json({ message: "Internal server error" });
  } 
};

/* =========================================================                    
    GENERATE MONTHLY SALARY
========================================================= */

export const generateMonthlySalary = async (req, res) => {
    try {
        const { staffId, month, year } = req.body;
        const salaryRecord = await prisma.staffSalary.create({
            data: {
                staffId: Number(staffId),
                month: Number(month),
                year: Number(year)
            }
        });
        res.json({ success: true, salaryRecord });
    } catch (error) {
        console.error("generateMonthlySalary error", error);
        res.status(500).json({ message: "Internal server error" });
    }   
};
/* =========================================================
   GET SALARY HISTORY
========================================================= */    
export const getSalaryHistory = async (req, res) => {
    try {
        const staffId = Number(req.params.id);
        const salaryHistory = await prisma.staffSalary.findMany({
            where: { staffId },
            orderBy: { year: 'desc', month: 'desc' }
        });
        res.json({ success: true, salaryHistory });
    } catch (error) {
        console.error("getSalaryHistory error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



/* ============================================================
   GET STAFF BY ID
============================================================ */

export const getStaffById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const staffId = Number(req.params.id);
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, adminId }
    });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
        });
    }
    return res.json({
      success: true,
      message: "Staff retrieved successfully",
      data: staff
    });
  } catch (error) {
    console.error("getStaffById error", error);
    return res.status(500).json({   
        success: false,
        message: "Internal server error"
    });
  } 
};

/* ============================================================
   LIST STAFF (ADMIN)
============================================================ */     
