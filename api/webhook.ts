import type { VercelRequest, VercelResponse } from '@vercel/node';

let logs: any[] = [];   // Only POST requests will be stored
const MAX_LOGS = 100;

function generateHtml() {
  let rows = logs.map(log => {
    const time = new Date(log.timestamp).toLocaleString('en-US', { hour12: false });
    const ip = log.ip || 'Unknown';
    const payload = log.body ? JSON.stringify(log.body, null, 2) : '{ no body }';

    return `
      <tr>
        <td class="time">${time}</td>
        <td><span class="method">POST</span></td>
        <td>${ip}</td>
        <td><div class="payload">${payload}</div></td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook Logs • POST Only</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0d1117; color: #c9d1d9; margin: 0; padding: 20px; }
        h1 { text-align: center; color: #58a6ff; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #8b949e; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
        th { background: #21262d; padding: 14px; text-align: left; color: #58a6ff; }
        td { padding: 12px 14px; border-top: 1px solid #30363d; vertical-align: top; }
        tr:hover { background: #1f252e; }
        .time { color: #8b949e; font-size: 0.9em; }
        .method { font-weight: bold; color: #ffa657; }
        .payload { background: #0d1117; padding: 10px; border-radius: 6px; font-family: monospace; white-space: pre-wrap; max-height: 220px; overflow-y: auto; }
        .refresh-btn { position: fixed; top: 20px; right: 20px; padding: 10px 18px; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .clear-btn { position: fixed; top: 20px; right: 160px; padding: 10px 18px; background: #da3633; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <h1>🔥 Webhook Logs (POST Only)</h1>
    <p class="subtitle">Only POST requests are shown • Auto-refreshes every 5s</p>
    
    <button class="refresh-btn" onclick="location.reload()">Refresh Now</button>
    <button class="clear-btn" onclick="if(confirm('Clear all logs?')) location.href='/clear'">Clear Logs</button>

    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>Method</th>
                <th>IP Address</th>
                <th>Payload</th>
            </tr>
        </thead>
        <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center;padding:60px;color:#8b949e;">No POST requests yet.<br>Send some webhooks using the Python script!</td></tr>'}
        </tbody>
    </table>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '', `https://${req.headers.host}`);

  // Clear logs
  if (url.pathname === '/clear') {
    logs = [];
    return res.redirect('/logs.html');
  }

  // Only log POST requests
  if (req.method === 'POST') {
    logs.unshift({
      timestamp: Date.now(),
      method: 'POST',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      body: req.body || {},
    });

    if (logs.length > MAX_LOGS) logs.pop();
  }

  // Show logs page
  if (url.pathname === '/logs.html') {
    return res.status(200).send(generateHtml());
  }

  // Default response for webhook hits
  if (req.method === 'POST') {
    console.log(`POST Webhook received from ${req.headers['x-forwarded-for'] || 'unknown'}`);
    res.status(200).send(`
      <h2 style="color:#58a6ff;text-align:center;margin-top:80px;font-family:sans-serif;">
        ✅ POST Webhook Received & Logged!<br><br>
        <a href="/logs.html" style="color:#58a6ff;font-size:1.3em;">👉 View Pretty Logs</a>
      </h2>
    `);
  } else {
    res.status(200).send(`<h2 style="text-align:center;margin-top:100px;color:#8b949e;">This endpoint only logs POST requests.<br><br><a href="/logs.html">View Logs</a></h2>`);
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
