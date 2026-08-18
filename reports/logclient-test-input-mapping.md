# LogClient Phase 3B-RUN Test Input Mapping

**Date:** 2026-08-17
**Scope:** `TC-AVA-E2E-001` only; real Analysis multi-car-log import.

## Evidence sources

- DOCX: `E:\logclient\LogClient功能设计文档_v1.0.0_20260810\LogClient功能设计说明书_v1.0.0.docx`, development-delivery version `v1.0.0`.
- Import flow: `E:\logclient\LogClient功能设计文档_v1.0.0_20260810\流程图源\FL-IMPORT.drawio` and `FL-IMPORT.svg`; `flow-index.json` maps `FL-IMPORT` to “日志包导入”.
- QA: `E:\logclient\LogClient功能设计文档_v1.0.0_20260810\_qa`; read-only scan found no files.
- Source: `D:\HZ_RSS40\03_trunk\src_m_logclient\logclient\Views\AnalysisView.axaml.cs` and `AnalysisView.axaml`.

## Mapping

| Input | Path | Used By | Required | Notes |
| --- | --- | --- | --- | --- |
| Car Logs | `E:\测试项目部署\测试项目部署\RSS\log` | Analysis / `TC-AVA-E2E-001` | Yes | The Case is the positive multi-car-log import. The first three time-contiguous ZIPs are selected through the real Windows picker. Their manifests identify `packageType=car`, `invalidLineCount=0`, and `partial=false`. |
| Traffic Logs | `E:\测试项目部署\测试项目部署\RSS\Release\loganalysis\traffic\packages\20260810` | Separate import/mixed or closure candidate | No | The design lists traffic and mixed packages as supported import scenarios, but the first business Case is explicitly car-only. No traffic package is mixed into this execution. The supplied directory currently contains `hz.rss_*.zip` files; the requested `rss_*.zip` names are not assumed. |
| Map | `D:\HZ_RSS40\03_trunk\src_m_ui\docs\samples\巢湖260104.json` | Replay / map-dependent flow | No | `AnalysisView` exposes a separate optional map picker and assigns the selected path to imported package metadata; the documented positive import scenario does not require map selection. Do not add it to this Case. |

## Confirmed Analysis flow

1. Open LogClient and enter the import page.
2. Use the multi-file picker to choose valid ZIP packages.
3. The product filters names beginning with `rss` or `hz.carlog`, parses each ZIP, and stores valid pending results.
4. Enter a package group name and confirm import.
5. The session applies each package, selects the imported group, updates the time range and summaries, and queries rows.
6. The code-confirmed visible completion pattern is `导入完成：有效 {n} 条，跳过 {n} 条，警告 {n} 条。`; the page also exposes the selected package summary and valid-record count.

## Conflicts and limits

The DOCX describes supported car, traffic, mixed, map, and replay inputs, while `TC-AVA-E2E-001` is scoped to the first car-only positive flow. The DOCX also marks formal success copy and package validation values as product-confirmation items; this report therefore treats the runtime source-code status and actual UI evidence as the executable acceptance contract, without inventing additional business assertions.
