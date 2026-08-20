# Configuration

Configuration is split by safety boundary and is never a source of implicit runtime access.

- `environments.example.json` contains committed, safe platform environment profiles. The Synthetic profile may use a dynamic `127.0.0.1` port owned by the current test run.
- `local-projects.example.json` documents machine-specific real-project configuration shape only. Copying it to ignored `config/local-projects.json` is an explicit local action; the platform does not read that file for Synthetic acceptance.
- Real-project values must stay in ignored local configuration and must not contain committed Secret, password, token, cookie, API key, or connection-string values.
- There is no automatic fallback from Synthetic configuration to a real business localhost, product DLL, database, source tree, or credential.
- Environment profile selection must be explicit and validated by the platform loader; unknown profiles fail closed.
