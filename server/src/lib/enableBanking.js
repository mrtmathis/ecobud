import fs from 'node:fs';
import jwt from 'jsonwebtoken';

// Enable Banking open banking API (read-only account information); docs: https://enablebanking.com/docs/api/reference/
const API = 'https://api.enablebanking.com';

// Private key from an env variable on Vercel (base64 of the .pem file), or from a local file in development
function privateKey() {
  if (process.env.ENABLE_BANKING_PRIVATE_KEY) return Buffer.from(process.env.ENABLE_BANKING_PRIVATE_KEY, 'base64').toString('utf8');
  if (process.env.ENABLE_BANKING_KEY_FILE) return fs.readFileSync(new URL(`../../${process.env.ENABLE_BANKING_KEY_FILE}`, import.meta.url), 'utf8');
  return null;
}

export const bankEnabled = () => Boolean(process.env.ENABLE_BANKING_APP_ID && privateKey() && process.env.BANK_ENCRYPTION_KEY);

// Short-lived token signed with the application key, as the API requires (RS256, kid = application id)
function token() {
  return jwt.sign({ iss: 'enablebanking.com', aud: 'api.enablebanking.com' }, privateKey(), {
    algorithm: 'RS256',
    expiresIn: 300,
    header: { typ: 'JWT', kid: process.env.ENABLE_BANKING_APP_ID },
  });
}

export class BankApiError extends Error {
  constructor(status, body) {
    super(`Enable Banking ${status}`);
    this.status = status;
    // Only the error code is kept: response bodies may hold bank data and are never logged
    this.code = body?.error || body?.code || null;
  }
}

// psu: IP address and user agent of the user when present; the bank then lifts its 4 fetches a day limit
async function call(path, { method = 'GET', body, psu } = {}) {
  const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
  if (psu) {
    headers['Psu-Ip-Address'] = psu.ip;
    headers['Psu-User-Agent'] = psu.userAgent;
  }
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new BankApiError(res.status, data);
  return data;
}

export const listBanks = (country) => call(`/aspsps?country=${encodeURIComponent(country)}&psu_type=personal`);

export const startAuthorization = ({ bank, state, redirectUrl, validUntil }) =>
  call('/auth', {
    method: 'POST',
    body: { access: { valid_until: validUntil }, aspsp: bank, state, redirect_url: redirectUrl, psu_type: 'personal' },
  });

export const createSession = (code) => call('/sessions', { method: 'POST', body: { code } });

export const deleteSession = (sessionId) => call(`/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });

// All booked transactions of an account since a date, following the continuation keys page after page
export async function fetchTransactions(accountUid, dateFrom, psu, strategy = 'default') {
  const all = [];
  let continuation = null;
  for (let page = 0; page < 50; page++) {
    const query = new URLSearchParams({ date_from: dateFrom, transaction_status: 'BOOK', strategy });
    if (continuation) query.set('continuation_key', continuation);
    let data;
    try {
      data = await call(`/accounts/${encodeURIComponent(accountUid)}/transactions?${query}`, { psu });
    } catch (err) {
      // The bank keeps a shorter history than asked: take what it has, the caller filters by date
      if (err.code === 'WRONG_TRANSACTIONS_PERIOD' && strategy === 'default' && page === 0) return fetchTransactions(accountUid, dateFrom, psu, 'longest');
      throw err;
    }
    all.push(...(data.transactions ?? []));
    continuation = data.continuation_key;
    if (!continuation) break;
  }
  return all;
}
