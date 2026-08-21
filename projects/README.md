# Project-scoped test products（仅本地）

独立测试项目的报告、输出物、测试用例、项目脚本、截图、Trace 和运行证据
只保留在本地，不进入远端仓库。这样远端只承载可复用的测试平台，不绑定任何
具体产品、项目或一次性执行结果。

本文件是远端唯一保留的项目目录说明。每一个本地测试项目仍使用一个项目目录：

```text
projects/<project-slug>/
├── README.md       # 项目名称、范围和本次测试说明
├── reports/        # 项目报告、执行摘要和覆盖说明
├── outputs/        # 项目正式交付物，例如 DOCX、XLSX、PDF
└── artifacts/      # 项目运行证据；默认忽略，不提交敏感内容
```

`<project-slug>` 使用稳定、简短的 ASCII 名称，例如 `dispatch`、`wms` 或
`test-workflow`。项目目录在本机可以完整存在，但由根目录 `.gitignore` 保持为
local-only；项目级测试源码、TestCase、报告和证据不会作为远端共享内容提交。

远端共享内容使用以下解耦边界：

- `contracts/`：通用契约和 Schema。
- `skills/`：可复用 Skill、模板、验证器和自测。
- `scripts/`：通用、可重复执行的平台脚本。
- `test-cases/`：平台级或合成产品的公共 TestCase 记录。
- `tests/`：平台级、合成产品和通用 Harness 测试。
- `reports/`：仓库级审计、平台质量和治理报告；具体项目报告只在本地项目目录保存。

本地开始新的项目测试时，先建立项目目录和项目 README，再将本次测试生成的项目报告、
正式输出和运行证据写入该目录。不要把项目目录复制到根级 `tests/`、`test-cases/`
或 `reports/`；只有经抽象、可复用的平台能力才进入远端共享目录。
