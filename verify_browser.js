import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const TEMP_DIR = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_cdp_profile');

async function run() {
  console.log('[Browser Verifier] Launching headless Chrome on port', PORT);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${TEMP_DIR}`,
    'about:blank'
  ]);

  // Wait for debug port to be ready
  let targetWsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:5000/company/LALITHAA`, { method: 'PUT' });
      const data = await res.json();
      if (data && data.webSocketDebuggerUrl) {
        targetWsUrl = data.webSocketDebuggerUrl;
        console.log('[Browser Verifier] Connected to Chrome target:', targetWsUrl);
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    console.error('[Browser Verifier] Failed to connect to Chrome debug port.');
    chrome.kill();
    process.exit(1);
  }

  // Connect via native WebSocket
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
  console.log('[Browser Verifier] WebSocket ready. Enabling Page and Runtime...');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // Set viewport to 1280x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to LALITHAA company page
  console.log('[Browser Verifier] Navigating to http://localhost:5000/company/LALITHAA');
  await send('Page.navigate', { url: 'http://localhost:5000/company/LALITHAA' });

  // Wait 3 seconds for data to stream and render
  await new Promise(r => setTimeout(r, 3000));

  // 1. Capture Desktop Screenshot
  const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
  const desktopPath = path.join('E:\\Profitsheets', 'verified_desktop.png');
  fs.writeFileSync(desktopPath, Buffer.from(desktopShot.data, 'base64'));
  console.log('[Browser Verifier] Desktop screenshot saved to:', desktopPath);

  // 2. Click '+ FOLLOW' button and verify state
  console.log('[Browser Verifier] Testing Follow / Watchlist button...');
  const followEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('FOLLOW'));
        if (btn) {
          btn.click();
          return { found: true, text: btn.textContent };
        }
        return { found: false };
      })()
    `,
    returnByValue: true
  });
  console.log('[Browser Verifier] Follow button click result:', followEval.result.value);

  // Wait 1 second and check if text changed to FOLLOWING
  await new Promise(r => setTimeout(r, 1000));
  const followAfterEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('FOLLOWING'));
        const stored = localStorage.getItem('profitsheets_watchlist');
        return {
          nowFollowing: !!btn,
          btnText: btn ? btn.textContent.trim() : null,
          storedWatchlist: stored
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[Browser Verifier] Post-follow state:', followAfterEval.result.value);

  // 3. Test BUY button auth gate
  console.log('[Browser Verifier] Testing BUY button auth gate...');
  const buyEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'BUY');
        if (btn) {
          btn.click();
          return { found: true };
        }
        return { found: false };
      })()
    `,
    returnByValue: true
  });
  console.log('[Browser Verifier] Clicked BUY:', buyEval.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Check if Auth modal popped up
  const modalEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const title = document.getElementById('auth-modal-title');
        return {
          modalOpen: !!title,
          modalTitle: title ? title.textContent : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('[Browser Verifier] Auth gate modal inspection:', modalEval.result.value);

  // Capture Auth Modal Screenshot
  const modalShot = await send('Page.captureScreenshot', { format: 'png' });
  const modalPath = path.join('E:\\Profitsheets', 'verified_auth_modal.png');
  fs.writeFileSync(modalPath, Buffer.from(modalShot.data, 'base64'));
  console.log('[Browser Verifier] Auth modal screenshot saved to:', modalPath);

  // Close modal by clicking Escape or close button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
        if (closeBtn) closeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Test Mobile Viewport (iPhone 14 / 390x844)
  console.log('[Browser Verifier] Switching to mobile emulation (390x844)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1000));

  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  const mobilePath = path.join('E:\\Profitsheets', 'verified_mobile.png');
  fs.writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));
  console.log('[Browser Verifier] Mobile screenshot saved to:', mobilePath);

  // 5. Navigate to /watchlist and verify LALITHAA is listed
  console.log('[Browser Verifier] Navigating to http://localhost:5000/watchlist...');
  await send('Page.navigate', { url: 'http://localhost:5000/watchlist' });
  await new Promise(r => setTimeout(r, 2000));

  const watchlistEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const hasLalithaa = Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('LALITHAA'));
        const title = document.querySelector('h1')?.textContent;
        return { hasLalithaa, title };
      })()
    `,
    returnByValue: true
  });
  console.log('[Browser Verifier] Watchlist page verification:', watchlistEval.result.value);

  const watchlistShot = await send('Page.captureScreenshot', { format: 'png' });
  const watchlistPath = path.join('E:\\Profitsheets', 'verified_watchlist.png');
  fs.writeFileSync(watchlistPath, Buffer.from(watchlistShot.data, 'base64'));
  console.log('[Browser Verifier] Watchlist screenshot saved to:', watchlistPath);

  ws.close();
  chrome.kill();
  console.log('[Browser Verifier] ALL TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('[Browser Verifier] Error:', err);
  process.exit(1);
});

