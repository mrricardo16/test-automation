import { execFileSync, spawn } from 'node:child_process';

function existingProductProcesses() {
  const script = "Get-CimInstance Win32_Process -Filter \"Name='HZ.LogClient.exe'\" | Select-Object ProcessId,ExecutablePath | ConvertTo-Json -Compress";
  const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

  if (!output) {
    return [];
  }

  const parsed = JSON.parse(output);
  return (Array.isArray(parsed) ? parsed : [parsed]).map((process) => ({
    pid: Number(process.ProcessId),
    executablePath: process.ExecutablePath ?? '',
  }));
}

export function startOwnedProduct(executablePath, workingDirectory) {
  const existing = existingProductProcesses();
  if (existing.length > 0) {
    throw new Error(`BLOCKED: an existing HZ.LogClient.exe process was detected: ${JSON.stringify(existing)}`);
  }

  const child = spawn(executablePath, [], {
    cwd: workingDirectory,
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    child,
    pid: child.pid,
    executablePath,
    pids: [child.pid],
    startedAt: new Date().toISOString(),
  };
}

export function captureOwnedProductProcesses(ownedProcess) {
  if (!ownedProcess?.executablePath) return;
  const current = existingProductProcesses()
    .filter((process) => process.executablePath.toLowerCase() === ownedProcess.executablePath.toLowerCase())
    .map((process) => process.pid);
  ownedProcess.pids = [...new Set([...(ownedProcess.pids ?? []), ...current])];
}

export async function stopOwnedProduct(ownedProcess) {
  if (!ownedProcess?.pid && !ownedProcess?.executablePath) {
    return;
  }

  try {
    const pids = [...new Set([...(ownedProcess.pids ?? []), ownedProcess.pid].filter(Boolean))];
    if (process.platform === 'win32') {
      for (const pid of pids) {
        try {
          execFileSync('taskkill.exe', ['/PID', String(Number(pid)), '/T', '/F'], { stdio: 'ignore' });
        } catch (error) {
          if (error.status !== 128) {
            throw error;
          }
        }
      }
    } else {
      for (const pid of pids) process.kill(pid);
    }
  } catch (error) {
    if (error.code !== 'ESRCH' && error.code !== 'ERROR_NOT_FOUND' && error.code !== 'ETIMEDOUT') {
      throw error;
    }
  }
}
