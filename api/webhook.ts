import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs/promises';
import path from 'path';

const LOG_HTML = path.join('/tmp', 'logs.html');

async function initHtmlFile() {
  const exists = await fs.access(LOG_HTML).then(() => true).catch(() => false);
  if (!exists) {
    const initialHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webhook Logs - Live</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #0f0f0f; color: #0f0; margin: 0; padding: 20px; }
    h1 { color: #0f0; text-align: center; }
    table { width: 100%; border-collapse: collapse; background: #1a1a1a; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
    th { background: #222; color: #0f0; }
    tr:hover { background: #222; }
    .timestamp { color: #888; font-size: 0.9em; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
    .refresh { position: fixed; top: 20px; right: 20px; padding: 10px 16px; background: #0f0; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
  </style>
  <meta http-equiv="refresh" content="5">
</head>
<body>
  <h1>🔥 Webhook Logs (Auto-refresh every 5s)</h1>
  <button class="refresh" onclick="location.reload()">Refresh Now</button>
  <table>
    <tr>
      <th>Time</th>
      <th>Event / Method</th>
      <th>IP</th>
      <th>Payload</th>
    </tr>
  </table>
</body>
</html>`;
    await fs.writeFile(LOG_HTML, initialHtml);
  }
}

async function appendToHtml(log: any) {
  await initHtmlFile();

  const row = `
    <tr>
      <td class="timestamp">${new Date().toISOString().replace('T', ' ').slice(0, 19)}</td>
      <td><strong>${log.method}</strong> ${log.body?.event || log.body?.type || '—'}</td>
      <td>${log.ip || '—'}</td>
      <td><pre>${JSON.stringify(log.body || {}, null, 2)}</pre></td>
    </tr>`;

  let content = await fs.readFile(LOG_HTML, 'utf-8');
  
  // Insert new row before </table>
  content = content.replace('</table>', row + '</table>');
  
  await fs.writeFile(LOG_HTML, content);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logData = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
  };

  // Save to beautiful HTML
  await appendToHtml(logData);

  // Also log to console
  console.log('Webhook received:', JSON.stringify(logData.body || {}, null, 2));

  res.status(200).json({
    success: true,
    message: 'Webhook logged successfully',
    view_logs: 'https://po-c-ashen.vercel.app/logs.html',
    timestamp: new Date().toISOString()
  });
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
