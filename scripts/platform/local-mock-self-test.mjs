const baseUrl = process.argv[2] ?? "http://127.0.0.1:8230";
const policies = ["SUCCESS", "FAILURE", "TIMEOUT", "EMPTY", "INVALID", "WCS_DENY", "WCS_ALLOW"];
const results = [];
for (const policy of policies) {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 150);
    const response = await fetch(`${baseUrl}/feedback/${policy}`, { signal: controller.signal });
    clearTimeout(timer);
    const body = await response.json();
    const expectedStatus = policy === "SUCCESS" || policy === "WCS_ALLOW" || policy === "EMPTY" ? 200 : policy === "FAILURE" ? 500 : policy === "INVALID" ? 422 : 403;
    results.push({ policy, httpStatus: response.status, body, expectedHttpStatus: expectedStatus, assertionStatus: response.status === expectedStatus ? "PASS" : "FAIL" });
  } catch (error) {
    results.push({ policy, httpStatus: null, assertionStatus: policy === "TIMEOUT" && error.name === "AbortError" ? "PASS" : "FAIL", error: error.name, durationMs: Date.now() - startedAt });
  }
}
console.log(JSON.stringify({ harness: "LOCAL_MOCK", results }));
