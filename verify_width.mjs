import { spawn } from 'child_process';
import jwt from './backend/node_modules/jsonwebtoken/index.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9455;
const TEMP_DIR = 'C:\\Temp\\chrome_width_verify';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fda21a78-7bc5-47eb-9e00-6c14cfa5e382';

const JWT_SECRET = 'profitsheets_super_secure_jwt_secret_key_2026';
const token = jwt.sign(
  { id: 'usr_1794741808719xaow', email: '123@gmail.com', name: 'dscvd' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${TEMP_DIR}`,
    'http://localhost:3000/'
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        targetWsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(targetWsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, { resolve });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('ps_token', '${token}');`
  });

  await send('Page.navigate', { url: 'http://localhost:3000/profile' });
  await new Promise(r => setTimeout(r, 2500));

  // Set widescreen resolution (1920x1080) to match user screen
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 800));

  const widescreenScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'profile_widescreen_1920.png'), Buffer.from(widescreenScreenshot.data, 'base64'));
  console.log('Saved profile_widescreen_1920.png');

  // Also standard 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 800));

  const standardScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'profile_standard_1440.png'), Buffer.from(standardScreenshot.data, 'base64'));
  console.log('Saved profile_standard_1440.png');

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
