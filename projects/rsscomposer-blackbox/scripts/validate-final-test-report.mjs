import { validateFineGrainedCatalog } from './validate-fine-grained-catalog.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFinalMarkdownRendering } from '../../../scripts/platform/final-markdown-rendering-validator.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const issues = validateFineGrainedCatalog();
const rendering = validateFinalMarkdownRendering();
if (issues.length > 0 || !rendering.Pass) {
  if (issues.length > 0) process.stderr.write(`${JSON.stringify(issues, null, 2)}\n`);
  if (!rendering.Pass) process.stderr.write(`${JSON.stringify(rendering, null, 2)}\n`);
  process.exitCode = 1;
} else {
  const catalog = JSON.parse(fs.readFileSync(path.join(projectDirectory, 'test-cases', 'catalog', 'fine-grained-catalog.json'), 'utf8'));
  const history = JSON.parse(fs.readFileSync(path.join(projectDirectory, 'test-cases', 'catalog', 'historical-traceability.json'), 'utf8'));
  process.stdout.write(`FINAL_DELIVERABLE_REPORT_VALIDATION=PASS (${catalog.TestCases.length} fine-grained cases, ${history.HistoricalTestCases.length} historical cases, 9-column Markdown)\n`);
}
