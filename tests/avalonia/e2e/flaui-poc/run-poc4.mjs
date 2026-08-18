import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { buildSingleFileSelection } from './select-file-contract.mjs';

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, '../../../..');
const evidence = path.join(root, 'artifacts', 'phase3b-flaui-selectfile-poc');
const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'local-projects.example.json'), 'utf8'));
const executablePath = path.join(config.runtimeDirectory, 'HZ.LogClient.exe');
const filePath = buildSingleFileSelection(String.raw`E:\测试项目部署\测试项目部署\RSS\log\hz.carlog_20260717160532098_20260717162532098.zip`).filePath;
const appiumPort = 4725;
const appiumUrl = `http://127.0.0.1:${appiumPort}`;
const winappPath = path.join(root, 'artifacts', 'phase3b-filedialog-poc', 'tooling', 'winapp.exe');

fs.mkdirSync(evidence, { recursive: true });

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function start(command, args, logName, keepStdin = false) {
  const stream = fs.createWriteStream(path.join(evidence, logName), { flags: 'w' });
  const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: [keepStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);
  child.once('exit', () => stream.end());
  return child;
}

async function waitForStatus(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers ?? {}) } });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${url}: ${text}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function productPids() {
  const command = `@(Get-CimInstance Win32_Process -Filter "Name='HZ.LogClient.exe'" | Where-Object { $_.ExecutablePath -ieq '${executablePath.replaceAll("'", "''")}' } | Select-Object -ExpandProperty ProcessId) | ConvertTo-Json -Compress`;
  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' }).trim();
  if (!output) return [];
  const value = JSON.parse(output);
  return (Array.isArray(value) ? value : [value]).map(Number);
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(evidence, name), JSON.stringify(value, null, 2), 'utf8');
}

function stop(child) {
  if (!child || child.exitCode !== null) return;
  try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
}

async function listWindows() {
  const response = await execFileAsync(winappPath, ['ui', 'list-windows', '--show-hidden', '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, WINAPP_CLI_TELEMETRY_OPTOUT: '1' }
  });
  const raw = response.stdout.trim();
  const start = Math.min(...[raw.indexOf('{'), raw.indexOf('[')].filter(index => index >= 0));
  const parsed = JSON.parse(raw.slice(start));
  return Array.isArray(parsed) ? parsed : parsed.windows ?? [];
}

function winAppDriverPids() {
  const command = `@(Get-CimInstance Win32_Process -Filter "Name='WinAppDriver.exe'" | Select-Object -ExpandProperty ProcessId) | ConvertTo-Json -Compress`;
  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' }).trim();
  if (!output) return [];
  const value = JSON.parse(output);
  return (Array.isArray(value) ? value : [value]).map(Number);
}

function isFileDialogWindow(item, productPids) {
  if (item.className !== '#32770') return false;
  if (productPids.includes(Number(item.processId))) return true;
  const title = String(item.title ?? '').toLowerCase();
  return title.includes('选择') || title.includes('打开') || title.includes('open') || title.includes('select');
}

async function waitForFileDialogWindow(productPids, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastWindows = [];
  while (Date.now() < deadline) {
    try {
      lastWindows = await listWindows();
      const dialog = lastWindows.find(item => isFileDialogWindow(item, productPids));
      if (dialog) return { dialogObserved: true, dialog, windows: lastWindows };
    } catch {}
    await sleep(250);
  }
  return { dialogObserved: false, dialog: null, windows: lastWindows };
}

async function hashSource() {
  const items = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!/^(bin|obj)$/i.test(entry.name)) visit(fullPath);
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(fullPath);
        const relative = path.relative(config.realProjectDirectory, fullPath).replaceAll(path.sep, '/').toLowerCase();
        const fileHash = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
        items.push(`${relative}|${bytes.length}|${fileHash}`);
      }
    }
  }
  visit(config.realProjectDirectory);
  items.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
  return {
    hash: crypto.createHash('sha256').update(Buffer.from(items.join('\n'), 'utf8')).digest('hex').toUpperCase(),
    count: items.length
  };
}

const sourceBefore = await hashSource();
const result = {
  pocId: 'POC-FLAUI-SELECTFILE-001',
  startedAt: new Date().toISOString(),
  filePath,
  sourceTreeHashBefore: sourceBefore.hash,
  sourceFileCountBefore: sourceBefore.count,
  pids: {},
  appiumClick: {},
  status: 'ERROR_AUTOMATION'
};
let appium;
let sessionId;
let ownedProductPids = [];

