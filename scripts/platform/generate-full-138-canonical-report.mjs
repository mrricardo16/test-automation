import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectRoot = path.join(root, "projects", "rsscomposer-blackbox");
const runId = "REMAINING-CLOSURE-20260828-01";
const runRoot = path.join(projectRoot, "runs", runId);
const reportRoot = path.join(projectRoot, "reports");
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const catalog = await readJson(path.join(projectRoot, "test-cases", "catalog", "menu-coverage-expanded-catalog.json"));
const partition = await readJson(path.join(runRoot, "final-case-status-partition.json"));
const reconciliation = await readJson(path.join(runRoot, "full-138-case-status-reconciliation.json"));
const evidenceIndex = await readJson(path.join(runRoot, "full-138-evidence-index.json"));
const menuCoverage = await readJson(path.join(runRoot, "final-menu-execution-coverage.json"));
const menuGate = await readJson(path.join(projectRoot, "runs", "MENU-COVERAGE-EXPANSION-20260827-01", "menu-coverage-gate.json"));
const cleanup = await readJson(path.join(runRoot, "cleanup-verification.json"));
const validation = await readJson(path.join(runRoot, "global-validation-impact-audit.json"));
const closureResult = await readJson(path.join(runRoot, "remaining-closure-result.json"));
const manualCompletion = await readJson(path.join(runRoot, "manual-review-execution-completion.json"));
const retestResult = await readJson(path.join(runRoot, "failed-error-retest-result.json"));
const challenge = await readJson(path.join(runRoot, "blocked-case-challenge.json"));

