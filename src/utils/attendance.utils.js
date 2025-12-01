// utils/attendanceUtils.js
import { parse, format, isAfter, isBefore, addMinutes } from "date-fns";

/**
 * parseHHMM -> returns a Date object on given dateStr (YYYY-MM-DD) with time hh:mm
 */
export function parseTimeOnDate(dateStr, hhmm) {
  // dateStr: "2025-04-05"
  const [hour, minute] = hhmm.split(":").map(Number);
  const base = new Date(dateStr + "T00:00:00");
  base.setHours(hour, minute, 0, 0);
  return base;
}

/**
 * computeAttendanceStatus
 * - shift: { startTime: "06:00", endTime: "14:00", graceMins: 15 }
 * - date -> "YYYY-MM-DD"
 * - checkinAt, checkoutAt -> Date objects or null
 *
 * returns: { status: "Present"|"Late"|"Absent"|"Overtime", meta: {...} }
 */
export function computeAttendanceStatus({ shift, dateStr, checkinAt, checkoutAt }) {
  // If no shift provided -> basic rules
  if (!shift) {
    if (!checkinAt) return { status: "Absent" };
    // has checkin
    if (!checkoutAt) return { status: "Present" };
    return { status: "Present" };
  }

  const shiftStart = parseTimeOnDate(dateStr, shift.startTime);
  const shiftEnd = parseTimeOnDate(dateStr, shift.endTime);

  const graceEnd = addMinutes(shiftStart, shift.graceMins || 15);

  if (!checkinAt) {
    // if current date > dateStr and checkin missing -> Absent
    return { status: "Absent" };
  }

  // Late if checked in after graceEnd
  if (isAfter(checkinAt, graceEnd)) {
    // may also be Present+Late
    // If checkout extends past shift end -> Overtime
    if (checkoutAt && isAfter(checkoutAt, shiftEnd)) {
      return { status: "Overtime" };
    }
    return { status: "Late" };
  }

  // On time
  if (checkoutAt && isAfter(checkoutAt, shiftEnd)) {
    return { status: "Overtime" };
  }

  return { status: "Present" };
}
