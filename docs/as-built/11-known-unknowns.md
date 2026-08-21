# 11：已知不确定项

> 本表集中记录不能从当前源码直接证明的内容。`UNMATCHED` 不是 Bug 结论。

| ID | Category | Description | Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- | --- |
| UNK-001 | UNMATCHED_API | 前端静态 API 与后端精确匹配缺口 | `05-frontend-backend-mapping.md` 的完整清单 | 可能影响后续测试覆盖设计 | 人工确认运行时版本、动态路径和外部调用边界 |
| UNK-002 | UNUSED_CODE | 后端端点未找到前端静态调用 | backend endpoint inventory / 44 records | 可能是外部接口、旧接口、动态调用或版本不一致 | 结合运行时网络日志或 API owner 逐条归属 |
| UNK-003 | ENVIRONMENT_DEPENDENCY | API address、WebSocket address、license、Redis、数据库取值 | runtime config / Program / DbContext references | 源码无法代表部署环境 | 在受控环境单独建立配置基线，不把凭据写入仓库 |
| UNK-004 | POTENTIAL_SOURCE_RUNTIME_MISMATCH | 当前两个源码工作树有既有修改，既有 Web runtime report 未证明由当前 hash 构建 | source Git status + `projects/test-workflow/reports/web-real-001-report.md` | 代码映射与运行证据可能来自不同版本 | 由人工确认构建产物与 source commit 对应关系 |
| UNK-005 | UNKNOWN_BUSINESS_MEANING | 数字状态、配置键、外部消息字段的业务含义不总由 enum/文档确定 | model/service/controller conditions | 后续测试断言可能误写业务语义 | 以产品/领域资料补充后再进入 Test Design |
| UNK-006 | POTENTIAL_SECURITY_DESIGN_GAP | 部分 WebApiController 未观察到 RequiresToken | controller inventory | 可能是公开/车载/外部接口，也可能存在权限边界差异 | 由安全/接口 owner 确认 intended exposure；本阶段不修复 |
| UNK-007 | MISSING_DOCUMENTATION | 原始需求、部署拓扑、数据库 schema、外部协议未随源码完整提供 | repository/source scan | As-Built 只能描述实现结构 | 人工审查本文并补充受控设计资料 |
| INF-001 | INFERRED_DESIGN | 以 `src/views` 一级目录作为主要前端模块 | view directory inventory | 目录边界不必等于产品模块边界 | 后续由 owner 确认模块归属 |
| INF-002 | INFERRED_DESIGN | `system`/`Employee`/`Sys`/`Logs` 合并为系统管理范围 | page names + APIs + controller areas | 可能遗漏运行时菜单别名 | 以菜单数据和产品术语审查 |
| INF-003 | INFERRED_DESIGN | Service refs 作为 Controller→Service 映射 | `ServiceLocator.GetService<T>()` | 间接调用/运行时反射可能未捕获 | 后续需要时补充调用图 |

## 当前阶段明确不确认

- 不确认生产环境具体 URL、端口、数据库、Redis、MQTT、WebSocket 可用性。
- 不确认原始业务意图、权限设计意图、状态数字的业务名称。
- 不确认现有运行时与当前源码树完全同版。
