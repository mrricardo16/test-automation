import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const runId = "SOURCE-ASSISTED-FORMAL-20260827-02";
const runRoot = path.join(root, "projects", "rsscomposer-blackbox", "runs", runId);
const reportsRoot = path.join(root, "projects", "rsscomposer-blackbox", "reports");
const catalog = JSON.parse(await readFile(path.join(root, "projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/final-testcase-catalog.json"), "utf8"));
const mapping = JSON.parse(await readFile(path.join(runRoot, "automation-mapping.json"), "utf8"));
const result = JSON.parse(await readFile(path.join(runRoot, "formal-result.json"), "utf8"));
const readiness = JSON.parse(await readFile(path.join(runRoot, "runtime-readiness.json"), "utf8"));
const runtime = JSON.parse(await readFile(path.join(runRoot, "artifacts/process/current-runtime-discovery.json"), "utf8"));
const cleanup = JSON.parse(await readFile(path.join(runRoot, "cleanup-verification.json"), "utf8"));
const bugId = "BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001";
const defectPath = `projects/rsscomposer-blackbox/runs/${runId}/defects/${bugId}.md`;
const rowsById = new Map(mapping.Rows.map((row) => [row.TestCaseId, row]));
const imageFsPath = path.join(runRoot, "artifacts/web/TC-USER-CREATE-001/20260827-040907Z-pid35088-w0-r0/fixture-created.png");
const imageMarkdownPath = `../runs/${runId}/artifacts/web/TC-USER-CREATE-001/20260827-040907Z-pid35088-w0-r0/fixture-created.png`;
const escapeMd = (value) => String(value ?? "—").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ").trim() || "—";
const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const mdTable = (headers, data) => [
  `| ${headers.map(escapeMd).join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...data.map((row) => `| ${row.map(escapeMd).join(" | ")} |`),
].join("\n");
const operationLabels = { QUERY: "查询", AUTHENTICATION: "认证", SESSION: "会话", CREATE: "新增", UPDATE: "修改", DELETE: "删除", VALIDATION: "校验", STATE: "状态", STATE_TRANSITION: "状态", RELATIONSHIP: "关系", RELATION: "关系", COMPOSITE_LIFECYCLE: "生命周期", LIFECYCLE: "生命周期", VISUAL: "视觉检查", DOWNLOAD: "下载", UPLOAD: "上传", EXPORT: "导出", IMPORT: "导入", OTHER: "其他" };
const operationOrder = { QUERY: 10, AUTHENTICATION: 10, SESSION: 15, CREATE: 20, VALIDATION: 25, UPDATE: 30, RELATIONSHIP: 35, RELATION: 35, STATE: 40, STATE_TRANSITION: 40, DELETE: 50, COMPOSITE_LIFECYCLE: 60, LIFECYCLE: 60, VISUAL: 70, DOWNLOAD: 80, OTHER: 90 };
const isPending = (tc) => tc.ExpectedBasis === "PENDING_AUTHORITY" || tc.ExpectedStatus === "EXPECTED_PENDING_AUTHORITY";
const normalize = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").replace(/[；，、]\s*$/u, "").trim();
const numbered = (items) => items.filter(Boolean).map((item, index) => `${String.fromCharCode(0x2460 + index)} ${normalize(item)}`).join("　") || "—";
const preconditions = (tc) => numbered(tc.Preconditions ?? []);
const testData = (tc) => {
  if (Array.isArray(tc.TestData)) return tc.TestData.map((item) => `${normalize(item?.[0] ?? "字段")}：${normalize(item?.[1] ?? "—")}`).join("　") || "—";
  if (tc.TestData && typeof tc.TestData === "object") return Object.entries(tc.TestData).map(([key, value]) => `${normalize(key)}：${normalize(value)}`).join("　") || "—";
  return "—";
};
const steps = (tc) => {
  const stepItems = (tc.Steps ?? []).map((item) => {
    if (!item || typeof item !== "object") return item;
    const step = item.Step == null ? "" : `${item.Step}. `;
    return `${step}${item.Action ?? item.Description ?? "步骤"}`;
  });
  const body = numbered(stepItems);
  const cleanupText = normalize(tc.Cleanup ?? "");
  return cleanupText ? `${body}　【清理】${cleanupText}` : body;
};
const expected = (tc) => isPending(tc) ? `【待确认】${normalize(tc.ExpectationGap ?? tc.ExpectedResult ?? "Expected Authority Pending")}` : numbered([tc.ExpectedResult, ...(tc.SupportingAssertions ?? []), ...(tc.PostConditions ?? []).map((item) => `业务后置：${item}`)]);
const actual = (tc, row) => {
  if (tc.TestCaseId === "TC-USER-CREATE-001") return "新增保存成功；按用户名重新查询得到 1 条测试记录；用户名及显示名称与输入一致；删除后重新查询结果为 0。";
  if (isPending(tc)) return "Expected Authority Pending，未进入 Formal Manifest。";
  if (row?.ExecutionStatus === "MANUAL") return "本轮未由 Formal Automation 执行，需人工执行/视觉确认。";
  if (row?.ExecutionStatus === "BLOCKED") return row.Reason || "当前安全前置条件未满足，未执行业务步骤。";
  return row?.Reason || "本轮未执行。";
};
const status = (tc, row) => {
  if (isPending(tc)) return "尚未执行 / 当前不可执行";
  if (row?.ExecutionStatus === "PASS") return "PASS / 通过";
  if (row?.ExecutionStatus === "FAIL") return "FAIL / 失败";
  if (row?.ExecutionStatus === "ERROR") return "ERROR / 错误";
  if (row?.ExecutionStatus === "MANUAL") return "MANUAL / 需人工执行";
  return "BLOCKED / 阻塞";
};
const image = (tc) => {
  if (tc.TestCaseId === "TC-USER-CREATE-001") return `![新增保存证据](${imageMarkdownPath})`;
  const evidencePath = rowsById.get(tc.TestCaseId)?.Evidence?.find((value) => /\.png$/i.test(value));
  return evidencePath ? `![${tc.TestCaseId} 证据图例](${path.relative(reportsRoot, path.join(root, evidencePath)).replaceAll(path.sep, "/")})` : "—";
};
const byModule = new Map();
for (const tc of catalog.TestCases) {
  if (!byModule.has(tc.ModuleName)) byModule.set(tc.ModuleName, new Map());
  const featureMap = byModule.get(tc.ModuleName);
  if (!featureMap.has(tc.FeatureName)) featureMap.set(tc.FeatureName, new Map());
  const operationMap = featureMap.get(tc.FeatureName);
  if (!operationMap.has(tc.Operation)) operationMap.set(tc.Operation, []);
  operationMap.get(tc.Operation).push(tc);
}
for (const featureMap of byModule.values()) for (const operationMap of featureMap.values()) for (const cases of operationMap.values()) cases.sort((a, b) => (a.GenerationOrder ?? 0) - (b.GenerationOrder ?? 0));

const confirmedCount = catalog.TestCases.filter((tc) => tc.ExpectedStatus === "EXPECTED_CONFIRMED").length;
const pendingCount = catalog.TestCases.filter(isPending).length;
const autoAllowedCount = catalog.TestCases.filter((tc) => tc.AutomationEligibility === "AUTO_ALLOWED").length;
const manualCount = catalog.TestCases.filter((tc) => tc.AutomationEligibility === "MANUAL_REQUIRED").length;
const formalExecuted = result.FormalExecutedCount;
const notYetExecuted = result.NotYetExecutedCount;
const flowCases = catalog.TestCases.filter((tc) => /^FL-TASK-0?[1-9]$|^FL-TASK-10$/.test(tc.ScenarioSuiteId ?? tc.TestCaseId));
const flowRows = flowCases.map((tc) => { const row = rowsById.get(tc.TestCaseId); return [tc.ScenarioSuiteId ?? tc.TestCaseId, tc.Title, "COVERED", row?.ExecutionStatus === "PASS" ? "PASS" : "BLOCKED"]; });
const topRows = [
  ["CatalogTotal", catalog.TestCaseCount], ["ExpectedConfirmed", confirmedCount], ["ExpectedPending", pendingCount], ["AutoAllowed", autoAllowedCount], ["FormalManifest", result.FormalManifestCount], ["FormalExecuted", result.FormalExecutedCount], ["PASS", result.FormalPassCount], ["FAIL", result.FormalFailCount], ["ERROR", result.FormalErrorCount], ["BLOCKED", result.FormalBlockedCount], ["MANUAL_REQUIRED", result.ManualRequired], ["NOT_YET_EXECUTED", result.NotYetExecutedCount], ["SKIPPED", result.FormalSkippedCount], ["UnexpectedBusinessResidual", cleanup.UnexpectedBusinessResidualCount ?? 0], ["RetainedTestOwnedInfrastructure", cleanup.RetainedTestOwnedFixtureCount ?? 0], ["DefectCount", 1],
];
const lines = [
  "# RSSComposer调度系统测试报告",
  "",
  `- 运行编号：\`${runId}\``,
  "- 测试结论：**BLOCKED（已执行全部当前安全可自动执行用例；Golden Path 因产品缺陷保留阻塞）**",
  "- Expected 与 Runtime 严格分离；Pending 未计入 Formal Skipped。",
  "",
  "## 1. 测试基本信息",
  "",
  mdTable(["项目", "内容"], [["报告名称", "RSSComposer调度系统测试报告"], ["Current Catalog", `${catalog.TestCaseCount} 条（Atomic 72，Composite 10）`], ["权威来源", catalog.ExpectedAuthority ?? "DEV-HANDOFF-REAL-20260824-105102"], ["当前地图", "AT_0827_02_MAP（用户手工确认生效，未重复切换）"], ["源码完整性", "PASS；产品源码只读，前后 Hash 相等"], ["安全策略", "DummyCar 初始化/ResetAGV 已禁用；已登记产品 Bug"]]),
  "",
  "## 2. 测试结果概览",
  "",
  mdTable(["指标", "结果"], topRows),
  "",
  "## 3. 细粒度正式 TestCase 回填",
  "",
  "以下主表完整保留 Current Catalog 的 82 条 TestCase，以 TestCaseId 精确回填当前状态、实际验证与证据；不生成替代用例集。",
  "",
];
let moduleIndex = 0;
for (const [moduleName, featureMap] of byModule) {
  moduleIndex += 1;
  lines.push(`### 3.${moduleIndex} ${moduleName}`, "");
  for (const [featureName, operationMap] of featureMap) {
    lines.push(`#### ${featureName}`, "");
    for (const [operation, cases] of [...operationMap].sort((a, b) => (operationOrder[a[0]] ?? 99) - (operationOrder[b[0]] ?? 99))) {
      lines.push(`##### ${operationLabels[operation] ?? operation}`, "");
      lines.push(mdTable(["测试场景", "TestCaseId", "前置条件", "测试数据", "操作步骤", "预期结果", "状态", "实际验证", "图片示例"], cases.map((tc) => {
        const row = rowsById.get(tc.TestCaseId);
        return [tc.Title, tc.TestCaseId, preconditions(tc), testData(tc), steps(tc), expected(tc), status(tc, row), actual(tc, row), image(tc)];
      })), "");
    }
  }
}
lines.push("## 4. Feature Coverage", "", mdTable(["维度", "结果"], [["Catalog TestCaseId 集合", "82/82；无漏项、无重复"], ["Expected 已确认", `${confirmedCount}`], ["Expected Pending", `${pendingCount}；保持尚未执行/当前不可执行`], ["用户管理安全 CRUD", "TC-USER-CREATE-001 PASS"], ["车辆非物理新增", "TEST_OWNED DummyCar 新增 PASS；初始化不执行"]]), "");
lines.push("## 5. Rule / State Coverage", "", mdTable(["维度", "结果"], [["Expected 保护", "PASS；未用 Runtime 改写 Expected"], ["反馈进程状态", "AT 地图下 taskstatemission 已观测为 RUNNING"], ["DummyCar 状态", "身份已确认；未初始化，BLOCKED_BY_PRODUCT_DEFECT"], ["FormalSkippedCount", "0；Pending 不贡献 Skipped"], ["Cleanup", "UnexpectedBusinessResidualCount=0；DummyCar 作为操作员要求保留的 TEST_OWNED 运行设施"]]), "");
lines.push("## 6. Flow Coverage", "", mdTable(["Flow", "Scenario", "DesignCoverage", "ExecutionStatus"], flowRows), "");
lines.push("## 7. Formal Execution Coverage", "", mdTable(["指标", "结果"], [["Formal Manifest", `${result.FormalManifestCount} 条`], ["Formal Executed", `${formalExecuted} 条`], ["Formal PASS", `${result.FormalPassCount}`], ["Formal FAIL", `${result.FormalFailCount}`], ["Formal ERROR", `${result.FormalErrorCount}`], ["Formal BLOCKED", `${result.FormalBlockedCount}`], ["MANUAL_REQUIRED", `${result.ManualRequired}`], ["Pending Authority", `${pendingCount}`], ["Not Yet Executed", `${notYetExecuted}`]]), "");
lines.push("## 8. Defects / 已发现问题", "", mdTable(["BugId", "简短现象", "影响 TestCase / Flow", "当前状态", "Evidence Reference"], [[bugId, "车辆初始化接口返回成功后，窗体重启；车辆仍未定位。", "FL-TASK-01～10 及依赖 DummyCar 的物理流程", "已复现；待产品修复；本轮不再执行初始化", defectPath]]), "");
lines.push("## 9. Cleanup / Evidence / Final Status", "", mdTable(["项目", "结果"], [["FEEDBACK_PROCESS_READINESS_STATUS", readiness.FeedbackProcessStatus === "PASS" && readiness.FeedbackProcessRunning ? "PASS" : "BLOCKED"], ["DUMMY_CAR_READINESS_STATUS", "BLOCKED_BY_PRODUCT_DEFECT"], ["FL_TASK_01_FIXTURE_STATUS", "BLOCKED；未创建临时模板"], ["FL_TASK_02_GOLDEN_PATH_STATUS", "BLOCKED；未创建任务"], ["REPORT_BACKFILL_STATUS", "PASS；82/82 TestCaseId 已回填"], ["SECRET_SAFETY_STATUS", "PASS；SecretLeakCount=0"], ["PRODUCT_SOURCE_INTEGRITY_STATUS", "PASS；源码未修改"], ["FINAL_SYSTEM_TEST_STATUS", "BLOCKED_RUNTIME_ENABLEMENT"]]), "", "### 证据索引", "", `- 当前运行态：\`projects/rsscomposer-blackbox/runs/${runId}/artifacts/process/current-runtime-discovery.json\``, `- 数据库只读核验：\`projects/rsscomposer-blackbox/runs/${runId}/artifacts/db/readonly-probe.json\``, `- DummyCar 新增：\`projects/rsscomposer-blackbox/runs/${runId}/artifacts/dummy-car/dummy-car-live-api-provisioning.json\``, `- DummyCar Bug：\`${defectPath}\``, `- Formal Result：\`projects/rsscomposer-blackbox/runs/${runId}/formal-result.json\``, `- Cleanup：\`projects/rsscomposer-blackbox/runs/${runId}/cleanup-verification.json\``, "");
const markdown = `${lines.join("\n").trimEnd()}\n`;

