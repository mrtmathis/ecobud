// Sends an email through Brevo; without an API key (local dev), prints it instead
export async function sendMail({ to, subject, text }) {
  if (!process.env.BREVO_API_KEY) {
    // Never print emails (they contain reset links) in production logs
    if (process.env.NODE_ENV === 'production') throw new Error('BREVO_API_KEY is missing');
    console.log(`\n[mail to ${to}] ${subject}\n${text}\n`);
    return;
  }

  const match = (process.env.MAIL_FROM || '').match(/^(.*)<(.+)>$/);
  const sender = match ? { name: match[1].trim(), email: match[2].trim() } : { email: process.env.MAIL_FROM };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}`);
}
