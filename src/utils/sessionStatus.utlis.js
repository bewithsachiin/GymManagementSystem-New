import { addMinutes, isBefore } from "date-fns";

export const computeSessionStatus = (session) => {
  const now = new Date();

  const start = new Date(session.date);
  const end = addMinutes(start, session.duration);

  if (isBefore(end, now)) return "Completed";
  if (isBefore(start, now) === false) return "Upcoming";

  return "Upcoming";
};
