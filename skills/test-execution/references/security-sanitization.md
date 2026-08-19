# Security and sanitization

Treat credentials, cookies, Authorization headers, bearer tokens, API keys, passwords, secret values, private URLs, and sensitive business payloads as secrets. Load them only from environment variables, ignored local configuration, or an approved secret store.

Before writing evidence or reports, redact secret-bearing headers, query parameters, form values, response fields, screenshots, traces, console logs, and network bodies. Prefer names and status summaries over raw payloads. If sanitization is uncertain, do not retain the artifact; record `ERROR_EVIDENCE_CAPTURE` and the safe reason.

Review page source and network captures for sensitive content before retaining them. Never add credentials or private local configuration to Git. Keep artifacts and reports under repository-approved output locations and keep browser binaries and `node_modules` out of Git.
