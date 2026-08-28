import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const runId = "SOURCE-ASSISTED-FORMAL-20260827-02";
const runRoot = path.join(root, "projects", "rsscomposer-blackbox", "runs", runId);
const config = JSON.parse(await readFile(path.join(root, "projects/rsscomposer-blackbox/config/project.local.json"), "utf8"));
const database = config.database;
const outputPath = path.join(runRoot, "artifacts/db/readonly-probe.json");
const result = {
  RunId: runId,
  AccessMode: "READ_ONLY_VERIFICATION",
  Host: database.host,
  Port: database.port,
  Database: database.name,
  WritesAttempted: false,
  Status: "ERROR",
  Checks: [],
};

try {
  const connection = await mysql.createConnection({
    host: database.host,
    port: Number(database.port),
    user: database.username,
    password: database.password,
    database: database.name,
    connectTimeout: 10_000,
  });
  const checks = [
    ["TaskTableReadable", "SELECT COUNT(*) AS count FROM tn_tsk_task"],
    ["VehicleTableReadable", "SELECT COUNT(*) AS count FROM tn_map_car"],
    ["UserTableReadable", "SELECT COUNT(*) AS count FROM tn_emp_user"],
    ["TestVehicleReadable", "SELECT COUNT(*) AS count FROM tn_map_car WHERE cn_s_name = 'AT_0827_02_DUMMY'"],
  ];
  for (const [name, sql] of checks) {
    const [rows] = await connection.query(sql);
    result.Checks.push({ Name: name, Status: "PASS", Row: rows[0] });
  }
  await connection.end();
  result.Status = "PASS";
  result.Connection = "PASS";
} catch (error) {
  result.Connection = "ERROR";
  result.ErrorCode = error?.code ?? "UNKNOWN";
  result.ErrorMessage = error?.message ?? String(error);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ RunId: runId, Status: result.Status, Connection: result.Connection, CheckCount: result.Checks.length, WritesAttempted: false }));
process.exitCode = result.Status === "PASS" ? 0 : 1;
