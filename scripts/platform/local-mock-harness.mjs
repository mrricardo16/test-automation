import http from "node:http";

const port = Number(process.argv[process.argv.indexOf("--port") + 1] ?? 8230);
const policies = new Set(["SUCCESS", "FAILURE", "TIMEOUT", "EMPTY", "INVALID", "WCS_DENY", "WCS_ALLOW"]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "PASS", harness: "LOCAL_MOCK", policies: [...policies] }));
    return;
  }
  const policy = url.pathname.split("/").filter(Boolean)[1] ?? "";
  if (!policies.has(policy)) {
    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ERROR", message: "unknown mock policy" }));
    return;
  }
  if (policy === "TIMEOUT") {
    setTimeout(() => {
      response.writeHead(504, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "TIMEOUT" }));
    }, 250);
    return;
  }
  const statusCode = policy === "FAILURE" ? 500 : policy === "INVALID" ? 422 : policy === "WCS_DENY" ? 403 : 200;
  const body = policy === "EMPTY" ? { status: "EMPTY", items: [] } : { status: policy, isSuccess: policy === "SUCCESS" || policy === "WCS_ALLOW" };
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(JSON.stringify({ status: "LISTENING", port, pid: process.pid }) + "\n");
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
