// French texts for API error codes (English comes with the translation step)
const errorMessages = {
  VALIDATION_ERROR: 'Certains champs ne sont pas valides.',
  EMAIL_TAKEN: 'Un compte existe déjà avec cette adresse e-mail.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives. Réessaie dans 15 minutes.',
  INVALID_RECOVERY: 'Adresse e-mail ou code de récupération incorrect.',
  INVALID_PASSWORD: 'Mot de passe incorrect.',
  UNAUTHENTICATED: 'Ta session a expiré. Reconnecte-toi.',
  SERVER_ERROR: 'Une erreur est survenue. Réessaie plus tard.',
};

export const errorMessage = (error) => errorMessages[error?.code] || errorMessages.SERVER_ERROR;

export const PASSWORD_RULES =
  '12 caractères minimum, avec au moins une minuscule, une majuscule, un chiffre et un symbole.';

// Same rules as the API, checked before sending
export const isStrongPassword = (value) =>
  value.length >= 12 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[^A-Za-z0-9]/.test(value);
