import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSelfContainedHtmlReport } from '../../../scripts/platform/self-contained-html-report-validator.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const markdownPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.md');
const htmlPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.html');
const validationPath = `${htmlPath}.validation.json`;
const result = validateSelfContainedHtmlReport({ htmlPath, markdownPath });
fs.writeFileSync(validationPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
if (result.Status !== 'PASS') { process.stderr.write(`${JSON.stringify(result, null, 2)}\n`); process.exitCode = 1; }
else process.stdout.write(`SELF_CONTAINED_HTML_EXPORTER_STATUS=PASS (ExternalResources=0, NineColumnMainTable=Yes, LocalHorizontalScroll=Yes, PageHorizontalScroll=No, SemanticChanges=0, FormalBusinessCasesExecuted=No)\n`);
