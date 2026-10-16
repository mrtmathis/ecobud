import { z } from 'zod';
import { HttpError } from './errors.js';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

// 12 to 128 characters with lowercase, uppercase, digit and symbol
export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

// Parses req.body with a schema, or answers 400 with the names of the invalid fields
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new HttpError(400, 'VALIDATION_ERROR');
    error.fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw error;
  }
  return result.data;
}
