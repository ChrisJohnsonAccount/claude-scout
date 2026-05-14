/**
 * Run once to get Google OAuth refresh token for Gmail + Sheets.
 * Usage: node scripts/get-tokens.mjs
 */
import { google } from 'googleapis';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length && !key.startsWith('#')) {
    process.env[key.trim()] = rest.join('=').trim();
  }
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.');
  process.exit(1);
}

const PORT = 3030;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/spreadsheets',
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') return;

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400);
    res.end(`OAuth error: ${error}`);
    console.error('\nOAuth error:', error);
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>✓ Authorized! You can close this tab and return to the terminal.</h2>');

    console.log('\n✓ Success! Add this to your .env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nKeep this token secret — it grants access to Gmail and Sheets.\n');
  } catch (err) {
    res.writeHead(500);
    res.end(`Token exchange failed: ${err.message}`);
    console.error('\nFailed to exchange code:', err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log(`\nWaiting for Google to redirect to localhost:${PORT}...\n`);
});
