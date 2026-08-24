import { resolve } from 'node:path';
import { freezeHandoffIntegrity, verifyHandoffIntegrity } from './handoff-integrity.mjs';

const packageRoot = process.argv[2];
if (!packageRoot) {
  console.error('Usage: node scripts/platform/freeze-handoff-integrity.mjs <handoff-package>');
  process.exit(2);
}

const result = await freezeHandoffIntegrity(resolve(packageRoot));
const verification = await verifyHandoffIntegrity(resolve(packageRoot));
console.log(JSON.stringify({ ...result, verification }, null, 2));
if (verification.status !== 'PASS') process.exitCode = 1;
