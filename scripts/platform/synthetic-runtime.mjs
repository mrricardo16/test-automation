import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(scriptDirectory, '../../fixtures/synthetic-product/backend/server.mjs');

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function waitForExit(child, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) reject(new Error(`Synthetic runtime PID ${child.pid} did not exit within ${timeoutMs}ms.`));
    }, timeoutMs);
    child.once('exit', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ code, signal });
    });
  });
}

export async function startSyntheticRuntime({ host = '127.0.0.1', port = 0 } = {}) {
  if (!existsSync(serverPath)) throw new Error(`Synthetic server not found: ${serverPath}`);

  const child = spawn(process.execPath, [serverPath, '--host', host, '--port', String(port)], {
    cwd: resolve(scriptDirectory, '../..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, SYNTHETIC_PRODUCT_RUNTIME: '1' },
  });

  if (!child.pid) throw new Error('Synthetic runtime child PID was not assigned.');
  const pid = child.pid;
  let stderr = '';
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolvePromise, reject) => {
    readyResolve = resolvePromise;
    readyReject = reject;
  });
  let settled = false;
  const timeout = setTimeout(() => readyReject(new Error(`Synthetic runtime PID ${pid} did not become ready.`)), 10_000);

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    for (const line of chunk.split(/\r?\n/)) {
      if (!line.startsWith('SYNTHETIC_RUNTIME_READY ')) continue;
      try {
        readyResolve(JSON.parse(line.slice('SYNTHETIC_RUNTIME_READY '.length)));
      } catch {
        readyReject(new Error('Synthetic runtime emitted invalid readiness JSON.'));
      }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('error', (error) => readyReject(error));
  child.once('exit', (code, signal) => {
    if (!settled) readyReject(new Error(`Synthetic runtime exited before ready: code=${code}, signal=${signal}, stderr=${stderr}`));
  });

  let readyInfo;
  try {
    readyInfo = await ready;
  } catch (error) {
    clearTimeout(timeout);
    if (isProcessAlive(pid)) child.kill();
    throw error;
  }
  clearTimeout(timeout);
  settled = true;
  const baseUrl = `http://${host}:${readyInfo.port}`;
  let closed = false;
  const handle = {
    pid,
    baseUrl,
    apiBaseUrl: `${baseUrl}/api`,
    ownedProcess: true,
    shutdownVerified: false,
    async close() {
      if (closed) return;
      closed = true;
      if (isProcessAlive(pid)) child.kill('SIGTERM');
      await waitForExit(child, 5_000);
      if (isProcessAlive(pid)) throw new Error(`Synthetic runtime PID ${pid} is still alive after shutdown.`);
      handle.shutdownVerified = true;
    },
  };
  return handle;
}
