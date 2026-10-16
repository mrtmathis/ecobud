const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatCents = (cents) => euros.format(cents / 100);

// "23,80", "23.8" or "1 234,5" -> 2380 cents; null if not a valid positive amount
export function parseAmount(text) {
  const clean = text.replace(/[\s€]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  return cents > 0 ? cents : null;
}

// Cents -> "23,80" to prefill an input
export const centsToInput = (cents) => (cents / 100).toFixed(2).replace('.', ',');

// Today and the current month in the user's local time zone
const pad = (n) => String(n).padStart(2, '0');
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const thisMonth = () => today().slice(0, 7);

// "2026-10-16" -> "vendredi 16 octobre"
export function formatDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// 0 -> "aujourd'hui", 1 -> "demain", 3 -> "dans 3 jours"
export const inDays = (n) => (n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`);

// "2026-10" -> "octobre 2026"
export function formatMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
