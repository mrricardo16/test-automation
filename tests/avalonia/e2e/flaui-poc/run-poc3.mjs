import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, '../../../..');
const evidence = path.join(root, 'projects', 'test-workflow', 'artifacts', 'phase3b-flaui-poc');
const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'local-projects.example.json'), 'utf8'));
const executablePath = path.join(config.runtimeDirectory, 'HZ.LogClient.exe');
const wadPath = process.env.APPIUM_WAD_PATH ?? 'C:\\Program Files (x86)\\Windows Application Driver\\WinAppDriver.exe';
const appiumPort = 4725;
const wadPort = 4723;
const appiumUrl = `http://127.0.0.1:${appiumPort}`;
const winappPath = path.join(root, 'projects', 'test-workflow', 'artifacts', 'phase3b-filedialog-poc', 'tooling', 'winapp.exe');

fs.mkdirSync(evidence, { recursive: true });

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function start(command, args, logName, keepStdin = false) {
  const stream = fs.createWriteStream(path.join(evidence, logName), { flags: 'w' });
  const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: [keepStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(stream); child.stderr.pipe(stream); child.once('exit', () => stream.end());
  return child;
}
async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch {}
    await sleep(250);
  }
  throw new Error(`timeout waiting for ${url}`);
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options.headers ?? {}) } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) { const error = new Error(`HTTP ${response.status} ${url}: ${text}`); error.status = response.status; throw error; }
  return body;
}
function productPids() {
  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', `@(Get-CimInstance Win32_Process -Filter "Name='HZ.LogClient.exe'" | Where-Object { $_.ExecutablePath -ieq '${executablePath.replaceAll("'", "''")}' } | Select-Object -ExpandProperty ProcessId) | ConvertTo-Json -Compress`], { encoding: 'utf8' }).trim();
  if (!output) return [];
  const value = JSON.parse(output); return (Array.isArray(value) ? value : [value]).map(Number);
}
function stop(child) { if (!child || child.exitCode !== null) return; try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
function write(name, value) { fs.writeFileSync(path.join(evidence, name), JSON.stringify(value, null, 2), 'utf8'); }

const result = { pocId: 'POC-FLAUI-FILEDIALOG-001', startedAt: new Date().toISOString(), pids: {}, appiumClick: {}, status: 'ERROR' };
let wad; let appium; let sessionId; let ownedProductPids = [];
try {
  if (productPids().length) throw new Error('BLOCKED: existing HZ.LogClient.exe detected before POC.');
  wad = start(wadPath, ['127.0.0.1', String(wadPort)], 'winappdriver.log', true); result.pids.winAppDriver = wad.pid;
  await waitFor('http://127.0.0.1:4723/status', 30000);
  appium = start('cmd.exe', ['/d', '/s', '/c', `npx appium --port ${appiumPort} --log-level info`], 'appium-server.log'); result.pids.appium = appium.pid;
  await waitFor(`${appiumUrl}/status`, 30000);
  const session = await request(`${appiumUrl}/session`, { method: 'POST', body: JSON.stringify({ capabilities: { alwaysMatch: { platformName: 'windows', 'appium:automationName': 'windows', 'appium:app': executablePath, 'appium:appWorkingDir': config.runtimeDirectory, 'appium:createSessionTimeout': 30000, 'appium:newCommandTimeout': 180 }, firstMatch: [{}] } }) });
  sessionId = session.value?.sessionId ?? session.sessionId; ownedProductPids = productPids(); result.pids.product = ownedProductPids;
  const source = await request(`${appiumUrl}/session/${sessionId}/source`); result.mainWindowSourceLength = String(source.value ?? source).length;
  const edit = await request(`${appiumUrl}/session/${sessionId}/element`, { method: 'POST', body: JSON.stringify({ using: 'xpath', value: "//Edit[@AutomationId='LogFileTextBox']/following-sibling::Button[1]" }) });
  const elementId = edit.value?.['element-6066-11e4-a52e-4f735466cecf'] ?? edit.value?.ELEMENT;
  try {
    await request(`${appiumUrl}/session/${sessionId}/element/${elementId}/click`, { method: 'POST', body: '{}' });
    result.appiumClick = { status: 'PASS', selector: "//Edit[@AutomationId='LogFileTextBox']/following-sibling::Button[1]" };
  } catch (error) {
    result.appiumClick = { status: error.status === 500 ? 'HTTP_500' : 'ERROR', reason: error.message };
  }
  try {
    const windows = await execFileAsync(winappPath, ['ui', 'list-windows', '--show-hidden', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, env: { ...process.env, WINAPP_CLI_TELEMETRY_OPTOUT: '1' } });
    fs.writeFileSync(path.join(evidence, 'winapp-after-appium-click.json'), windows.stdout, 'utf8');
    result.winappAfterAppiumClick = 'PASS';
    const raw = windows.stdout.trim();
    const list = JSON.parse(raw.slice(Math.min(...[raw.indexOf('{'), raw.indexOf('[')].filter(index => index >= 0))));
    const observed = (Array.isArray(list) ? list : list.windows ?? []).some(item => item.className === '#32770' && ownedProductPids.includes(Number(item.processId)));
    result.appiumClick.dialogObserved = observed;
    if (result.appiumClick.status === 'PASS' && !observed) result.appiumClick.status = 'NO_DIALOG';
  } catch (error) {
    result.winappAfterAppiumClick = { status: 'ERROR', reason: error.message };
  }
  if (ownedProductPids.length !== 1) throw new Error(`ERROR_PROCESS_MISMATCH: expected one product PID, found ${JSON.stringify(ownedProductPids)}`);
  const dotnetArgs = ['run', '--project', 'tests/avalonia/e2e/flaui-poc/FlaUI.FileDialog.Poc.csproj', '--no-restore', '--', '--pid', String(ownedProductPids[0]), '--evidence-dir', evidence, '--target-directory', config.phase3bRun.carLogDirectory, '--appium-click-status', result.appiumClick.status];
  const flaui = await execFileAsync('dotnet', dotnetArgs, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  fs.writeFileSync(path.join(evidence, 'flaui-console.json'), JSON.stringify({ stdout: flaui.stdout, stderr: flaui.stderr }, null, 2), 'utf8');
  result.flauiExitCode = 0; result.status = JSON.parse(fs.readFileSync(path.join(evidence, 'flaui-poc-result.json'), 'utf8')).status;
} catch (error) {
  const flauiResultPath = path.join(evidence, 'flaui-poc-result.json');
  if (fs.existsSync(flauiResultPath)) {
    const flauiResult = JSON.parse(fs.readFileSync(flauiResultPath, 'utf8'));
    result.status = flauiResult.status;
    result.flauiStatus = flauiResult.status;
  } else {
    result.status = 'ERROR';
  }
  result.flauiExitCode = error.code ?? 1;
  result.error = error.stack ?? error.message;
  if (error.stdout || error.stderr) fs.writeFileSync(path.join(evidence, 'flaui-console.json'), JSON.stringify({ stdout: error.stdout, stderr: error.stderr }, null, 2), 'utf8');
} finally {
  result.finishedAt = new Date().toISOString();
  if (sessionId) await request(`${appiumUrl}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  for (const pid of new Set([...ownedProductPids, ...productPids()])) { try { execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
  stop(appium); stop(wad);
  write('flaui-orchestration.json', result);
  console.log(JSON.stringify(result, null, 2));
}
process.exitCode = result.status === 'PASS' ? 0 : 1;
