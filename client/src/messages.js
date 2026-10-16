import i18n from './i18n.js';

// Text for an API error code, in the current language
export const errorMessage = (error) => {
  const key = `errors.${error?.code}`;
  return i18n.exists(key) ? i18n.t(key) : i18n.t('errors.SERVER_ERROR');
};

// Same rules as the API, checked before sending
export const isStrongPassword = (value) =>
  value.length >= 12 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value);
