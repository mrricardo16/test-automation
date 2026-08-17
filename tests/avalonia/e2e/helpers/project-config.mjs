import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const helperDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(helperDirectory, '../../../..');

export function loadProjectConfig() {
  const configDirectory = path.join(repositoryRoot, 'config');
  const localPath = path.join(configDirectory, 'local-projects.json');
  const examplePath = path.join(configDirectory, 'local-projects.example.json');
  const selectedPath = fs.existsSync(localPath) ? localPath : examplePath;
  const project = JSON.parse(fs.readFileSync(selectedPath, 'utf8'));
  const executablePath = path.join(project.runtimeDirectory, 'HZ.LogClient.exe');

  if (!fs.existsSync(executablePath)) {
    throw new Error(`The scanned real executable was not found: ${executablePath}`);
  }

  return {
    ...project,
    executablePath,
    appiumPort: Number(process.env.APPium_PORT ?? 4723),
    appiumLaunchTimeoutMs: Number(process.env.APPIUM_LAUNCH_TIMEOUT_MS ?? 30000),
    appiumCommandTimeoutMs: Number(process.env.APPIUM_COMMAND_TIMEOUT_MS ?? 30000),
  };
}
