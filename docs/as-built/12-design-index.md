# 12：As-Built 设计索引

ARCH-001 设计入口。请先阅读 `00-source-baseline.md`，再按映射、认证权限和模块页进入后续人工审查。

| Document | Content | Main source/evidence |
| --- | --- | --- |
| [00-source-baseline.md](00-source-baseline.md) | 源码路径、哈希、文件数、边界 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [01-system-overview.md](01-system-overview.md) | 系统结构和总体架构图 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [02-backend-architecture.md](02-backend-architecture.md) | solution/project、启动、Controller、技术栈 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [03-frontend-architecture.md](03-frontend-architecture.md) | Vue、启动、路由、页面模块 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [04-api-design.md](04-api-design.md) | 后端与前端完整静态 API 清单 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [05-frontend-backend-mapping.md](05-frontend-backend-mapping.md) | 前后端 method/route 映射和未匹配项 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [06-auth-permission-design.md](06-auth-permission-design.md) | 登录、token、路由守卫、后端授权 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [07-module-design.md](07-module-design.md) | 主要模块和系统管理设计 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [08-business-flows.md](08-business-flows.md) | 登录、系统管理和主要跨端流程 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [09-data-and-external-dependencies.md](09-data-and-external-dependencies.md) | 数据库、缓存、文件、网络、外部依赖 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [10-error-and-observability.md](10-error-and-observability.md) | 前后端错误、日志、观测 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [11-known-unknowns.md](11-known-unknowns.md) | UNKNOWN/INFERRED/UNMATCHED 集中项 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [design-coverage.md](design-coverage.md) | 覆盖统计和质量门槛 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [system-design-index.json](system-design-index.json) | 后续 Agent 使用的机器索引 | 当前真实源码 / 既有 runtime report（若明确标注） |
| [test-design-observations.md](test-design-observations.md) | 非 TestCase 的后续观察 | 当前真实源码 / 既有 runtime report（若明确标注） |

## 下一阶段门

- 当前建议：**等待人工审查，不自动进入 TEST-DESIGN-001**。
- 人工至少确认：动态菜单真实菜单树、前后端版本对应关系、系统管理模块边界、未匹配 API 的外部/历史归属、权限意图和数据库/部署配置边界。
