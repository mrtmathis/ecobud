import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { validate } from '../lib/validation.js';
import { HttpError } from '../lib/errors.js';
import { encrypt, decrypt } from '../lib/bankCrypto.js';
import { bankEnabled, BankApiError, createSession, deleteSession, listBanks, startAuthorization } from '../lib/enableBanking.js';
import { syncConnection } from '../lib/bankSync.js';
import { fromDbDate, today, toDbDate } from '../lib/dates.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Without a contract with Enable Banking only the developer's own accounts may be linked: the feature is shown to listed e-mails only
const allowed = (user) =>
  bankEnabled() &&
  (process.env.BANK_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(user.email.toLowerCase());

const onlyAllowed = (req, res, next) => {
  if (!allowed(req.user)) throw new HttpError(404, 'NOT_FOUND');
  next();
};

// Provider errors become one code; their bodies are never logged or forwarded
const bankError = (err) => (err instanceof BankApiError ? new HttpError(424, 'BANK_ERROR') : err);
const psuOf = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') || 'EcoBud' });
const STATE_AUDIENCE = 'ecobud-bank-auth';
const CONSENT_DAYS = 180;
// A sync asked by the user is skipped when one ran less than this ago
const MANUAL_SYNC_GAP = 5 * 60 * 1000;

const connectionJson = (c) =>
  c && {
    bankName: c.bankName,
    validUntil: c.validUntil,
    expired: c.validUntil <= new Date(),
    daysLeft: Math.max(0, Math.ceil((c.validUntil - Date.now()) / 86_400_000)),
    lastSyncAt: c.lastSyncAt,
    importFrom: fromDbDate(c.importFrom),
  };

// State of the bank link, also tells the front end whether to show the feature at all
router.get('/', async (req, res) => {
  if (!allowed(req.user)) return res.json({ available: false });
  const [connection, pending] = await Promise.all([
    prisma.bankConnection.findUnique({ where: { userId: req.user.id } }),
    prisma.bankImport.count({ where: { userId: req.user.id, status: 'PENDING' } }),
  ]);
  res.json({ available: true, connection: connectionJson(connection), pending });
});

router.use(onlyAllowed);

// Banks the user can pick from (France, personal accounts)
router.get('/banks', async (req, res) => {
  try {
    const data = await listBanks('FR');
    // Alphabetical order as a French reader expects it (accents and case ignored)
    const banks = data.aspsps
      .map((b) => ({ name: b.name, country: b.country }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    res.json({ banks });
  } catch (err) {
    throw bankError(err);
  }
});

// Starts the consent at the bank; the signed state ties the bank's answer to this user and this bank
router.post('/connect', async (req, res) => {
  const { name, country } = validate(z.object({ name: z.string().min(1).max(100), country: z.string().length(2) }), req.body);
  const state = jwt.sign({ bank: { name, country }, nonce: crypto.randomUUID() }, process.env.JWT_SECRET, {
    subject: req.user.id,
    audience: STATE_AUDIENCE,
    expiresIn: '15m',
  });
  const validUntil = new Date(Date.now() + CONSENT_DAYS * 86_400_000).toISOString();
  try {
    const { url } = await startAuthorization({ bank: { name, country }, state, redirectUrl: process.env.BANK_REDIRECT_URL, validUntil });
    res.json({ url });
  } catch (err) {
    throw bankError(err);
  }
});

// The bank sends the user back here; the page then shows the result
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  let payload;
  try {
    payload = jwt.verify(String(state), process.env.JWT_SECRET, { audience: STATE_AUDIENCE });
  } catch {
    return res.redirect('/bank?result=expired');
  }
  if (payload.sub !== req.user.id) return res.redirect('/bank?result=expired');
  if (error || !code) return res.redirect('/bank?result=refused');

  try {
    const session = await createSession(String(code));
    const accounts = (session.accounts ?? []).map((a) => a.uid).filter(Boolean);
    if (!accounts.length) return res.redirect('/bank?result=noaccount');

    // A new link replaces the old one, which is closed at the bank
    const previous = await prisma.bankConnection.findUnique({ where: { userId: req.user.id } });
    if (previous) await deleteSession(decrypt(previous.sessionEnc)).catch(() => {});
    const now = today(req.user.timezone);
    const data = {
      bankName: payload.bank.name,
      sessionEnc: encrypt(session.session_id),
      accountsEnc: encrypt(JSON.stringify(accounts)),
      validUntil: new Date(session.access?.valid_until || Date.now() + CONSENT_DAYS * 86_400_000),
      importFrom: previous?.importFrom ?? toDbDate(`${now.slice(0, 7)}-01`),
      lastSyncAt: null,
    };
    const connection = await prisma.bankConnection.upsert({ where: { userId: req.user.id }, create: { ...data, userId: req.user.id }, update: data });
    await syncConnection(connection, psuOf(req)).catch(() => {});
    res.redirect('/bank?result=connected');
  } catch (err) {
    console.error('Bank connection failed:', err.message);
    res.redirect('/bank?result=error');
  }
});

// Reads new operations now (the user is present, so the bank's daily limit does not apply)
router.post('/sync', async (req, res) => {
  const connection = await prisma.bankConnection.findUnique({ where: { userId: req.user.id } });
  if (!connection) throw new HttpError(404, 'NOT_FOUND');
  if (connection.validUntil <= new Date()) throw new HttpError(409, 'BANK_CONSENT_EXPIRED');
  let imported = 0;
  if (!connection.lastSyncAt || Date.now() - connection.lastSyncAt.getTime() > MANUAL_SYNC_GAP) {
    try {
      imported = await syncConnection(connection, psuOf(req));
    } catch (err) {
      throw bankError(err);
    }
  }
  const pending = await prisma.bankImport.count({ where: { userId: req.user.id, status: 'PENDING' } });
  res.json({ imported, pending });
});

// Operations waiting for review, newest first
router.get('/imports', async (req, res) => {
  const imports = await prisma.bankImport.findMany({
    where: { userId: req.user.id, status: 'PENDING' },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({
    imports: imports.map((i) => ({ id: i.id, amountCents: i.amountCents, type: i.type, date: fromDbDate(i.date), label: i.label, categoryId: i.categoryId })),
  });
});

async function findPending(req) {
  const item = await prisma.bankImport.findFirst({ where: { id: req.params.id, userId: req.user.id, status: 'PENDING' } });
  if (!item) throw new HttpError(404, 'NOT_FOUND');
  return item;
}

// Pending details are erased once handled: only the fingerprint stays, so the operation is not imported again
const handled = (status) => ({ status, amountCents: null, type: null, date: null, label: null, categoryId: null });

// Accepted: becomes a normal transaction with the chosen category, the bank label as note
router.post('/imports/:id/accept', async (req, res) => {
  const item = await findPending(req);
  const { categoryId } = validate(z.object({ categoryId: z.string().min(1).max(40) }), req.body);
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (category?.type !== item.type) {
    const error = new HttpError(400, 'VALIDATION_ERROR');
    error.fields = ['categoryId'];
    throw error;
  }
  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: { userId: req.user.id, type: item.type, amountCents: item.amountCents, date: item.date, categoryId, note: item.label },
    }),
    prisma.bankImport.update({ where: { id: item.id }, data: handled('ACCEPTED') }),
  ]);
  // A day with an expense is no longer a "nothing spent" day
  if (item.type === 'EXPENSE') await prisma.dayCheck.deleteMany({ where: { userId: req.user.id, date: item.date } });
  res.status(201).json({ id: transaction.id });
});

// Ignored, e.g. a transfer between the user's own accounts or an expense already noted by hand
router.post('/imports/:id/ignore', async (req, res) => {
  const item = await findPending(req);
  await prisma.bankImport.update({ where: { id: item.id }, data: handled('IGNORED') });
  res.status(204).end();
});

// Disconnects the bank: consent closed at the bank, link and pending operations deleted; accepted transactions stay
router.delete('/', async (req, res) => {
  const connection = await prisma.bankConnection.findUnique({ where: { userId: req.user.id } });
  if (connection) {
    await deleteSession(decrypt(connection.sessionEnc)).catch(() => {});
    await prisma.$transaction([
      prisma.bankConnection.delete({ where: { id: connection.id } }),
      prisma.bankImport.deleteMany({ where: { userId: req.user.id, status: 'PENDING' } }),
    ]);
  }
  res.status(204).end();
});

export default router;
