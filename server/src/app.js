import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import dashboardRoutes from './routes/dashboard.js';
import recurrenceRoutes from './routes/recurrences.js';
import { sameOriginOnly } from './middlewares/security.js';

const app = express();

// Vercel sits in front of the API: trust its proxy to get the real client IP
app.set('trust proxy', 1);

// Security headers, and hide the "X-Powered-By: Express" header
app.use(helmet());
app.disable('x-powered-by');

// Small body limit so huge payloads cannot overload the API
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', sameOriginOnly);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recurrences', recurrenceRoutes);

// Errors are codes, not sentences: the front end translates them
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

// Never send stack traces or internal details to the client
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const parserCodes = { 'entity.parse.failed': 'INVALID_JSON', 'entity.too.large': 'PAYLOAD_TOO_LARGE' };
  const code = status >= 500 ? 'SERVER_ERROR' : err.code || parserCodes[err.type] || 'BAD_REQUEST';
  res.status(status).json(err.fields ? { error: code, fields: err.fields } : { error: code });
});

export default app;
