import i18n from './i18n.js';

// Number and date formats follow the interface language
export const locale = () => (i18n.language === 'en' ? 'en-GB' : 'fr-FR');

export const formatCents = (cents) =>
  new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(cents / 100);

// "23,80", "23.8" or "1 234,5" -> 2380 cents; null if not a valid positive amount
export function parseAmount(text) {
  const clean = text.replace(/[\s€]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  return cents > 0 ? cents : null;
}

// Cents -> "23,80" (or "23.80" in English) to prefill an input
export const centsToInput = (cents) => {
  const text = (cents / 100).toFixed(2);
  return i18n.language === 'en' ? text : text.replace('.', ',');
};

// Today and the current month in the user's local time zone
const pad = (n) => String(n).padStart(2, '0');
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const thisMonth = () => today().slice(0, 7);

// "2026-10-16" -> "vendredi 16 octobre" or "Friday 16 October"
export function formatDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
}

// 0 -> "today", 1 -> "tomorrow", 3 -> "in 3 days"
export const inDays = (n) =>
  n === 0 ? i18n.t('common.today') : n === 1 ? i18n.t('common.tomorrow') : i18n.t('common.inDays', { count: n });

// "2026-10" -> "octobre 2026" or "October 2026"
export function formatMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
}

// "2026-10-14" -> "14 oct." or "14 Oct"
export function formatShortDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

// "2026-10-18" -> { day: "18", month: "oct." } for date badges
export function dayParts(day) {
  const [y, m, d] = day.split('-').map(Number);
  return { day: String(d), month: new Date(y, m - 1, d).toLocaleDateString(locale(), { month: 'short' }) };
}

// "2026-10-16" and -1 -> "2026-10-15"
export function shiftDay(day, days) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Same day one month later, kept inside short months (31 January -> 28 February)
export function nextMonthDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  const last = new Date(y, m + 1, 0).getDate();
  const date = new Date(y, m, Math.min(d, last));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
