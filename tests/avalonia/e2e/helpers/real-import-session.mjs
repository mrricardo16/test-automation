import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn, execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { loadProjectConfig } from './project-config.mjs';
import { captureOwnedProductProcesses, stopOwnedProduct } from './real-app-process.mjs';
import { runEvidenceDirectory, writeEvidence } from './evidence.mjs';

const execFileAsync = promisify(execFile);
const WAD_PORT = 4723;
const WAD_URL = `http://127.0.0.1:${WAD_PORT}`;
const writeRunEvidence = (fileName, content) => writeEvidence(fileName, content, runEvidenceDirectory);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil(predicate, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  let lastError = new Error(`${description}: condition was not met`);
  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`${description}: ${lastError.message}`);
}

async function requestJson(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  });
  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }
  if (!response.ok) {
    const error = new Error(`Appium HTTP ${response.status} ${route}: ${bodyText}`);
    error.httpStatus = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function findWinAppDriver() {
  const candidates = [
    process.env.APPIUM_WAD_PATH,
    `${process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'}\\Windows Application Driver\\WinAppDriver.exe`,
    `${process.env.ProgramFiles ?? 'C:\\Program Files'}\\Windows Application Driver\\WinAppDriver.exe`,
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function startLoggedProcess(file, args, logName, options = {}) {
  fs.mkdirSync(runEvidenceDirectory, { recursive: true });
  const logPath = path.join(runEvidenceDirectory, logName);
  const logStream = fs.createWriteStream(logPath, { flags: 'w' });
  const child = spawn(file, args, {
    cwd: options.cwd ?? process.cwd(),
    windowsHide: options.windowsHide ?? true,
    stdio: [options.keepStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
  });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  child.once('exit', () => logStream.end());
  return { child, logPath };
}

function startAppiumServer(port) {
  return startLoggedProcess(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `npx appium --port ${port} --log-level info`]
      : ['appium', '--port', String(port), '--log-level', 'info'],
    'appium-server.log',
    { windowsHide: true },
  );
}

async function stopProcessTree(handle) {
  if (!handle || handle.exitCode !== null) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill.exe', ['/PID', String(handle.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {}
    return;
  }
  handle.kill();
  await new Promise((resolve) => handle.once('exit', resolve));
}

function elementId(response) {
  return response?.value?.['element-6066-11e4-a52e-4f735466cecf'] ?? response?.value?.ELEMENT ?? null;
}

async function findElement(serverUrl, sessionId, using, value) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/element`, {
    method: 'POST',
    body: JSON.stringify({ using, value }),
  });
  const id = elementId(response);
  if (!id) throw new Error(`Element not found: ${using}=${value}`);
  return id;
}

async function findElements(serverUrl, sessionId, using, value) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/elements`, {
    method: 'POST',
    body: JSON.stringify({ using, value }),
  });
  return (response?.value ?? []).map(elementId).filter(Boolean);
}

async function clickElement(serverUrl, sessionId, id) {
  await requestJson(serverUrl, `/session/${sessionId}/element/${encodeURIComponent(id)}/click`, {
    method: 'POST',
    body: '{}',
  });
}

async function clearElement(serverUrl, sessionId, id) {
  await requestJson(serverUrl, `/session/${sessionId}/element/${encodeURIComponent(id)}/clear`, {
    method: 'POST',
    body: '{}',
  });
}

async function setElementValue(serverUrl, sessionId, id, text) {
  await requestJson(serverUrl, `/session/${sessionId}/element/${encodeURIComponent(id)}/value`, {
    method: 'POST',
    body: JSON.stringify({ text, value: [...text] }),
  });
}

async function elementText(serverUrl, sessionId, id) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/element/${encodeURIComponent(id)}/text`);
  return String(response?.value ?? '');
}

async function elementAttribute(serverUrl, sessionId, id, attribute) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/element/${encodeURIComponent(id)}/attribute/${encodeURIComponent(attribute)}`);
  return response?.value ?? null;
}

async function source(serverUrl, sessionId) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/source`);
  return String(response?.value ?? '');
}

async function screenshot(serverUrl, sessionId, fileName) {
  const response = await requestJson(serverUrl, `/session/${sessionId}/screenshot`);
  const base64 = response?.value;
  if (typeof base64 === 'string' && base64.length > 0) {
    await fsp.writeFile(path.join(runEvidenceDirectory, fileName), Buffer.from(base64, 'base64'));
    return true;
  }
  return false;
}

async function sendKeyValues(serverUrl, sessionId, values) {
  await requestJson(serverUrl, `/session/${sessionId}/keys`, {
    method: 'POST',
    body: JSON.stringify({ value: values }),
  });
}

async function createSession(serverUrl, capabilities) {
  const response = await requestJson(serverUrl, '/session', {
    method: 'POST',
    body: JSON.stringify({ capabilities: { alwaysMatch: capabilities, firstMatch: [{}] } }),
  });
  const sessionId = response?.value?.sessionId ?? response?.sessionId;
  if (!sessionId) throw new Error(`Session response did not contain a session id: ${JSON.stringify(response)}`);
  return sessionId;
}

async function deleteSession(serverUrl, sessionId) {
  if (!sessionId) return;
  await requestJson(serverUrl, `/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

