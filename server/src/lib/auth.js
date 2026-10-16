import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'ecobud_session';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

// Compared against when the email is unknown, so both cases take the same time
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${SESSION_DAYS}d`,
  });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function readSessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}

// No 0/O or 1/I, so the code is easy to copy by hand
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 16 random characters (80 bits), shown as XXXX-XXXX-XXXX-XXXX
export function generateRecoveryCode() {
  const chars = Array.from({ length: 16 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return chars.join('').match(/.{4}/g).join('-');
}

// Ignores case, spaces and dashes typed by the user
export const normalizeRecoveryCode = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

// Only these fields ever leave the API
export function publicUser(user) {
  const { id, name, email, language, timezone, skin, appearance, themeChosen, createdAt } = user;
  const hasRecoveryCode = Boolean(user.recoveryCodeHash);
  return { id, name, email, language, timezone, skin, appearance, themeChosen, createdAt, hasRecoveryCode };
}
