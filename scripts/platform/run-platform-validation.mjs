import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const requiredFiles = [
  'tsconfig.platform.json',
  'eslint.config.mjs',
  'contracts/schemas/execution-result.schema.json',
  'contracts/schemas/evidence-index.schema.json',
  'contracts/schemas/environment-profile.schema.json',
  'contracts/schemas/testcase.schema.json',
  'contracts/schemas/scenario-suite.schema.json',
  'contracts/schemas/expectation-gap.schema.json',
  'contracts/testcase-contract.md',
  'contracts/testcase-generation-standard.md',
  'contracts/testcase-design-quality-standard.md',
  'contracts/generic-blackbox-testcase-generation-standard.md',
  'contracts/composite-testcase-standard.md',
  'contracts/generic-stable-testcase-id-standard.md',
  'config/environments.example.json',
  'scripts/platform/contract-types.ts',
  'scripts/platform/validate-contracts.ts',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-classification.json',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/render-modular-testcase-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-modular-testcase-report.mjs',
  'projects/rsscomposer-blackbox/scripts/design-quality-audit.mjs',
  'projects/rsscomposer-blackbox/scripts/render-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/fine-grained-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/apply-generic-blackbox-policy.mjs',
  'projects/rsscomposer-blackbox/scripts/stable-testcase-id.mjs',
  'projects/rsscomposer-blackbox/scripts/migrate-stable-testcase-ids.mjs',
  'scripts/platform/testcase-id-validator.mjs',
  'scripts/platform/testcase-id-validator.test.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/render-final-test-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-final-test-report.mjs',
  'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.test.mjs',
  'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.test.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-fine-grained-catalog.mjs',
  'projects/rsscomposer-blackbox/test-cases/catalog/feature-code-registry.json',
  'projects/rsscomposer-blackbox/test-cases/catalog/testcase-id-registry.json',
  'projects/rsscomposer-blackbox/test-cases/catalog/TESTCASE_ID_MIGRATION_MAP.json',
  'projects/rsscomposer-blackbox/test-cases/catalog/TESTCASE_ID_MIGRATION_RECONCILIATION.json',
  'scripts/platform/markdown-table-validator.mjs',
  'scripts/platform/markdown-table-validator.test.mjs',
  'scripts/platform/final-markdown-rendering-validator.mjs',
  'scripts/platform/final-markdown-rendering-validator.test.mjs',
  'scripts/platform/install-typora-report-theme.mjs',
  'tests/api/synthetic/api-fixtures.ts',
  'docs/web-test-report-template.md',
  'docs/最终测试报告模板.md',
  'docs/generic-blackbox-test-report-template.md',
  'docs/generic-typora-report.css',
  'test-cases/README.md',
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(repoRoot, relativePath))) throw new Error(`Required platform file is missing: ${relativePath}`);
}

