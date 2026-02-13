const monthShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DateFormatKey =
  | "MMM d, yyyy"
  | "MMMM d, yyyy"
  | "EEE, MMM d"
  | "yyyy-MM-dd";

export type TimeFormatKey = "h:mm a" | "h a" | "HH:mm";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (hour === undefined || Number.isNaN(hour)) return null;
  return { hour, minute: Number.isNaN(minute) ? 0 : minute };
}

export function formatDate(value: string | null, format: DateFormatKey) {
  if (!value) return null;
  const date = parseDate(value);
  if (!date) return value;

  const { year, month, day } = date;
  const monthIndex = month - 1;
  const dayOfWeek = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();

  switch (format) {
    case "MMMM d, yyyy":
      return `${monthLong[monthIndex]} ${day}, ${year}`;
    case "EEE, MMM d":
      return `${weekdayShort[dayOfWeek]}, ${monthShort[monthIndex]} ${day}`;
    case "yyyy-MM-dd":
      return value;
    case "MMM d, yyyy":
    default:
      return `${monthShort[monthIndex]} ${day}, ${year}`;
  }
}

export function formatTime(value: string | null, format: TimeFormatKey) {
  if (!value) return null;
  const time = parseTime(value);
  if (!time) return value;

  const { hour, minute } = time;
  if (format === "HH:mm") {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  if (format === "h a") {
    return `${hour12}${period}`;
  }
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}
