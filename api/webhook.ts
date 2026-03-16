import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join('/tmp', 'logs.html');

// Initialize beautiful HTML file if it doesn't exist
async function initLogFile() {
  try {
    await fs.access(LOG_FILE);
  } catch {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook Logs • Pretty View</title>
    <style>
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: #0d1117; 
            color: #c9d1d9; 
            margin: 0; 
            padding: 20px; 
        }
        h1 { 
            text-align: center; 
            color: #58a6ff; 
            margin-bottom: 10px;
        }
        .subtitle { text-align: center; color: #8b949e; margin-bottom: 30px; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            background: #161b22; 
            border-radius: 8px; 
            overflow: hidden;
        }
        th { 
            background: #21262d; 
            padding: 14px; 
            text-align: left; 
            color: #58a6ff;
        }
        td { 
            padding: 12px 14px; 
            border-top: 1px solid #30363d; 
            vertical-align: top;
        }
        tr:hover { background: #1f252e; }
        .time { color: #8b949e; font-size: 0.9em; }
        .method { font-weight: bold; color: #ffa657; }
        .payload { 
            background: #0d1117; 
            padding: 10px; 
            border-radius: 6px; 
            font-family: monospace; 
            white-space: pre-wrap; 
            max-height: 180px; 
            overflow-y: auto;
        }
        .refresh-btn {
            position: fixed; top: 20px; right: 20px;
            padding: 10px 18px;
            background: #238636;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }
        .refresh-btn:hover { background: #2ea44f; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <h1>🔥 Webhook Logs</h1>
    <p class="subtitle">Auto-refreshes every 5 seconds • Powered by Vercel</p>
    <button class="refresh-btn" onclick="location.reload()">Refresh Now</button>
    
    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>Method</th>
                <th>IP Address</th>
                <th>Payload</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
</body>
</html>`;
    await fs.writeFile(LOG_FILE, html);
  }
}

// Add new log row to HTML
async function appendLog(req: VercelRequest) {
  await initLogFile();

  const time = new Date().toLocaleString('en-US', { hour12: false });
  const method = req.method || 'GET';
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'Unknown';
  const payload = req.body ? JSON.stringify(req.body, null, 2) : '{ no body }';

  const newRow = `
    <tr>
        <td class="time">${time}</td>
        <td><span class="method">${method}</span></td>
        <td>${ip}</td>
        <td><div class="payload">${payload}</div></td>
    </tr>`;

  let content = await fs.readFile(LOG_FILE, 'utf-8');
  content = content.replace('</tbody>', newRow + '</tbody>');
  await fs.writeFile(LOG_FILE, content);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await appendLog(req);

  console.log(`Webhook received [${req.method}] from ${req.headers['x-forwarded-for'] || 'unknown'}`);

  res.status(200).send(`
    <h2 style="color:#58a6ff;text-align:center;margin-top:50px;">
      ✅ Webhook Received & Logged!<br><br>
      <a href="/logs.html" style="color:#58a6ff;">👉 View All Logs Here</a>
    </h2>
  `);
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
