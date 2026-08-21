# 00：源码基线

> ARCH-001 As-Built 基线。本文只记录当前源码扫描事实，不代表原始需求设计或运行时部署配置。

- 分析时间：2026-08-18T15:06:19.8990215+08:00
- 后端源码目录：`D:\HZ_RSS40\03_trunk\src_m_rsscomposer`（只读）
- 前端源码目录：`D:\HZ_RSS40\03_trunk\src_m_ui`（只读）
- 后端 Git：726f931 / main
- 前端 Git：808ccb3 / main

## 哈希与文件数

| 对象 | Before 文件数 | Before SHA-256 树哈希 | After 文件数 | After SHA-256 树哈希 | 一致性 |
| --- | ---: | --- | ---: | --- | --- |
| Backend | 1653 | 20424719249cf923a432935fa390848161e71cf585ee5835b30d09bcaf4f778f | 1653 | 20424719249cf923a432935fa390848161e71cf585ee5835b30d09bcaf4f778f | Yes |
| Frontend | 3512 | 5006ef3dd561d97e1dbf31cafc79727e9c5c1c24c41cf533fce13422aaf18e6d | 3512 | 5006ef3dd561d97e1dbf31cafc79727e9c5c1c24c41cf533fce13422aaf18e6d | Yes |

排除目录：bin, obj, node_modules, dist, coverage, .vs, .idea, .vscode, cache, tmp, temp, Build。哈希输入为按相对路径排序的 relative/path|individual-SHA256 清单，再对 UTF-8 清单计算 SHA-256。

## 工作区与安全边界

- `E:\automated-testing` 在本阶段开始时已有未提交的文档、报告、脚本和输出，均保留。
- 本阶段不启动前后端、不执行 Playwright/API/桌面测试、不连接数据库、不执行 npm install、dotnet restore、build 或 migration。
- 源码工作树在采集时存在既有修改；本阶段不把这些修改归因于 ARCH-001，也不修改两个真实源码目录。
- 初始全文件试算发现 `Build/loganalysis` 在持续生成运行时日志/压缩包；最终基线排除整个生成目录 `Build`，保留业务源码中的 `Areas/Log`，并从该规则重新建立 Before/After。
- 发现配置文件中可能包含敏感值；本套文档只记录“存在敏感配置”，不输出值。