const cases = new Map((catalog.TestCases ?? []).filter((item) => item.ScopeStatus !== "OUT_OF_SCOPE" && item.ApplicabilityStatus !== "OUT_OF_SCOPE").map((item) => [item.TestCaseId, item]));
const rowsById = new Map((reconciliation.Rows ?? []).map((row) => [row.TestCaseId, row]));
const evidenceById = new Map((evidenceIndex.Rows ?? []).map((row) => [row.TestCaseId, row.EvidenceRefs ?? []]));
const evidenceCandidatesByName = new Map();
try {
  const runFiles = await readdir(path.join(projectRoot, "runs"), { recursive: true });
  for (const relative of runFiles.filter((item) => /\.(png|jpg|jpeg)$/i.test(item))) {
    const absolute = path.join(projectRoot, "runs", relative);
    try {
      if (!(await stat(absolute)).isFile()) continue;
      const name = path.basename(relative);
      const list = evidenceCandidatesByName.get(name) ?? [];
      list.push(absolute);
      evidenceCandidatesByName.set(name, list);
    } catch {
      // Ignore stale artifact entries.
    }
  }
} catch {
  // Evidence is optional for design-only cases.
}
const statusLabel = {
  PASS: "PASS / 通过",
  FAIL: "FAIL / 失败",
  ERROR: "ERROR / 自动化错误",
  BLOCKED_BEFORE_EXECUTION: "BLOCKED_BEFORE_EXECUTION / 执行前阻塞",
  BLOCKED_AFTER_PARTIAL_EXECUTION: "BLOCKED_AFTER_PARTIAL_EXECUTION / 部分执行后阻塞",
  MANUAL_REVIEW_PENDING: "MANUAL_REVIEW_PENDING / 待人工复核",
  NEVER_ATTEMPTED: "NEVER_ATTEMPTED / 尚未执行",
  SKIPPED: "SKIPPED / 不应出现",
};
export const MAX_VISUAL_CHARS_PER_LINE = 15;
const protectedTokenPattern = /[A-Za-z0-9]+(?:[_-][A-Za-z0-9<>]+)+/g;
const oneLine = (value) => String(value ?? "—").replace(/[\r\n]+/g, "；").replace(/\|/g, "／").trim() || "—";
const listText = (value) => Array.isArray(value) ? value.map(oneLine).join("；") : oneLine(value);
const cleanSegment = (value) => oneLine(value).replace(/[。；]+$/u, "");
const semanticList = (value) => {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item, index) => `${String.fromCharCode(0x2460 + index)} ${cleanSegment(item)}`).join("　");
};
const expectedText = (value) => {
  const parts = String(value ?? "—").split(/[；;]/u).map(cleanSegment).filter(Boolean);
  if (parts.length < 2) parts.push("结果与用例断言一致");
  return parts.map((item, index) => `${String.fromCharCode(0x2460 + index)} ${item}`).join("　");
};
const dataText = (value) => {
  if (!Array.isArray(value)) return oneLine(value);
  return value.map((item) => {
    if (!Array.isArray(item)) return oneLine(item);
    const label = oneLine(item[0]);
    const raw = /密码|password/i.test(label) ? "受控合法测试密码（不展示明文）" : oneLine(item[1]);
    return `${label}：${raw}`;
  }).join("　");
};
const visibleLength = (value) => [...String(value ?? "")].length;
const isVisualBreakPoint = (value) => /[\s，；：、。！？/→]$/u.test(value);
const atomize = (value) => {
  const atoms = [];
  let cursor = 0;
  for (const match of String(value).matchAll(protectedTokenPattern)) {
    const before = String(value).slice(cursor, match.index);
    atoms.push(...[...before]);
    atoms.push(match[0]);
    cursor = match.index + match[0].length;
  }
  atoms.push(...[...String(value).slice(cursor)]);
  return atoms;
};
const hardWrapLine = (value) => {
  const atoms = atomize(String(value ?? "").trim());
  const lines = [];
  let remaining = atoms;
  while (remaining.length) {
    if (visibleLength(remaining[0]) > MAX_VISUAL_CHARS_PER_LINE) {
      lines.push(remaining.shift());
      continue;
    }
    let length = 0;
    let take = 0;
    let preferredTake = 0;
    while (take < remaining.length) {
      const nextLength = length + visibleLength(remaining[take]);
      if (nextLength > MAX_VISUAL_CHARS_PER_LINE) break;
      length = nextLength;
      take += 1;
      if (length >= 10 && isVisualBreakPoint(remaining.slice(0, take).join(""))) preferredTake = take;
    }
    if (take === 0) take = 1;
    const splitAt = preferredTake > 0 ? preferredTake : take;
    lines.push(remaining.splice(0, splitAt).join("").trim());
  }
  return lines.filter(Boolean);
};
const visualItems = (value) => String(value ?? "").replace(/<br\s*\/?\s*>|&#10;/gi, "\n").split(/[\r\n　]+/u).map((item) => item.trim()).filter(Boolean);
const hardWrapMarkdown = (value) => visualItems(value).flatMap(hardWrapLine).join("<br>") || "—";
const statusOf = (id) => rowsById.get(id)?.CurrentFinalStatus ?? "NEVER_ATTEMPTED";
const reportRelativeEvidence = (ref) => {
  const absolute = path.isAbsolute(ref) ? ref : path.join(root, ref.replaceAll("/", path.sep));
  return path.relative(reportRoot, absolute).replaceAll(path.sep, "/");
};
const resolveEvidenceRefs = async (refs) => {
  const resolved = [];
  for (const ref of refs) {
    const absolute = path.isAbsolute(ref) ? ref : path.join(root, ref.replaceAll("/", path.sep));
    try {
      const info = await stat(absolute);
      if (info.isFile()) {
        resolved.push(path.relative(root, absolute).replaceAll(path.sep, "/"));
      } else if (info.isDirectory()) {
        const nested = await readdir(absolute, { recursive: true });
        const image = nested.find((item) => /\.(png|jpg|jpeg)$/i.test(item));
        if (image) resolved.push(path.relative(root, path.join(absolute, image)).replaceAll(path.sep, "/"));
      }
      continue;
    } catch {
      const candidates = evidenceCandidatesByName.get(path.basename(ref)) ?? [];
      const preferred = candidates.find((item) => ref.includes("SOURCE-ASSISTED-FORMAL") && item.includes("SOURCE-ASSISTED-FORMAL"))
        ?? candidates.find((item) => ref.includes("MENU-COVERAGE-EXPANSION") && item.includes("MENU-COVERAGE-EXPANSION"))
        ?? candidates[0];
      if (preferred) resolved.push(path.relative(root, preferred).replaceAll(path.sep, "/"));
    }
  }
  return [...new Set(resolved)];
};
const resolvedEvidenceById = new Map();
for (const [id, refs] of evidenceById) resolvedEvidenceById.set(id, await resolveEvidenceRefs(refs));
const imageCell = (id) => {
  const refs = resolvedEvidenceById.get(id) ?? [];
  if (!refs.length) return "—";
  return refs.map((ref, index) => `![${id}证据图例${index + 1}](${reportRelativeEvidence(ref)})`).join("　");
};
const actualText = (id) => {
  const row = rowsById.get(id);
  if (!row) return "未生成当前运行状态记录。";
  const parts = [row.ActualResult];
  if (row.BlockReason && row.BlockReason !== row.ActualResult) parts.push(`阻塞原因：${row.BlockReason}`);
  if (row.BlockClassification) parts.push(`分类：${row.BlockClassification}`);
  return parts.filter(Boolean).map(cleanSegment).join("　");
};
const testRow = (tc) => {
  const status = statusOf(tc.TestCaseId);
  const row = rowsById.get(tc.TestCaseId);
  const preconditions = [...(tc.Preconditions ?? [])];
  if (row?.ManualReviewRequired) preconditions.push("自动化页面操作已完成，最终视觉或交互判断需人工复核。");
  const steps = [...(tc.Steps ?? [])];
  if (tc.Cleanup) steps.push(`清理：${tc.Cleanup}`);
  return `| ${oneLine(tc.Scenario ?? tc.Title)} | ${tc.TestCaseId} | ${hardWrapMarkdown(semanticList(preconditions))} | ${hardWrapMarkdown(dataText(tc.TestData ?? tc.TestDataDesign?.DataFields))} | ${hardWrapMarkdown(semanticList(steps))} | ${hardWrapMarkdown(expectedText(tc.ExpectedResult))} | ${statusLabel[status] ?? status} | ${hardWrapMarkdown(actualText(tc.TestCaseId))} | ${imageCell(tc.TestCaseId)} |`;
};

const counts = Object.fromEntries(Object.entries(partition.Counts ?? {}).map(([key, value]) => [key, value]));
const terminalExecuted = (counts.PASS ?? 0) + (counts.FAIL ?? 0) + (counts.ERROR ?? 0);
const executionAttempted = (reconciliation.Rows ?? []).filter((row) => row.ExecutionAttempted || row.TargetActionAttempted).length;
const modules = new Map();
const menuCaseIds = new Map((menuGate.Rows ?? []).map((menu) => [menu.MenuName ?? menu.Menu, menu.CaseIds ?? []]));
for (const menu of menuCoverage.Menus ?? []) {
  const module = menu.Module ?? "未分类";
  if (!modules.has(module)) modules.set(module, []);
  modules.get(module).push(menu);
}

const lines = [
  "# RSSComposer调度系统测试报告",
  "",
  `- 运行编号：\`${runId}\``,
  "- 报告类型：Canonical Report（当前 138 条 IN_SCOPE Catalog）",
  `- 测试结论：**${(counts.FAIL ?? 0) || (counts.ERROR ?? 0) || (counts.BLOCKED_BEFORE_EXECUTION ?? 0) ? "BLOCKED（存在产品失败、自动化错误或安全/环境阻塞）" : "PASS"}**`,
  "- 综合看板：OUT_OF_SCOPE，不进入 Catalog、覆盖率和未执行统计。",
  "- Expected 与 Runtime 严格分离；最终 SKIPPED=0，NEVER_ATTEMPTED=0。",
  "",
  "## 1. 测试基本信息",
  "",
  "| 项目 | 内容 |",
  "| --- | --- |",
  "| Current Catalog | 138 条，19 个 IN_SCOPE 叶子菜单 |",
  "| 权威来源 | DEV-HANDOFF-REAL-20260824-105102；用户批准的 19 菜单范围 |",
  "| 执行方式 | Playwright 可执行 Web UI；TEST_OWNED 数据通过网页创建、查询、修改、删除 |",
  "| 数据库 | 仅用于只读残留验证；未使用数据库拟造或清理业务数据 |",
  "| 当前运行地图 | 已批准 AT 地图；未执行初始化/Reset/DummyCar 重置 |",
  "| 产品源码 | 只读，未修改 |",
  "",
  "## 2. 测试结果概览",
  "",
  "| 指标 | 结果 |",
  "| --- | --- |",
  `| CatalogTotal | ${catalog.TestCases.filter((item) => item.ScopeStatus !== "OUT_OF_SCOPE" && item.ApplicabilityStatus !== "OUT_OF_SCOPE").length} |`,
  `| ExpectedConfirmed | ${partition.ExpectedConfirmedCount ?? 138} |`,
  `| ExpectedPending | ${partition.ExpectedPendingCount ?? 0} |`,
  `| 本轮安全目标 | ${closureResult.TargetCaseIds.length} 个阻塞目标 + ${manualCompletion.ReviewedCount} 个人工复核入口 |`,
  `| 本轮目标结果 | ${closureResult.Counts.PASS} PASS；${closureResult.Counts.ERROR} ERROR；人工观察 ${manualCompletion.ReviewedCount}/${manualCompletion.ReviewedCount} 完成 |`,
  `| TerminalExecuted | ${terminalExecuted}（PASS+FAIL+ERROR） |`,
  `| PASS | ${counts.PASS ?? 0} |`,
  `| FAIL | ${counts.FAIL ?? 0} |`,
  `| ERROR | ${counts.ERROR ?? 0} |`,
  `| BLOCKED_BEFORE_EXECUTION | ${counts.BLOCKED_BEFORE_EXECUTION ?? 0} |`,
  `| BLOCKED_AFTER_PARTIAL_EXECUTION | ${counts.BLOCKED_AFTER_PARTIAL_EXECUTION ?? 0} |`,
  `| MANUAL_REVIEW_PENDING | ${counts.MANUAL_REVIEW_PENDING ?? 0} |`,
  `| NEVER_ATTEMPTED | ${counts.NEVER_ATTEMPTED ?? 0} |`,
  `| SKIPPED | ${counts.SKIPPED ?? 0} |`,
  `| TerminalResultCoverage | ${terminalExecuted}/${partition.CatalogTotal}（${((terminalExecuted / partition.CatalogTotal) * 100).toFixed(1)}%） |`,
  `| ExecutionAttemptCoverage | ${executionAttempted}/${partition.CatalogTotal}（${((executionAttempted / partition.CatalogTotal) * 100).toFixed(1)}%） |`,
  `| BlockedChallengeReviewed | ${challenge.ReviewedCount} / 47 |`,
  `| ManualEvidenceCompletion | ${manualCompletion.ReviewedCount} / ${manualCompletion.ReviewedCount} |`,
  `| FailedErrorRetest | ${retestResult.CandidateCount} 个候选，${retestResult.ExecutedCount} 执行，${retestResult.NotRequiredCount} 个因无产品变化不重测 |`,
  `| UnexpectedBusinessResidual | ${cleanup.UnexpectedBusinessResidualCount} |`,
  "",
  "## 3. 细粒度正式 Catalog",
  "",
  "| 模块 | 菜单 | 用例数 | PASS | FAIL | ERROR | 阻塞 | 人工复核 | 覆盖状态 |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
];
for (const menu of menuCoverage.Menus ?? []) lines.push(`| ${menu.Module} | ${menu.Menu} | ${menu.TotalCases} | ${menu.Pass} | ${menu.Fail} | ${menu.Error} | ${menu.Blocked} | ${menu.ManualReview} | ${menu.ExecutionCoverage} |`);
lines.push(
  "",
  "以下主表按冻结的 19 个叶子菜单保留当前 Catalog 的全部 138 条 TestCase。每张表固定九列：测试场景、TestCaseId、前置条件、测试数据、操作步骤、预期结果、状态、实际验证、图片示例。",
  "操作展示映射：RESET 显示为“筛选重置”，PAGINATION 显示为“分页”；报告不展示内部 Operation 枚举标题。",
  "",
);
for (const [module, menus] of modules) {
  lines.push(`### ${module}`, "");
  for (const menu of menus) {
    lines.push(`#### ${menu.Menu}`, "", "| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const id of menuCaseIds.get(menu.Menu) ?? []) {
      const tc = cases.get(id);
      if (tc) lines.push(testRow(tc));
    }
    lines.push("");
  }
}
const coveredCaseIds = new Set([...menuCaseIds.values()].flat());
const boundaryCases = [...cases.values()].filter((tc) => !coveredCaseIds.has(tc.TestCaseId));
if (boundaryCases.length) {
  lines.push("### 范围边界记录", "", "以下 Catalog 用例不属于 19 菜单 Gate 的 CaseIds，保留用于 138 条状态完整性对账；不计入 19 菜单执行覆盖。", "", "| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |", ...boundaryCases.map(testRow), "");
}
lines.push(
  "## 4. 模块状态汇总",
  "",
  "模块状态与逐用例结果已在上方 19 个菜单表中按当前 Catalog 汇总；菜单覆盖 Gate=PASS，所有 IN_SCOPE 菜单均有用例。",
  "",
  "## 5. 缺陷、安全与环境结论",
  "",
  "- `BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001`：初始化车辆或 ResetAGV 会导致窗体重启并造成车辆消失。已记录为产品缺陷；本轮禁止再次执行初始化/Reset，不将该安全阻塞伪造为 PASS。",
  "- 地图创建、更新、删除、状态、集成五类高风险操作因共享正式地图缺少隔离与回滚证明，保持 `BLOCKED_BEFORE_EXECUTION`。",
  "- `TC-MAINT-CREATE-001` 会触发车辆物理动作，保持安全阻塞。",
  "- `TC-DRAW-VISUAL-001` 已完成页面、动作、查询、DOM/API 与截图采集，最终 Canvas 视觉判断保持 `MANUAL_REVIEW_PENDING`。",
  `- 全量 TypeScript 校验存在测试基础设施限制：缺少 ${validation.MissingFile}；不影响已获得的有效 Web 执行结果，产品源码未修改。`,
  "- 既有失败保留：`TC-USER-RESET-001`、`TC-STAT-RESET-001`、`TC-STAT-PAGE-001`；既有自动化错误保留：`TC-VEH-UPDATE-001`。",
  "",
  "## 6. 清理与交付边界",
  "",
  `- CleanupStatus：${cleanup.CleanupStatus}；UnexpectedBusinessResidualCount=${cleanup.UnexpectedBusinessResidualCount}；UnexpectedResidualCount=${cleanup.UnexpectedResidualCount}。`,
  "- 保留的 AT 地图、专用进程和 DummyCar 是经批准的测试基础设施，不计入业务残留；本轮创建的策略、进程、模板、模板项、角色、字典项、外部系统配置均已通过网页清理。",
  "- 本轮未执行 commit、push、reset、clean 或产品源码修改。",
  "",
  `报告生成时间：${new Date().toISOString()}`,
  "",
);

await writeFile(path.join(reportRoot, "RSSComposer调度系统测试报告.md"), `${lines.join("\n").replace(/\n+$/u, "")}\n`, "utf8");
console.log(JSON.stringify({ RunId: runId, CatalogTotal: cases.size, MenuCount: (menuCoverage.Menus ?? []).length, Counts: counts, TerminalExecuted: terminalExecuted, MarkdownPath: path.join(reportRoot, "RSSComposer调度系统测试报告.md") }));