const utf8Paths = [
  ...requiredFiles,
  'scripts/platform/agent-acceptance-procedure.mjs',
  'scripts/platform/validate-agent-acceptance-procedure.mjs',
  'scripts/platform/verify-negative-types.mjs',
  'scripts/platform/run-skill-tests.mjs',
  'scripts/platform/run-platform-validation.mjs',
  'scripts/platform/run-platform-tests.mjs',
  'scripts/platform/run-platform-quality.mjs',
  'scripts/platform/report-governance.mjs',
  'scripts/platform/load-environment.ts',
  'scripts/platform/flaky-policy.ts',
  'scripts/platform/aggregate-results.ts',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-classification.json',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/render-modular-testcase-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-modular-testcase-report.mjs',
  'projects/rsscomposer-blackbox/scripts/design-quality-audit.mjs',
  'projects/rsscomposer-blackbox/scripts/render-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/fine-grained-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/apply-generic-blackbox-policy.mjs',
  'projects/rsscomposer-blackbox/scripts/stable-testcase-id.mjs',
  'projects/rsscomposer-blackbox/scripts/migrate-stable-testcase-ids.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/render-final-test-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-final-test-report.mjs',
  'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.test.mjs',
  'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.test.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-fine-grained-catalog.mjs',
  'scripts/platform/testcase-id-validator.mjs',
  'scripts/platform/testcase-id-validator.test.mjs',
  'scripts/platform/markdown-table-validator.mjs',
  'scripts/platform/final-markdown-rendering-validator.mjs',
  'scripts/platform/final-markdown-rendering-validator.test.mjs',
  'scripts/platform/install-typora-report-theme.mjs',
  'scripts/platform/markdown-table-validator.test.mjs',
  'docs/最终测试报告模板.md',
  'contracts/generic-blackbox-testcase-generation-standard.md',
  'contracts/generic-stable-testcase-id-standard.md',
  'docs/generic-blackbox-test-report-template.md',
  'docs/generic-typora-report.css',
  'scripts/platform/generic-blackbox-policy.mjs',
  'scripts/platform/generic-blackbox-policy.test.mjs',
];
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
for (const relativePath of utf8Paths) strictUtf8.decode(readFileSync(resolve(repoRoot, relativePath)));
console.log('UTF8_SCAN=PASS');

for (const relativePath of [
  'contracts/schemas/execution-result.schema.json',
  'contracts/schemas/evidence-index.schema.json',
  'contracts/schemas/environment-profile.schema.json',
  'contracts/schemas/testcase.schema.json',
  'contracts/schemas/scenario-suite.schema.json',
  'contracts/schemas/expectation-gap.schema.json',
  'config/environments.example.json',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-classification.json',
]) {
  JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8'));
}
console.log('SCHEMA_PARSE=PASS');

