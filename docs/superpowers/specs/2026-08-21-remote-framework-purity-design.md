# Remote Framework Purity Design

## Goal

Keep the remote repository as a reusable test-platform repository. Project-specific
test cases, execution scripts, reports, outputs, screenshots, traces, and runtime
evidence remain available locally but are not tracked in the remote repository.

## Scope

- Keep `projects/README.md` as the project-local storage contract.
- Remove tracked contents under `projects/*/` from the current branch's remote tree.
- Preserve all existing local project directories and files on disk.
- Add an ignore rule for project-local contents while allowing `projects/README.md`.
- Keep framework-level `contracts/`, `skills/`, `scripts/`, `test-cases/`, `tests/`,
  `fixtures/`, `docs/`, and repository-level audit `reports/` in the remote tree.
- Do not rewrite Git history; the cleanup applies to the new tip only.

## Target Tree

```text
projects/
└── README.md
```

The remote root remains organized by reusable responsibility. Project execution
products are local-only and decoupled from the shared platform.

## Safety and Validation

- Use `git rm --cached` only for tracked project files so local files remain.
- Verify `projects/README.md` remains tracked and no project directory is tracked.
- Verify no `artifacts/`, `test-results/`, `playwright-report/`, `node_modules/`,
  or `Typora_Hook_Log.txt` enters the index.
- Run the repository quality gate and `git diff --check`.
- Push only after local/remote branch synchronization is verified.