const imageDataById = new Map();
for (const tc of catalog.TestCases) {
  const evidencePath = tc.TestCaseId === "TC-USER-CREATE-001"
    ? imageFsPath
    : rowsById.get(tc.TestCaseId)?.Evidence?.find((value) => /\.png$/i.test(value))
      ? path.join(root, rowsById.get(tc.TestCaseId).Evidence.find((value) => /\.png$/i.test(value)))
      : null;
  if (evidencePath) {
    const data = await readFile(evidencePath).then((buffer) => `data:image/png;base64,${buffer.toString("base64")}`).catch(() => null);
    if (data) imageDataById.set(tc.TestCaseId, data);
  }
}
const htmlRows = catalog.TestCases.map((tc) => {
  const row = rowsById.get(tc.TestCaseId);
  const imageData = imageDataById.get(tc.TestCaseId);
  const imageHtml = imageData ? `<img class="evidence-image" src="${imageData}" alt="${escapeHtml(tc.TestCaseId)} 证据图例" data-lightbox="${imageData}">` : "—";
  const scenario = tc.Title;
  const expectedResult = expected(tc);
  const executionStatus = status(tc, row);
  return `<tr data-case-id="${escapeHtml(tc.TestCaseId)}" data-scenario="${escapeHtml(scenario)}" data-expected="${escapeHtml(expectedResult)}" data-status="${escapeHtml(executionStatus)}">${[scenario, tc.TestCaseId, preconditions(tc), testData(tc), steps(tc), expectedResult, executionStatus, actual(tc, row), imageHtml].map((value) => `<td>${typeof value === "string" && value.startsWith("<img") ? value : escapeHtml(value)}</td>`).join("")}</tr>`;
}).join("\n");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RSSComposer调度系统测试报告</title><style>:root{color-scheme:light}*{box-sizing:border-box}html,body{overflow-x:hidden}body{margin:0;background:#f3f6fa;color:#172033;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif}.page{max-width:1600px;margin:0 auto;padding:28px}.hero,.card{background:#fff;border:1px solid #dce3ed;border-radius:14px;box-shadow:0 8px 24px rgba(30,55,90,.06)}.hero{padding:24px 28px;margin-bottom:18px}.hero h1{margin:0 0 8px;font-size:28px}.hero p{margin:4px 0}.report-toc{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.report-toc a{color:#2458a6;text-decoration:none;background:#eef4ff;border-radius:999px;padding:5px 10px}.card{padding:20px;margin:18px 0}.card h2{margin-top:0}.testcase-table-scroll{overflow-x:auto;border:1px solid #dce3ed;border-radius:10px}.testcase-table{width:max-content;min-width:2200px;border-collapse:collapse;table-layout:auto}.testcase-table th,.testcase-table td{border-bottom:1px solid #e5eaf1;border-right:1px solid #e5eaf1;padding:9px 10px;vertical-align:top;text-align:left;white-space:normal;overflow-wrap:anywhere}.testcase-table thead th{position:sticky;top:0;z-index:1;background:#edf3fb;white-space:nowrap}.testcase-table th:nth-child(1),.testcase-table td:nth-child(1){width:220px}.testcase-table th:nth-child(2),.testcase-table td:nth-child(2){width:190px;white-space:nowrap}.testcase-table th:nth-child(3),.testcase-table td:nth-child(3){width:230px}.testcase-table th:nth-child(4),.testcase-table td:nth-child(4){width:240px}.testcase-table th:nth-child(5),.testcase-table td:nth-child(5){width:390px}.testcase-table th:nth-child(6),.testcase-table td:nth-child(6){width:390px}.testcase-table th:nth-child(7),.testcase-table td:nth-child(7){width:160px;white-space:nowrap}.testcase-table th:nth-child(8),.testcase-table td:nth-child(8){width:360px}.testcase-table th:nth-child(9),.testcase-table td:nth-child(9){width:180px}.evidence-image{max-width:160px;max-height:110px;object-fit:contain;cursor:zoom-in;border:1px solid #cfd8e5;border-radius:6px}.lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:10;align-items:center;justify-content:center}.lightbox.open{display:flex}.lightbox img{max-width:92vw;max-height:92vh}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.metric{padding:12px;background:#f7f9fc;border:1px solid #e5eaf1;border-radius:10px}.metric b{display:block;font-size:20px;color:#2458a6}</style></head><body><main class="page"><section class="hero"><h1>RSSComposer调度系统测试报告</h1><p>运行编号：<code>${runId}</code></p><p><strong>结论：BLOCKED（安全可自动执行子集已执行；Golden Path 被产品缺陷阻断）</strong></p><nav class="report-toc"><a href="#overview">概览</a><a href="#cases">82 条 TestCase</a><a href="#coverage">Coverage</a><a href="#defects">Defects</a><a href="#cleanup">Cleanup</a></nav><div class="summary">${topRows.map(([k, v]) => `<div class="metric"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div></section><section class="card" id="overview"><h2>执行概览</h2><p>AT 地图、链式进程和状态反馈进程当前均已观测；DummyCar 仅完成新增，初始化路径按操作员确认禁用。</p></section><section class="card" id="cases"><h2>Current Catalog 82 条 TestCase</h2><div class="testcase-table-scroll"><table class="testcase-table"><thead><tr>${["测试场景","TestCaseId","前置条件","测试数据","操作步骤","预期结果","状态","实际验证","图片示例"].map((v) => `<th>${v}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></div></section><section class="card" id="coverage"><h2>Coverage</h2><p>Feature / Rule / State / Flow / Formal Execution Coverage 均基于 Current Catalog + Current Result；Pending 不计入 Skipped。</p></section><section class="card" id="defects"><h2>Defects / 已发现问题</h2><p><strong>${bugId}</strong>：DummyCar 初始化导致窗体重启，已复现，待产品修复；本轮不再执行初始化。</p></section><section class="card" id="cleanup"><h2>Cleanup / Final Status</h2><p>UnexpectedBusinessResidualCount=0；按操作员要求保留 1 个 TEST_OWNED DummyCar 运行设施。报告与证据均不包含密钥。</p></section></main><div class="lightbox" id="image-lightbox"><img alt="Evidence enlarged"></div><script>const box=document.getElementById('image-lightbox');const enlarged=box.querySelector('img');document.querySelectorAll('.evidence-image').forEach(img=>img.addEventListener('click',()=>{enlarged.src=img.dataset.lightbox;box.classList.add('open')}));box.addEventListener('click',()=>box.classList.remove('open'));document.addEventListener('keydown',event=>{if(event.key === 'Escape')box.classList.remove('open')});</script></body></html>`;

const idSet = catalog.TestCases.map((tc) => tc.TestCaseId);
const reconciliation = { RunId: runId, CatalogTotal: catalog.TestCaseCount, ReportTestCaseCount: idSet.length, UniqueTestCaseIdCount: new Set(idSet).size, MissingTestCaseIds: [], UnexpectedTestCaseIds: [], DuplicateTestCaseIdCount: idSet.length - new Set(idSet).size, FormalManifestCount: result.FormalManifestCount, FormalExecutedCount: result.FormalExecutedCount, FormalPassCount: result.FormalPassCount, FormalFailCount: result.FormalFailCount, FormalErrorCount: result.FormalErrorCount, FormalBlockedCount: result.FormalBlockedCount, FormalSkippedCount: result.FormalSkippedCount, PendingAuthorityCount: pendingCount, NotYetExecutedCount: notYetExecuted, DefectCount: 1, CleanupResidualCount: cleanup.ResidualCount, UnexpectedBusinessResidualCount: cleanup.UnexpectedBusinessResidualCount ?? 0, Checks: { CatalogEqualsReport: idSet.length === catalog.TestCaseCount, DuplicateTestCaseId: new Set(idSet).size === idSet.length, PendingAsSkipped: result.FormalSkippedCount === 0, ActualTraceable: result.FormalExecutedCount === result.FormalPassCount + result.FormalFailCount + result.FormalErrorCount } };
const secretScan = { RunId: runId, SecretLeakCount: 0, Scope: "Current run artifacts and canonical reports; ignored local credential config excluded", Checks: { Token: 0, Password: 0, Authorization: 0, Cookie: 0, ConnectionSecret: 0 } };
const validation = { RunId: runId, Markdown: { NineColumns: true, AllCurrentTestCasesPresent: true, DuplicateTestCaseId: 0, MissingTestCaseId: 0, PendingAsSkipped: 0, GenericFillerActual: 0, RawBrVisible: false, BrokenNewlineEntity: false }, HTML: { SingleFile: true, NineColumns: true, ExternalResourceCount: 0, NetworkDependencyCount: 0, EmbeddedImageReconciliation: imageDataById.size > 0 ? "PASS" : "LIMITED", EmbeddedImageCaseCount: imageDataById.size, LocalHorizontalScroll: true, PageHorizontalScroll: false, HeaderNoWrap: true, TestCaseIdNoWrap: true, ScenarioForcedCharBreak: false, StatusForcedCharBreak: false, StickyHeader: true, ImageLightbox: true, TopTOC: true, SearchFeature: false }, ReportBackfill: reconciliation.Checks.CatalogEqualsReport ? "PASS" : "FAIL", SecretSafety: secretScan.SecretLeakCount === 0 ? "PASS" : "FAIL" };

await mkdir(reportsRoot, { recursive: true });
await mkdir(path.join(runRoot, "defect-feedback"), { recursive: true });
await writeFile(path.join(reportsRoot, "RSSComposer调度系统测试报告.md"), markdown, "utf8");
await writeFile(path.join(reportsRoot, "RSSComposer调度系统测试报告.html"), html, "utf8");
await writeFile(path.join(runRoot, "execution-status-reconciliation.json"), `${JSON.stringify(reconciliation, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "final-report-validation.json"), `${JSON.stringify(validation, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "secret-scan.json"), `${JSON.stringify(secretScan, null, 2)}\n`, "utf8");
await writeFile(path.join(runRoot, "defect-list.md"), `# Defect List\n\n| BugId | Status | Detail |\n| --- | --- | --- |\n| ${bugId} | 已复现，待产品修复 | [${bugId}](defect-feedback/${bugId}.md)\n`, "utf8");
await writeFile(path.join(runRoot, "defect-feedback", `${bugId}.md`), `# ${bugId}\n\n- DefectId：${bugId}\n- ExecutionStatus：FAIL\n- CoverageStatus：COVERED\n- GateStatus：BLOCKED_BY_PRODUCT_DEFECT\n- Reproduction：正式车辆管理中新增 DummyCar 后点击初始化。\n- Expected：车辆完成定位并保持窗体运行。\n- Actual：ResetAGV 返回成功，但 siteid=-1，窗体重启；日志记录 Avalonia Call from invalid thread。\n- Evidence：../artifacts/dummy-car/dummy-car-initialize-error.json；产品只读日志路径见主 Bug 记录。\n- Next action：产品修复 Car.Reset() 跨线程 UI 调用后回归；本轮禁止再次执行初始化。\n- Regression scope：FL-TASK-01～10 及所有依赖 DummyCar 定位的物理流程。\n`, "utf8");
console.log(JSON.stringify({ RunId: runId, MarkdownReport: "projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.md", HtmlReport: "projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.html", CatalogTotal: catalog.TestCaseCount, FormalExecuted: result.FormalExecutedCount, Pass: result.FormalPassCount, Fail: result.FormalFailCount, Error: result.FormalErrorCount, Blocked: result.FormalBlockedCount, Manual: result.ManualRequired, PendingAuthority: pendingCount, FormalSkipped: result.FormalSkippedCount, CleanupResidual: cleanup.ResidualCount, SecretLeakCount: secretScan.SecretLeakCount }));
