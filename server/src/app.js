import express from 'express';
import helmet from 'helmet';

const app = express();

// Security headers, and hide the "X-Powered-By: Express" header
app.use(helmet());
app.disable('x-powered-by');

// Small body limit so huge payloads cannot overload the API
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Errors are codes, not sentences: the front end translates them
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

// Never send stack traces or internal details to the client
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const codes = { 'entity.parse.failed': 'INVALID_JSON', 'entity.too.large': 'PAYLOAD_TOO_LARGE' };
  res.status(status).json({ error: status >= 500 ? 'SERVER_ERROR' : codes[err.type] || 'BAD_REQUEST' });
});

export default app;