try {
  if (productPids().length > 0) throw new Error('BLOCKED_PRODUCT_ALREADY_RUNNING');
  appium = start('cmd.exe', ['/d', '/s', '/c', `npx appium --port ${appiumPort} --log-level info`], 'appium-server.log');
  result.pids.appium = appium.pid;
  await waitForStatus(`${appiumUrl}/status`, 30000);

  const session = await request(`${appiumUrl}/session`, {
    method: 'POST',
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: {
          platformName: 'windows',
          'appium:automationName': 'windows',
          'appium:app': executablePath,
          'appium:appWorkingDir': config.runtimeDirectory,
          'appium:createSessionTimeout': 30000,
          'appium:newCommandTimeout': 180
        },
        firstMatch: [{}]
      }
    })
  });
  sessionId = session.value?.sessionId ?? session.sessionId;
  if (!sessionId) throw new Error('Appium session id missing');
  ownedProductPids = productPids();
  result.pids.product = ownedProductPids;
  result.pids.winAppDriver = winAppDriverPids();
  if (ownedProductPids.length !== 1) throw new Error(`ERROR_PROCESS_MISMATCH: ${JSON.stringify(ownedProductPids)}`);

  const source = await request(`${appiumUrl}/session/${sessionId}/source`);
  const pageSource = String(source.value ?? source);
  result.analysisPageFound = pageSource.includes('AnalysisPage');
  result.logFileTextBoxFound = pageSource.includes('LogFileTextBox');
  if (!result.analysisPageFound || !result.logFileTextBoxFound) throw new Error('ERROR_AUTOMATION: Analysis or LogFileTextBox not found');

  const element = await request(`${appiumUrl}/session/${sessionId}/element`, {
    method: 'POST',
    body: JSON.stringify({ using: 'xpath', value: "//Edit[@AutomationId='LogFileTextBox']/following-sibling::Button[1]" })
  });
  const elementId = element.value?.['element-6066-11e4-a52e-4f735466cecf'] ?? element.value?.ELEMENT;
  try {
    await request(`${appiumUrl}/session/${sessionId}/element/${elementId}/click`, { method: 'POST', body: '{}' });
    result.appiumClick.status = 'HTTP_SUCCESS';
  } catch (error) {
    result.appiumClick.status = error.status === 500 ? 'HTTP_500' : 'ERROR';
    result.appiumClick.error = error.message;
  }

  try {
    const dialogCheck = result.appiumClick.status === 'HTTP_SUCCESS'
      ? await waitForFileDialogWindow(ownedProductPids, 10000)
      : { dialogObserved: false, dialog: null, windows: await listWindows() };
    result.appiumClick.dialogObserved = dialogCheck.dialogObserved;
    result.appiumClick.dialog = dialogCheck.dialog;
    result.appiumClick.status = dialogCheck.dialogObserved ? 'DIALOG_OPEN' : 'NO_DIALOG';
    fs.writeFileSync(path.join(evidence, 'windows-after-entry.json'), JSON.stringify(dialogCheck.windows, null, 2), 'utf8');
  } catch (error) {
    result.appiumClick.crossCheck = error.message;
  }

  const dotnetArgs = [
    'run', '--project', 'tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj', '--no-restore', '--',
    '--select-file', '--pid', String(ownedProductPids[0]), '--evidence-dir', evidence,
    '--file-path', filePath, '--appium-click-status', result.appiumClick.status
  ];
  if (result.appiumClick.dialog?.hwnd) {
    dotnetArgs.push('--dialog-hwnd', String(result.appiumClick.dialog.hwnd));
  }
  try {
    await execFileAsync('dotnet', dotnetArgs, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    result.flaUiExitCode = error.code ?? 1;
    result.flaUiError = error.message;
  }
  const flauiPath = path.join(evidence, 'poc4-result.json');
  if (fs.existsSync(flauiPath)) {
    const flauiResult = JSON.parse(fs.readFileSync(flauiPath, 'utf8'));
    result.status = flauiResult.Status;
    result.flaUiResult = flauiResult;
  }
} catch (error) {
  result.status = error.message?.startsWith('BLOCKED_') ? 'BLOCKED_TEST_DATA' : 'ERROR_AUTOMATION';
  result.error = error.stack ?? error.message;
} finally {
  if (sessionId) await request(`${appiumUrl}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  for (const pid of new Set([...ownedProductPids, ...productPids()])) {
    try { execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
  }
  stop(appium);
  const sourceAfter = await hashSource();
  result.sourceTreeHashAfter = sourceAfter.hash;
  result.sourceFileCountAfter = sourceAfter.count;
  result.sourceTreeHashEqual = result.sourceTreeHashBefore === result.sourceTreeHashAfter && result.sourceFileCountBefore === result.sourceFileCountAfter;
  result.finishedAt = new Date().toISOString();
  writeJson('processes.json', {
    ownedProductPids,
    currentProductPids: productPids(),
    winAppDriverPids: winAppDriverPids(),
    appiumPid: result.pids.appium,
    cleaned: true
  });
  writeJson('poc4-orchestration.json', result);
  console.log(JSON.stringify({ status: result.status, pids: result.pids, appiumClick: result.appiumClick, sourceTreeHashEqual: result.sourceTreeHashEqual }, null, 2));
}

process.exitCode = result.status === 'PASS' ? 0 : 1;
