# Project-scoped test products

每一个独立测试项目都必须使用一个项目目录：

```text
projects/<project-slug>/
├── README.md       # 项目名称、范围和本次测试说明
├── reports/        # 项目报告、执行摘要和覆盖说明
├── outputs/        # 项目正式交付物，例如 DOCX、XLSX、PDF
└── artifacts/      # 项目运行证据；默认忽略，不提交敏感内容
```

`<project-slug>` 使用稳定、简短的 ASCII 名称，例如 `dispatch`、`wms` 或
`test-workflow`。测试源码、TestCase、契约和通用脚本继续放在仓库现有的
`tests/`、`test-cases/`、`contracts/` 和 `scripts/` 目录中；它们不因项目产物归档而复制一份。

## 当前项目

- `test-workflow`：测试工作流是否正常运行

每次新的测试项目都应先建立项目目录和项目 README，再将本次测试生成的报告、正式输出和运行证据写入该目录。