const executablePaths = [
  'scripts/platform/run-skill-tests.mjs',
  'scripts/platform/run-platform-validation.mjs',
  'scripts/platform/run-platform-tests.mjs',
  'scripts/platform/run-platform-quality.mjs',
  'scripts/platform/report-governance.mjs',
  'scripts/platform/verify-negative-types.mjs',
  'projects/rsscomposer-blackbox/scripts/design-quality-audit.mjs',
  'projects/rsscomposer-blackbox/scripts/render-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-design-quality-preview.mjs',
  'projects/rsscomposer-blackbox/scripts/fine-grained-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/apply-generic-blackbox-policy.mjs',
  'projects/rsscomposer-blackbox/scripts/stable-testcase-id.mjs',
  'projects/rsscomposer-blackbox/scripts/migrate-stable-testcase-ids.mjs',
  'projects/rsscomposer-blackbox/scripts/render-final-test-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-final-test-report.mjs',
  'scripts/platform/final-markdown-rendering-validator.mjs',
  'scripts/platform/install-typora-report-theme.mjs',
  'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-blackbox-standard-rebuild.mjs',
  'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-fine-grained-catalog.mjs',
  'scripts/platform/testcase-id-validator.mjs',
  'scripts/platform/generic-blackbox-policy.mjs',
  'scripts/platform/markdown-table-validator.mjs',
  'projects/rsscomposer-blackbox/scripts/modular-testcase-catalog.mjs',
  'projects/rsscomposer-blackbox/scripts/render-modular-testcase-report.mjs',
  'projects/rsscomposer-blackbox/scripts/validate-modular-testcase-report.mjs',
  'tests/api/synthetic/api-fixtures.ts',
  'tests/api/synthetic/helpers/api-evidence.ts',
];
const forbidden = [
  'config/' + 'local-projects.json',
  'localhost:' + '8223',
  'D:\\' + 'HZ_RSS40',
  'E:\\' + 'logclient',
  'HZ.' + 'LogClient.dll',
  'task' + 'kill',
  '/' + 'IM',
  'kill' + 'all',
];
for (const relativePath of executablePaths) {
  const content = readFileSync(resolve(repoRoot, relativePath), 'utf8');
  for (const literal of forbidden) if (content.includes(literal)) throw new Error(`Forbidden executable reference ${literal} in ${relativePath}`);
  if (/process\.kill\s*\(\s*-1/.test(content)) throw new Error(`Broad process kill in ${relativePath}`);
}
console.log('EXECUTABLE_SAFETY_SCAN=PASS');

const procedure = spawnSync(process.execPath, ['scripts/platform/validate-agent-acceptance-procedure.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (procedure.status !== 0) process.exit(procedure.status ?? 1);
console.log('STATIC_PLATFORM_VALIDATION=PASS');

const blackboxStandardRebuildTests = spawnSync(process.execPath, ['--test', 'projects/rsscomposer-blackbox/scripts/blackbox-standard-rebuild.test.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (blackboxStandardRebuildTests.status !== 0) process.exit(blackboxStandardRebuildTests.status ?? 1);
process.stdout.write(blackboxStandardRebuildTests.stdout);

const genericBlackboxPolicyTests = spawnSync(process.execPath, ['--test', 'scripts/platform/generic-blackbox-policy.test.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (genericBlackboxPolicyTests.status !== 0) process.exit(genericBlackboxPolicyTests.status ?? 1);
process.stdout.write(genericBlackboxPolicyTests.stdout);

const stableTestCaseIdTests = spawnSync(process.execPath, ['--test', 'scripts/platform/testcase-id-validator.test.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (stableTestCaseIdTests.status !== 0) process.exit(stableTestCaseIdTests.status ?? 1);
process.stdout.write(stableTestCaseIdTests.stdout);

const blackboxStandardRebuildValidation = spawnSync(process.execPath, ['projects/rsscomposer-blackbox/scripts/validate-blackbox-standard-rebuild.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (blackboxStandardRebuildValidation.status !== 0) process.exit(blackboxStandardRebuildValidation.status ?? 1);
process.stdout.write(blackboxStandardRebuildValidation.stdout);

const materializationTests = spawnSync(process.execPath, ['--test', 'projects/rsscomposer-blackbox/scripts/materialize-fine-grained-catalog.test.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (materializationTests.status !== 0) process.exit(materializationTests.status ?? 1);
process.stdout.write(materializationTests.stdout);

const materializedCatalog = spawnSync(process.execPath, ['projects/rsscomposer-blackbox/scripts/validate-fine-grained-catalog.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (materializedCatalog.status !== 0) process.exit(materializedCatalog.status ?? 1);
process.stdout.write(materializedCatalog.stdout);

const modularReport = spawnSync(process.execPath, ['projects/rsscomposer-blackbox/scripts/validate-modular-testcase-report.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (modularReport.status !== 0) process.exit(modularReport.status ?? 1);
process.stdout.write(modularReport.stdout);

const qualityPreview = spawnSync(process.execPath, ['projects/rsscomposer-blackbox/scripts/validate-design-quality-preview.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (qualityPreview.status !== 0) process.exit(qualityPreview.status ?? 1);
process.stdout.write(qualityPreview.stdout);

const finalReport = spawnSync(process.execPath, ['projects/rsscomposer-blackbox/scripts/validate-final-test-report.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (finalReport.status !== 0) process.exit(finalReport.status ?? 1);
process.stdout.write(finalReport.stdout);

const finalMarkdownRendering = spawnSync(process.execPath, ['--test', 'scripts/platform/final-markdown-rendering-validator.test.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (finalMarkdownRendering.status !== 0) process.exit(finalMarkdownRendering.status ?? 1);
process.stdout.write(finalMarkdownRendering.stdout);

const markdownTables = spawnSync(process.execPath, ['scripts/platform/markdown-table-validator.mjs', 'projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.md', 'docs/最终测试报告模板.md', 'docs/generic-blackbox-test-report-template.md'], { cwd: repoRoot, encoding: 'utf8' });
if (markdownTables.status !== 0) process.exit(markdownTables.status ?? 1);
process.stdout.write(markdownTables.stdout);
