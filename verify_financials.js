import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const TEMP_DIR = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile_fin');
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fda21a78-7bc5-47eb-9e00-6c14cfa5e382';

async function run() {
  console.log('[Fin Verifier] Launching headless Chrome on port', PORT);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${TEMP_DIR}`,
    'about:blank'
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:5000/company/RELIANCE`, { method: 'PUT' });
      const data = await res.json();
      if (data && data.webSocketDebuggerUrl) {
        targetWsUrl = data.webSocketDebuggerUrl;
        console.log('[Fin Verifier] Connected to Chrome target:', targetWsUrl);
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    console.error('[Fin Verifier] Failed to connect to Chrome debug port.');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(targetWsUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log('[Fin Verifier] WebSocket ready. Enabling Page and Runtime...');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1400,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[Fin Verifier] Navigating to http://localhost:5000/company/RELIANCE');
  await send('Page.navigate', { url: 'http://localhost:5000/company/RELIANCE' });

  // Wait 3.5 seconds for API to fetch and render
  await new Promise(r => setTimeout(r, 3500));

  // Scroll down to the Financial Statements section
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Quarterly Results'));
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // 1. Screenshot: Quarterly Results
  console.log('[Fin Verifier] Capturing Quarterly Results...');
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const p1 = path.join(ARTIFACT_DIR, 'financials_quarterly.png');
  fs.writeFileSync(p1, Buffer.from(shot1.data, 'base64'));
  console.log('[Fin Verifier] Saved', p1);

  // 2. Click Profit & Loss tab
  console.log('[Fin Verifier] Clicking Profit & Loss tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Profit & Loss');
        if (el) el.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const p2 = path.join(ARTIFACT_DIR, 'financials_pnl.png');
  fs.writeFileSync(p2, Buffer.from(shot2.data, 'base64'));
  console.log('[Fin Verifier] Saved', p2);

  // 3. Click Balance Sheet tab
  console.log('[Fin Verifier] Clicking Balance Sheet tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Balance Sheet');
        if (el) el.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  const p3 = path.join(ARTIFACT_DIR, 'financials_balancesheet.png');
  fs.writeFileSync(p3, Buffer.from(shot3.data, 'base64'));
  console.log('[Fin Verifier] Saved', p3);

  // 4. Click BSE Filings & Concalls tab
  console.log('[Fin Verifier] Clicking BSE Filings & Concalls tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BSE Filings & Concalls'));
        if (el) el.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  const p4 = path.join(ARTIFACT_DIR, 'bse_filings_and_concalls.png');
  fs.writeFileSync(p4, Buffer.from(shot4.data, 'base64'));
  console.log('[Fin Verifier] Saved', p4);

  // 5. Click BSE Bhavcopy Delivery tab
  console.log('[Fin Verifier] Clicking BSE Bhavcopy Delivery tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const el = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BSE Bhavcopy Delivery'));
        if (el) el.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  const p5 = path.join(ARTIFACT_DIR, 'bse_bhavcopy_delivery.png');
  fs.writeFileSync(p5, Buffer.from(shot5.data, 'base64'));
  console.log('[Fin Verifier] Saved', p5);

  ws.close();
  chrome.kill();
  console.log('[Fin Verifier] FINISHED ALL SCREENSHOTS!');
}

run().catch(err => {
  console.error('[Fin Verifier] Error:', err);
  process.exit(1);
});

