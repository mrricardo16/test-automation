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
    startedAt: new Date().toISOString(),
  };
}

export function stopOwnedProduct(ownedProcess) {
  if (!ownedProcess?.pid) {
    return;
  }

  try {
    process.kill(ownedProcess.pid);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}
