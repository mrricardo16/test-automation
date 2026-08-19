# Security sanitization

Never retain passwords, tokens, cookies, Authorization, API keys, connection strings, customer data, private paths, raw sensitive source, headers, payloads, screenshots, traces, or network bodies. Use relative source references and redacted summaries. Credentials come only from environment variables, ignored local configuration, or approved secret storage; no secret belongs in Git, TestCase, report, or evidence.
