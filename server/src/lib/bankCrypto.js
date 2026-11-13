import crypto from 'node:crypto';

// AES-256-GCM with BANK_ENCRYPTION_KEY (32 bytes, base64): a stolen database alone does not give access to anyone's bank
const key = () => Buffer.from(process.env.BANK_ENCRYPTION_KEY, 'base64');

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}

export function decrypt(payload) {
  const raw = Buffer.from(payload, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

// Keyed fingerprint of a bank operation: the same operation always gives the same value, which tells nothing about it
export const fingerprint = (value) => crypto.createHmac('sha256', key()).update(`bank-ref:${value}`).digest('base64url');
