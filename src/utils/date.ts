/**
 * Date and time helper utilities
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Format a Date object to YYYY-MM-DD using local time
 */
export function toISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date object (midnight)
 */
export function parseISODate(isoStr: string): Date {
  const parts = isoStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Format date for Home header: "Wednesday, October 28"
 */
export function formatHeaderDate(d: Date = new Date()): string {
  const weekday = WEEKDAY_NAMES[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  return `${weekday}, ${month} ${d.getDate()}`;
}

/**
 * Format date into full human string: "Wednesday, October 28"
 */
export function formatFullDate(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseISODate(dateOrStr) : dateOrStr;
  const weekday = WEEKDAY_NAMES[d.getDay()];
  const month = MONTH_NAMES[d.getMonth()];
  return `${weekday}, ${month} ${d.getDate()}`;
}

/**
 * Format short month day: "Oct 28"
 */
export function formatShortMonthDay(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseISODate(dateOrStr) : dateOrStr;
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
  return `${month} ${d.getDate()}`;
}

/**
 * Get days difference between two ISO date strings (target - base)
 */
export function getDaysDifference(targetIso: string, baseIso: string): number {
  const target = parseISODate(targetIso);
  const base = parseISODate(baseIso);
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get relative tag label: "TODAY", "TOMORROW", "3 DAYS FROM NOW", "2 DAYS AGO"
 */
export function getRelativeDateLabel(targetIso: string, todayIso: string = toISODate()): string {
  const diff = getDaysDifference(targetIso, todayIso);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  if (diff === -1) return 'YESTERDAY';
  if (diff > 1) return `${diff} DAYS FROM NOW`;
  return `${Math.abs(diff)} DAYS AGO`;
}

/**
 * Return the current Monday-Sunday week array containing the given reference date
 */
export function getWeekDaysForDate(referenceDate: Date = new Date()) {
  const day = referenceDate.getDay(); // 0 is Sunday, 1 is Monday...
  // Monday offset: if Sunday (0), distance to Monday is -6. Otherwise 1 - day.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffToMonday
  );

  const week = [];
  const weekdayCodes = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = toISODate(d);
    week.push({
      w: weekdayCodes[i],
      n: String(d.getDate()),
      date: iso,
      full: formatFullDate(d),
    });
  }
  return week;
}

/**
 * Format 24h string "HH:mm" to 12h "h:mm A", e.g. "14:30" -> "2:30 PM"
 */
export function formatTime24To12(time24: string): string {
  if (!time24 || !time24.includes(':')) return '12:00 PM';
  const [hStr, mStr] = time24.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return '12:00 PM';

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minutesPadded = String(minutes).padStart(2, '0');
  return `${hours}:${minutesPadded} ${ampm}`;
}

/**
 * Format a Date to "HH:mm"
 */
export function dateToTime24(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Create a Date object from a 24h string "HH:mm"
 */
export function time24ToDate(time24: string, baseDate: Date = new Date()): Date {
  const [hStr, mStr] = (time24 || '12:00').split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Format duration in minutes to "1 hr 30 min", "1 hr 0 min", "45 min"
 */
export function formatDurationDisplay(durationMinutes: number): string {
  const mins = Math.max(0, durationMinutes);
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;

  if (hours > 0) {
    return `${hours} hr ${remainingMinutes} min`;
  }
  return `${remainingMinutes} min`;
}

/**
 * Compute the end time from a 24h start time and duration in minutes
 */
export function computeEndTime24(startTime24: string, durationMinutes: number): string {
  const [hStr, mStr] = (startTime24 || '12:00').split(':');
  const startTotalMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  const endTotalMinutes = (startTotalMinutes + durationMinutes) % (24 * 60);

  const endHours = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Format time range e.g. "3:00 PM – 4:30 PM"
 */
export function formatTimeRange(startTime24: string, durationMinutes: number): string {
  const start12 = formatTime24To12(startTime24);
  const endTime24 = computeEndTime24(startTime24, durationMinutes);
  const end12 = formatTime24To12(endTime24);
  return `${start12} – ${end12}`;
}

/**
 * Format seconds into mm:ss (e.g. 180 -> "03:00")
 */
export function formatSecondsToTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


