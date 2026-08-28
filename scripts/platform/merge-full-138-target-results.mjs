import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const runRoot = path.join(root, "projects", "rsscomposer-blackbox", "runs", "FULL-138-UNFINISHED-REGRESSION-20260828-01");
const resultPath = path.join(runRoot, "full-138-target-results.json");
const preservationPath = path.join(runRoot, "target-pass-preservation.json");
const current = JSON.parse(await readFile(resultPath, "utf8"));
const preservation = JSON.parse(await readFile(preservationPath, "utf8"));
const normalize = (row) => ({
  ...row,
  ExecutionStatus: row.ExecutionStatus ?? row.Status,
  Actual: row.Actual ?? row.ActualVerification ?? row.Reason ?? null,
  EvidencePaths: row.EvidencePaths ?? row.Evidence ?? [],
});
const rows = [...new Map([...(current.Rows ?? []), ...(preservation.Rows ?? [])].map(normalize).map((row) => [row.TestCaseId, row])).values()];
const statuses = ["PASS", "FAIL", "ERROR", "BLOCKED", "MANUAL", "SKIPPED"];
current.Rows = rows;
current.Counts = Object.fromEntries(statuses.map((status) => [status, rows.filter((row) => row.Status === status).length]));
current.Source = `${current.Source}; preserved direct current-run PASS rows after targeted artifact replacement`;
await writeFile(resultPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ RunId: current.RunId, RowCount: rows.length, Counts: current.Counts }));
