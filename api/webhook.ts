import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs/promises';
import path from 'path';

const LOG_FILE = path.join('/tmp', 'webhook_logs.jsonl');

async function appendLog(data: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: data.method,
    headers: data.headers,
    query: data.query,
    body: data.body,
    ip: data.ip,
  };

  const line = JSON.stringify(logEntry) + '\n';
  
  try {
    await fs.appendFile(LOG_FILE, line);
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const logData = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };

  // Save to log file
  await appendLog(logData);

  // Also print to Vercel logs (so you can see in dashboard)
  console.log('=== WEBHOOK RECEIVED ===');
  console.dir(logData, { depth: null });

  res.status(200).json({
    success: true,
    message: 'Webhook received and logged',
    timestamp: new Date().toISOString(),
    logLocation: '/tmp/webhook_logs.jsonl'
  });
}

// Allow all methods
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // increase if you expect big payloads
    },
  },
};
