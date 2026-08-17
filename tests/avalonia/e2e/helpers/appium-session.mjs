import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { spawn } from 'node:child_process';
import { loadProjectConfig } from './project-config.mjs';
import { startOwnedProduct, stopOwnedProduct } from './real-app-process.mjs';
import { evidenceDirectory, writeEvidence } from './evidence.mjs';

const execFileAsync = promisify(execFile);

function findWinAppDriver() {
  const candidates = [
    process.env.APPIUM_WAD_PATH,
    `${process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'}\\Windows Application Driver\\WinAppDriver.exe`,
    `${process.env.ProgramFiles ?? 'C:\\Program Files'}\\Windows Application Driver\\WinAppDriver.exe`,
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForStatus(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'status endpoint did not respond';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      lastError = `status HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(250);
  }
  throw new Error(`Appium server did not become ready: ${lastError}`);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  });
  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }
  if (!response.ok) {
    const error = new Error(`Appium HTTP ${response.status}: ${bodyText}`);
    error.httpStatus = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function startAppiumServer(config) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', `npx appium --port ${config.appiumPort} --log-level info`]
    : ['appium', '--port', String(config.appiumPort), '--log-level', 'info'];
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  const logStream = fs.createWriteStream(path.join(evidenceDirectory, 'appium-server.log'), { flags: 'a' });
  const server = spawn(command, args, { cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);
  server.once('exit', () => logStream.end());
  return server;
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    await execFileAsync('taskkill.exe', ['/PID', String(processHandle.pid), '/T', '/F']).catch(() => {});
    return;
  }
  processHandle.kill();
  await new Promise((resolve) => processHandle.once('exit', resolve));
}

async function returnProbeResult(result) {
  await writeEvidence('environment-probe.json', JSON.stringify(result, null, 2));
  return result;
}

export async function runEnvironmentProbe() {
  const config = loadProjectConfig();
  const server = startAppiumServer(config);
  let ownedProduct;
  let sessionId;
  try {
    const status = await waitForStatus(`http://127.0.0.1:${config.appiumPort}/status`, config.appiumLaunchTimeoutMs);
    await writeEvidence('appium-status.json', JSON.stringify(status, null, 2));

    const winAppDriverPath = findWinAppDriver();
    if (!winAppDriverPath) {
      return returnProbeResult({
        status: 'BLOCKED',
        reason: 'Microsoft WinAppDriver.exe is not installed or not discoverable in the official default paths.',
        appiumServerReady: true,
        sessionId: null,
        pageSource: '',
      });
    }

    ownedProduct = startOwnedProduct(config.executablePath, config.runtimeDirectory);
    const session = await requestJson(`http://127.0.0.1:${config.appiumPort}/session`, {
      method: 'POST',
      body: JSON.stringify({
        capabilities: {
          alwaysMatch: {
            platformName: 'windows',
            'appium:automationName': 'windows',
            'appium:app': config.executablePath,
            'appium:appWorkingDir': config.runtimeDirectory,
            'appium:createSessionTimeout': config.appiumLaunchTimeoutMs,
            'appium:newCommandTimeout': 120,
          },
          firstMatch: [{}],
        },
      }),
    });
    sessionId = session.value?.sessionId ?? session.sessionId;
    if (!sessionId) {
      throw new Error(`Appium session response did not contain a session id: ${JSON.stringify(session)}`);
    }

    const source = await requestJson(`http://127.0.0.1:${config.appiumPort}/session/${sessionId}/source`);
    const pageSource = source.value ?? source;
    await writeEvidence('appium-page-source-initial.xml', String(pageSource));
    const handles = await requestJson(`http://127.0.0.1:${config.appiumPort}/session/${sessionId}/window/handles`);
    return returnProbeResult({ status: 'PASS', reason: '', appiumServerReady: true, sessionId, pageSource, handles });
  } catch (error) {
    const isBackendMissing = /WinAppDriver|WAD|not found|not installed/i.test(error.message);
    return returnProbeResult({
      status: isBackendMissing ? 'BLOCKED' : 'ERROR',
      reason: error.stack ?? error.message,
      appiumServerReady: true,
      sessionId,
      pageSource: '',
    });
  } finally {
    if (sessionId) {
      await requestJson(`http://127.0.0.1:${config.appiumPort}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
    stopOwnedProduct(ownedProduct);
    await stopProcess(server);
  }
}
