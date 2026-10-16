// Dates are exchanged as "YYYY-MM-DD" strings and stored as UTC midnight, so no time zone can shift the day
export const toDbDate = (day) => new Date(`${day}T00:00:00.000Z`);
export const fromDbDate = (date) => date.toISOString().slice(0, 10);

// First day of a "YYYY-MM" month and first day of the next one
export function monthRange(month) {
  const [year, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(year, m - 1, 1)), end: new Date(Date.UTC(year, m, 1)) };
}

// Today in the user's time zone, as "YYYY-MM-DD"
export const today = (timeZone = 'Europe/Paris') =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// Current month in the user's time zone, as "YYYY-MM"
export const currentMonth = (timeZone = 'Europe/Paris') => today(timeZone).slice(0, 7);

// "2026-10" -> "2026-09", "2026-01" -> "2025-12"
export function previousMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

// Number of days from one "YYYY-MM-DD" to another
export const daysBetween = (from, to) => Math.round((toDbDate(to) - toDbDate(from)) / 86_400_000);
