import { prisma } from '../db.js';
import { decrypt, fingerprint } from './bankCrypto.js';
import { deleteSession, fetchTransactions } from './enableBanking.js';
import { fromDbDate, toDbDate } from './dates.js';

// Operations already read are read again a few days back, as banks sometimes book them late
const OVERLAP_DAYS = 5;
const LABEL_MAX = 60;

// Keyword rules to suggest a category; the first match wins, the user can always change it
const EXPENSE_RULES = [
  [/uber ?eats|deliveroo|just ?eat|mc ?do|mcdonald|burger king|kfc|starbucks|restaurant|resto|brasserie|cafe |bar |cinema|ugc|pathe|gaumont|fnac|concert|ticketmaster/, 'outings'],
  [/carrefour|leclerc|auchan|lidl|aldi|intermarche|monoprix|franprix|casino|super ?u|u express|picard|biocoop|naturalia|boulangerie|grand frais|netto|spar/, 'groceries'],
  [/sncf|ratp|navigo|uber|bolt|blablacar|tcl|tisseo|keolis|transdev|total ?energies|esso|shell|parking|velib|lime/, 'transport'],
  [/netflix|spotify|deezer|disney|prime video|amazon prime|apple\.com|icloud|google|youtube|canal|free mobile|sfr|orange|bouygues|sosh|red by sfr|abonnement/, 'subscriptions'],
  [/pharmacie|medecin|docteur|doctolib|mutuelle|dentiste|hopital|optique|optic|kine|laboratoire/, 'health'],
  [/universite|ecole|crous|librairie|cours |formation|inscription|cvec/, 'studies'],
  [/loyer|foncia|nexity|orpi|century 21|residence|bailleur|agence immo/, 'rent'],
];
const INCOME_RULES = [
  [/salaire|paie|payroll|remuneration/, 'salary'],
  [/caf |caf$|bourse|crous|pole emploi|france travail/, 'other_income'],
  [/maman|papa|parents/, 'family'],
];

const plain = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function suggestCategory(label, type) {
  const text = ` ${plain(label)} `;
  for (const [rule, category] of type === 'INCOME' ? INCOME_RULES : EXPENSE_RULES) if (rule.test(text)) return category;
  return type === 'INCOME' ? 'transfer' : 'other';
}

// Short readable label: card numbers, long references and dates are cut, nothing else from the bank is kept
export function cleanLabel(tx) {
  const raw = (tx.remittance_information ?? []).join(' ') || (tx.credit_debit_indicator === 'CRDT' ? tx.debtor?.name : tx.creditor?.name) || '';
  const label = raw
    .replace(/\b(paiement par carte|paiement cb|carte|prlv sepa|prelevement|vir sepa|virement)\b/gi, ' ')
    .replace(/\b(cb|x)\s*\*?\d{2,}\b/gi, ' ')
    .replace(/\b\d{1,2}[/.]\d{1,2}([/.]\d{2,4})?\b/g, ' ')
    .replace(/\b(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{10,}\b/g, ' ')
    .replace(/\d{5,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (label || (tx.credit_debit_indicator === 'CRDT' ? 'Crédit' : 'Débit')).slice(0, LABEL_MAX);
}

// One bank operation as a pending import, or null when it cannot be used (other currency, before the import start)
export function toImport(tx, accountUid, importFrom) {
  if (tx.transaction_amount?.currency !== 'EUR') return null;
  const amountCents = Math.round(Math.abs(Number(tx.transaction_amount.amount)) * 100);
  const date = tx.booking_date || tx.value_date || tx.transaction_date;
  if (!amountCents || !date || date < importFrom) return null;
  const type = tx.credit_debit_indicator === 'CRDT' ? 'INCOME' : 'EXPENSE';
  // The bank's own reference when it gives one, otherwise the operation's content
  const reference = tx.entry_reference || `${date}|${tx.transaction_amount.amount}|${type}|${(tx.remittance_information ?? []).join(' ')}`;
  const label = cleanLabel(tx);
  return { refHash: fingerprint(`${accountUid}|${reference}`), amountCents, type, date: toDbDate(date), label, categoryId: suggestCategory(label, type) };
}

const shiftDays = (day, days) => fromDbDate(new Date(toDbDate(day).getTime() + days * 86_400_000));

// Reads the new operations of every account of a connection; psu is set when the user is present (no daily limit)
export async function syncConnection(connection, psu) {
  const accounts = JSON.parse(decrypt(connection.accountsEnc));
  const importFrom = fromDbDate(connection.importFrom);
  const lastDay = connection.lastSyncAt ? shiftDays(connection.lastSyncAt.toISOString().slice(0, 10), -OVERLAP_DAYS) : importFrom;
  const dateFrom = lastDay > importFrom ? lastDay : importFrom;

  const rows = [];
  let failures = 0;
  for (const uid of accounts) {
    // One account the bank refuses to read must not block the others
    try {
      for (const tx of await fetchTransactions(uid, dateFrom, psu)) {
        const row = toImport(tx, uid, importFrom);
        if (row) rows.push({ ...row, userId: connection.userId });
      }
    } catch (err) {
      failures++;
      if (failures === accounts.length) throw err;
    }
  }
  // Operations seen before (pending, accepted or ignored) keep their fingerprint and are skipped
  const created = rows.length ? (await prisma.bankImport.createMany({ data: rows, skipDuplicates: true })).count : 0;
  await prisma.bankConnection.update({ where: { id: connection.id }, data: { lastSyncAt: new Date() } });
  return created;
}

// Closes the consent at the bank before an account is deleted (the database rows go with the account)
export async function closeBankConnection(userId) {
  const connection = await prisma.bankConnection.findUnique({ where: { userId } });
  if (connection) await deleteSession(decrypt(connection.sessionEnc)).catch(() => {});
}

// Background reading for the job, at most every 6 hours per connection since banks allow about 4 reads a day
const BACKGROUND_EVERY = 6 * 3600 * 1000;
export async function syncDueConnections() {
  const connections = await prisma.bankConnection.findMany({
    where: {
      validUntil: { gt: new Date() },
      OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: new Date(Date.now() - BACKGROUND_EVERY) } }],
    },
  });
  // Users who got new operations, so the job can tell them
  const updated = [];
  for (const connection of connections) {
    try {
      const created = await syncConnection(connection);
      if (created > 0) updated.push({ userId: connection.userId, created });
    } catch (err) {
      // The message holds only the HTTP status, never bank data
      console.error('Bank sync failed for a connection:', err.message);
    }
  }
  return updated;
}