function markStep(steps, name, status, details = '') {
  steps.push({ name, status, details });
}

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat('${value.replaceAll("'", "', \"'\", '")}')`;
}

async function waitForText(serverUrl, sessionId, using, value, expected, timeoutMs) {
  return waitUntil(async () => {
    const id = await findElement(serverUrl, sessionId, using, value);
    const text = await elementText(serverUrl, sessionId, id);
    return text.includes(expected) ? { id, text } : false;
  }, timeoutMs, `waiting for ${expected}`);
}

export async function runRealImport() {
  const config = loadProjectConfig();
  const runConfig = config.phase3bRun ?? {};
  const appiumPort = config.appiumPort === WAD_PORT ? WAD_PORT + 2 : config.appiumPort;
  const serverUrl = `http://127.0.0.1:${appiumPort}`;
  const selectedNames = runConfig.selectedCarLogFiles ?? [];
  const selectedPaths = selectedNames.map((name) => path.join(runConfig.carLogDirectory ?? '', name));
  const steps = [];
  const pids = {};
  let wadHandle;
  let appiumHandle;
  let ownedProduct;
  let mainSessionId;
  let pickerSessionId;
  let status = 'ERROR';
  let reason = '';
  let selectedFiles = [];
  let actual = {};

  try {
    if (!findWinAppDriver()) {
      status = 'BLOCKED';
      reason = 'BLOCKED: WinAppDriver.exe is not discoverable.';
      return { status, reason, steps, pids, selectedFiles, actual };
    }
    if (!runConfig.carLogDirectory || selectedNames.length < 3 || selectedPaths.some((file) => !fs.existsSync(file))) {
      status = 'BLOCKED_TEST_DATA';
      reason = 'BLOCKED_TEST_DATA: the configured three car-log ZIP inputs are not all available.';
      return { status, reason, steps, pids, selectedFiles, actual };
    }

    const existing = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', "@(Get-CimInstance Win32_Process -Filter \"Name='HZ.LogClient.exe'\").Count"], { encoding: 'utf8' }).then((result) => Number(result.stdout.trim())).catch(() => -1);
    if (existing !== 0) {
      status = 'BLOCKED';
      reason = `BLOCKED: ${existing < 0 ? 'could not inspect' : 'an existing'} HZ.LogClient.exe process was detected; no user process was killed.`;
      return { status, reason, steps, pids, selectedFiles, actual };
    }

    const wadPath = findWinAppDriver();
    wadHandle = startLoggedProcess(wadPath, ['127.0.0.1', String(WAD_PORT)], 'winappdriver.log', { windowsHide: true, keepStdin: true }).child;
    pids.winAppDriver = wadHandle.pid;
    await waitUntil(async () => {
      try {
        const response = await fetch(`${WAD_URL}/status`);
        return response.ok;
      } catch {
        return false;
      }
    }, config.appiumLaunchTimeoutMs, 'WinAppDriver status');
    markStep(steps, 'Start WinAppDriver and verify status', 'PASS', `PID=${wadHandle.pid}; ${WAD_URL}/status=200`);

    appiumHandle = startAppiumServer(appiumPort).child;
    pids.appiumServer = appiumHandle.pid;
    await waitUntil(async () => {
      try {
        const response = await fetch(`${serverUrl}/status`);
        if (!response.ok) return false;
        const body = await response.json();
        return body?.value?.ready === true ? body : false;
      } catch {
        return false;
      }
    }, config.appiumLaunchTimeoutMs, 'Appium status');
    markStep(steps, 'Start Appium and verify ready', 'PASS', `PID=${appiumHandle.pid}; port=${appiumPort}`);

    ownedProduct = { executablePath: config.executablePath, pids: [] };
    mainSessionId = await createSession(serverUrl, {
      platformName: 'windows',
      'appium:automationName': 'windows',
      'appium:app': config.executablePath,
      'appium:appWorkingDir': config.runtimeDirectory,
      'appium:wadUrl': WAD_URL,
      'appium:createSessionTimeout': config.appiumLaunchTimeoutMs,
      'appium:newCommandTimeout': 180,
    });
    captureOwnedProductProcesses(ownedProduct);
    markStep(steps, 'Create Appium Session and start owned HZ.LogClient.exe', 'PASS', `Session=${mainSessionId}; Appium-launched PID(s)=${ownedProduct.pids.join(',')}`);

    const mainWindowSource = await source(serverUrl, mainSessionId);
    await writeRunEvidence('main-window.xml', mainWindowSource);
    await screenshot(serverUrl, mainSessionId, 'before-import.png');
    const analysisPage = await findElement(serverUrl, mainSessionId, 'accessibility id', 'AnalysisPage');
    const logFile = await findElement(serverUrl, mainSessionId, 'accessibility id', 'LogFileTextBox');
    markStep(steps, 'Find MainWindow, AnalysisPage, and LogFileTextBox', 'PASS', `AnalysisPage=${analysisPage}; LogFileTextBox=${logFile}`);
    await writeRunEvidence('analysis-before-import.xml', await source(serverUrl, mainSessionId));

    const chooseLogButton = await findElement(
      serverUrl,
      mainSessionId,
      'xpath',
      `//Edit[@AutomationId=${xpathLiteral('LogFileTextBox')}]/following-sibling::Button[@Name=${xpathLiteral('选择')}][1]`,
    );
    await clickElement(serverUrl, mainSessionId, chooseLogButton);
    markStep(steps, 'Open real Windows file picker', 'PASS');

    pickerSessionId = await createSession(serverUrl, {
      platformName: 'windows',
      'appium:automationName': 'windows',
      'appium:app': 'Root',
      'appium:wadUrl': WAD_URL,
      'appium:newCommandTimeout': 180,
    });
    const pickerOpenSource = await waitUntil(async () => {
      const value = await source(serverUrl, pickerSessionId);
      return /打开|Open|#32770/.test(value) ? value : false;
    }, config.appiumCommandTimeoutMs, 'Windows file picker');
    await writeRunEvidence('file-picker-open.xml', pickerOpenSource);
    await screenshot(serverUrl, pickerSessionId, 'file-picker-open.png');
    markStep(steps, 'Inspect file picker tree', 'PASS', 'Native picker source captured.');

    const rssCrumb = await waitUntil(async () => {
      const values = await findElements(
        serverUrl,
        pickerSessionId,
        'xpath',
        `//Window[@ClassName='#32770']//*[@AutomationId=${xpathLiteral('41477')}]//SplitButton[3]`,
      );
      return values[0] ?? false;
    }, config.appiumCommandTimeoutMs, 'RSS breadcrumb');
    await clickElement(serverUrl, pickerSessionId, rssCrumb);
    await sleep(1000);
    const logFolder = await waitUntil(async () => {
      const values = await findElements(
        serverUrl,
        pickerSessionId,
        'xpath',
        `//Window[@ClassName='#32770']//*[@Name=${xpathLiteral('log')}]`,
      );
      return values[0] ?? false;
    }, config.appiumCommandTimeoutMs, 'car-log directory folder');
    await clickElement(serverUrl, pickerSessionId, logFolder);
    await sleep(2000);
    markStep(steps, 'Navigate to exact car-log directory', 'PASS', runConfig.carLogDirectory);
    await writeRunEvidence('file-picker-target-directory.xml', await source(serverUrl, pickerSessionId));
    await screenshot(serverUrl, pickerSessionId, 'file-picker-target-directory.png');

    const fileIds = [];
    for (const name of selectedNames) {
      const id = await waitUntil(async () => {
        const values = await findElements(serverUrl, pickerSessionId, 'xpath', `//*[@Name=${xpathLiteral(name)}]`);
        return values[0] ?? false;
      }, config.appiumCommandTimeoutMs, `file picker item ${name}`);
      fileIds.push(id);
    }
    await clickElement(serverUrl, pickerSessionId, fileIds[0]);
    await sendKeyValues(serverUrl, pickerSessionId, ['\uE009']);
    for (const id of fileIds.slice(1)) await clickElement(serverUrl, pickerSessionId, id);
    await sendKeyValues(serverUrl, pickerSessionId, ['\uE009']);
    const selectedSource = await source(serverUrl, pickerSessionId);
    await writeRunEvidence('file-picker-selected.xml', selectedSource);
    await screenshot(serverUrl, pickerSessionId, 'file-picker-selected.png');
    selectedFiles = selectedNames.filter((name) => selectedSource.includes(`Name=${JSON.stringify(name)}`) || selectedSource.includes(`Name="${name}"`));
    if (selectedFiles.length < 3) {
      throw Object.assign(new Error(`ERROR_LOCATOR: picker selection evidence contains only ${selectedFiles.length} of ${selectedNames.length} expected names.`), { classification: 'ERROR_LOCATOR' });
    }
    markStep(steps, 'Select at least three ZIPs with real picker multi-selection', 'PASS', selectedFiles.join(', '));

    const openButton = await findElement(serverUrl, pickerSessionId, 'xpath', `//Button[@Name=${xpathLiteral('打开')} or @Name=${xpathLiteral('Open')}]`);
    await clickElement(serverUrl, pickerSessionId, openButton);
    markStep(steps, 'Click 打开', 'PASS');
    await deleteSession(serverUrl, pickerSessionId);
    pickerSessionId = null;

    const selectedText = await waitForText(serverUrl, mainSessionId, 'accessibility id', 'LogFileTextBox', '已选择', config.appiumCommandTimeoutMs);
    actual.pendingSelectionText = selectedText.text;
    markStep(steps, 'Observe product pending selection', 'PASS', selectedText.text);

    const packageName = await findElement(serverUrl, mainSessionId, 'accessibility id', 'PackageNameTextBox');
    await clearElement(serverUrl, mainSessionId, packageName);
    await setElementValue(serverUrl, mainSessionId, packageName, runConfig.packageName ?? 'phase3b-run-carlog');
    const confirm = await findElement(serverUrl, mainSessionId, 'xpath', `//Edit[@AutomationId=${xpathLiteral('PackageNameTextBox')}]/ancestor::Grid[1]//Button[@Name=${xpathLiteral('确定')}]`);
    await clickElement(serverUrl, mainSessionId, confirm);
    markStep(steps, 'Enter package name and confirm import', 'PASS', runConfig.packageName ?? 'phase3b-run-carlog');

    const afterImport = await waitUntil(async () => {
      const value = await source(serverUrl, mainSessionId);
      return value.includes('导入完成') && value.includes('AutomationId="CurrentPackageSummaryText"') ? value : false;
    }, config.appiumCommandTimeoutMs * 2, 'completed import state');
    await writeRunEvidence('analysis-after-import.xml', afterImport);
    await screenshot(serverUrl, mainSessionId, 'after-import.png');
    const statusElement = await findElement(serverUrl, mainSessionId, 'accessibility id', 'ImportStatusText');
    const summaryElement = await findElement(serverUrl, mainSessionId, 'accessibility id', 'CurrentPackageSummaryText');
    const validElement = await findElement(serverUrl, mainSessionId, 'accessibility id', 'ValidRecordSummaryText');
    const rangeElement = await findElement(serverUrl, mainSessionId, 'accessibility id', 'TimeRangeSummaryText');
    actual.importStatus = await elementText(serverUrl, mainSessionId, statusElement);
    actual.packageSummary = await elementText(serverUrl, mainSessionId, summaryElement);
    actual.validRecordSummary = await elementText(serverUrl, mainSessionId, validElement);
    actual.timeRangeSummary = await elementText(serverUrl, mainSessionId, rangeElement);
    actual.importStatusAttribute = await elementAttribute(serverUrl, mainSessionId, statusElement, 'Name').catch(() => null);
    const detailedCompletion = /导入完成：有效 \d+ 条，跳过 \d+ 条，警告 \d+ 条。/.test(actual.importStatus);
    const observableSuccess = actual.packageSummary !== '-' && actual.timeRangeSummary !== '-' && actual.importStatus.includes('导入完成');
    if (!observableSuccess) {
      status = 'FAIL';
      reason = `FAIL: import completed without the expected observable summary/status. Actual=${JSON.stringify(actual)}`;
    } else if (!detailedCompletion) {
      status = 'FAIL';
      reason = `FAIL: product shows completion but not the design-confirmed MSG-003 count text. Actual ImportStatusText=${JSON.stringify(actual.importStatus)}; other state=${JSON.stringify(actual)}`;
    } else {
      status = 'PASS';
      reason = '';
    }
    markStep(steps, 'Verify design-defined completion and Analysis state', status, JSON.stringify(actual));
    return { status, reason, steps, pids, selectedFiles, actual, sessionId: mainSessionId };
  } catch (error) {
    status = error.classification ?? (/Element not found|picker|locator/i.test(error.message) ? 'ERROR_LOCATOR' : 'ERROR');
    reason = error.stack ?? error.message;
    markStep(steps, 'Abort at first non-recoverable error', status, error.message);
    return { status, reason, steps, pids, selectedFiles, actual, sessionId: mainSessionId };
  } finally {
    captureOwnedProductProcesses(ownedProduct);
    await deleteSession(serverUrl, pickerSessionId);
    await deleteSession(serverUrl, mainSessionId);
    await stopOwnedProduct(ownedProduct);
    await stopProcessTree(appiumHandle);
    await stopProcessTree(wadHandle);
  }
}
