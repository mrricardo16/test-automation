import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const python = spawnSync('python', ['--version'], { cwd: repoRoot, stdio: 'ignore' }).status === 0 ? 'python' : 'python3';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(python, ['skills/dev-test-handoff/scripts/self_test.py']);
run(python, ['skills/test-execution/scripts/self_test.py']);
run(python, ['skills/test-execution/scripts/validate_contract.py']);
run(python, ['skills/whitebox-test-execution/scripts/self_test.py']);
run(python, ['skills/whitebox-test-execution/scripts/validate_contract.py']);
console.log('SKILL_COMMANDS=PASS');
