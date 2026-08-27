import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportSelfContainedHtml } from '../../../scripts/platform/self-contained-html-report-exporter.mjs';
import { validateSelfContainedHtmlReport } from '../../../scripts/platform/self-contained-html-report-validator.mjs';
import fs from 'node:fs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(projectDirectory, '..', '..');
const markdownPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.md');
const outputPath = path.join(projectDirectory, 'reports', 'RSSComposer调度系统测试报告.html');
const validationPath = `${outputPath}.validation.json`;
const result = exportSelfContainedHtml({ markdownPath, cssPath: path.join(repositoryDirectory, 'docs', 'generic-self-contained-html-report.css'), outputPath });
const validation = validateSelfContainedHtmlReport({ htmlPath: outputPath, markdownPath });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');
if (validation.Status !== 'PASS') { process.stderr.write(`${JSON.stringify(validation, null, 2)}\n`); process.exitCode = 1; }
else process.stdout.write(`SELF_CONTAINED_HTML_EXPORT=PASS (${path.relative(repositoryDirectory, markdownPath)}, EmbeddedImageCount=${result.metrics.EmbeddedImageCount}, HtmlBytes=${result.metrics.HtmlBytes}, PortableSingleFile=Yes)\n`);
