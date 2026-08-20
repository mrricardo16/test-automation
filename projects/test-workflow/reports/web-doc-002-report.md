# WEB-DOC-002 技术报告

## 1. 阶段结果

| 项目 | 结果 |
| --- | --- |
| 阶段 | `WEB-DOC-002` |
| 目标 | 基于已执行的真实 Web 测试生成登录与系统管理带图 Word 操作手册 |
| Source | `D:\HZ_RSS40\03_trunk\src_m_ui`，只读 |
| Runtime | 当前真实 Web 测试环境，页面显示正式系统名称“RSS调度系统” |
| 起始 Git 状态 | `main...origin/main`；已有 `projects/test-workflow/outputs/`、`projects/test-workflow/reports/system-management-execution-summary.md`、`scratch/` 未跟踪内容，本阶段保留 |
| WebSourceTreeHashBefore | `fc51ed641ed79de24674e9a9f10d84ff0448f0259c3221fe411e735f5c21c2d8` |
| WebSourceFileCountBefore | `643` |

## 2. ExistingTestCoverageMap

| 功能名称 | TestCase | 标题/覆盖操作 | 执行状态 | 既有证据 | 是否写入手册 |
| --- | --- | --- | --- | --- | --- |
| 系统登录 | `TC-WEB-LOGIN-001` | 打开登录页、输入登录信息、登录、进入首页 | PASS | `projects/test-workflow/artifacts/web-real-001/` | 是 |
| 进入系统管理 | `TC-SM-ENV-001` | 进入系统管理并打开用户管理 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 用户管理 | `TC-SM-USER-001/002/003/004/005` | 查询、新增、编辑、删除、指定用户角色 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 角色管理 | `TC-SM-ROLE-001/002/003/004` | 新增、编辑、权限分配、删除角色 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 菜单管理 | `TC-SM-MENU-001/002/003/004/005` | 新增、编辑、查询、删除及删除后复核 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 字典管理 | `TC-SM-DICT-001/001-ITEM/002/003-RETRY` | 新增、修改、选择节点后查看 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 外部系统配置 | `TC-SM-EXSYS-001/002/003/004` | 新增、编辑、查询、删除 | PASS | `projects/test-workflow/artifacts/system-management-viewport/` | 是 |
| 字典子项删除 | `TC-SM-DICT-004` | 页面提示“系统类型不可删除” | FAIL | `TC-SM-DICT-004/result.png` | 否 |
| 部门、参数、日志等 | 未找到合格 PASS Case | 源码存在，但本阶段没有合格真实执行证据 | SKIPPED | 无可复用证据 | 否 |

## 3. 已找到的 TestCase 当前状态

本阶段没有修改既有测试的 Expected Result 或 Execution Status。系统管理执行结果为：

| 状态 | Case 数量 | Case |
| --- | ---: | --- |
| PASS | 26 | `TC-SM-ENV-001`、`TC-SM-USER-001/002/003/004/005`、`TC-SM-ROLE-001/002/003/004-RESTORE`、`TC-SM-MENU-001/002/003/004/005`、`TC-SM-DICT-001/001-ITEM/002/003-RETRY`、`TC-SM-EXSYS-001/002/003/004`、`TC-SM-FINAL-001/002` |
| FAIL | 2 | `TC-SM-DICT-003`、`TC-SM-DICT-004` |
| ERROR | 4 | `TC-SM-USER-003-UI`、`TC-SM-ROLE-001-NAV`、`TC-SM-ROLE-003-LOCATOR`、`TC-SM-DICT-001-ITEM-UI` |

登录基线 `TC-WEB-LOGIN-001` 的已有报告状态为 PASS；本阶段另外执行了 `TC-WEB-ENV-001` 快速基线，结果为 PASS（1 passed）。

## 4. 实际纳入 Word 的功能

- 系统登录：打开登录页面、输入登录信息、登录、进入首页。
- 系统管理入口：展开“系统管理”，识别五个已确认子菜单。
- 用户管理：查看/查询、新增、编辑、删除、指定用户角色。
- 角色管理：查看/查询、新增、编辑、角色权限分配、删除。
- 菜单管理：维护、查询/定位、删除及删除后复核。
- 字典管理：新增字典类型、新增字典子项、修改字典子项、选择字典节点后查看。
- 外部系统配置：查看/查询、新增、编辑、删除。

排除内容：字典子项删除（真实结果 FAIL）；部门管理、参数配置、日志管理、登录失败、退出、密码重置、导入导出（本阶段无合格真实操作证据）。这些内容记录在 Manifest 的 `excludedFromManual` 中，未写入正式操作步骤。

## 5. 截图与 Manifest

| 项目 | 结果 |
| --- | --- |
| Manifest | `projects/test-workflow/artifacts/web-doc/system-manual/manifest.json` |
| Documentation Screenshot 目录 | `projects/test-workflow/artifacts/web-doc/system-manual/` |
| Manifest 中步骤数 | `26` |
| 用于 Word 的唯一截图数 | `11` 张 raw + `11` 张 annotated |
| Login 截图数量 | `2` 张：登录页、登录后首页 |
| System Management 截图数量 | `9` 张：入口、用户列表/新增/角色关联、角色列表/权限、菜单、字典、外部系统配置 |
| 新鲜 Documentation Capture | `7` 张通过真实页面重新采集 |
| 复用既有合格证据 | `4` 张；包括登录页、用户角色关联、角色权限、字典子项列表 |
| 是否生成 raw screenshots | Yes |
| 是否生成 annotated screenshots | Yes |
| 是否使用真实 Playwright 操作流程 | Yes；登录与页面导航使用真实页面语义定位，未修改业务源码 |

原始业务截图与文档截图分离；Word 使用 annotated 副本，raw 文件保留用于追溯。截图未包含密码明文、Token、Cookie、DevTools、Playwright Inspector 或失败提示。首页截图在页面稳定且错误 Toast 消失后重新采集。

## 6. DOCX 产物

| 项目 | 结果 |
| --- | --- |
| Word 标题 | `RSS调度系统操作手册` |
| 章节结构 | 封面、文档信息、目录、1. 文档说明、2. 系统登录、3. 系统管理、4. 常见操作说明与范围 |
| 系统管理子章节 | 进入系统管理、用户管理、角色管理、菜单管理、字典管理、外部系统配置 |
| Word 图片数量 | `11` |
| Word 是否包含目录 | Yes；包含 Word TOC 字段和静态字段结果，Heading 1/2/3 已建立 |
| Word 是否包含图注 | Yes；全文连续图号“图 1”至“图 11” |
| Word 是否实际嵌入图片 | Yes；OpenXML `word/media/` 有 `11` 个图片，均为 inline 图片 |
| Word 是否可编辑 | Yes；正文为可编辑文字，截图为内嵌图片 |
| DOCX | `E:\automated-testing\outputs\web-doc\RSS调度系统操作手册.docx` |
| DOCX 文件大小 | `2,604,841` bytes |
| DOCX OpenXML 校验 | PASS；ZIP/OpenXML、正文、章节、图片数量和安全扫描均通过 |

DOCX 页面 PNG 渲染未执行：当前环境没有 `soffice`、`libreoffice` 或 `lowriter` 可执行文件。已完成结构性 OpenXML、图片嵌入、Heading、目录字段、截图逐张视觉检查和截图安全检查；没有伪称通过 LibreOffice 页面级视觉渲染。

## 7. 安全、源码和 Git 核验

| 项目 | 结果 |
| --- | --- |
| 是否在 Word 中写入 `sa` | No |
| 是否在 Word 中写入真实密码 | No |
| 是否发现截图包含明文密码 | No |
| 密码/Token/Cookie 是否进入新增文档、Manifest、报告和脚本 | No；扫描 PASS |
| 是否修改 `src_m_ui` | No |
| WebSourceTreeHashAfter | `fc51ed641ed79de24674e9a9f10d84ff0448f0259c3221fe411e735f5c21c2d8` |
| WebSourceFileCountAfter | `643` |
| Hash 是否一致 | Yes |
| `git diff --check` | PASS |
| `origin/main...HEAD` | `0 0` |
| 是否提交 DOCX | No，本阶段未授权提交 |
| Commit hash / message | N/A |
| Push 是否成功 | N/A；未执行 Push |

## 8. WEB-DOC-002 状态

`WEB-DOC-002 = PASS（文档生成与结构/安全验收通过；页面级 DOCX 渲染因环境缺少 LibreOffice 未执行）`

文档覆盖范围严格停止在“登录 + 已有真实 PASS 证据的系统管理功能”，没有扩展到非系统管理业务模块。

## 9. 后续可扩展的系统管理文档候选

在形成对应真实 TestCase、PASS 结果和干净截图后，可继续补充：部门管理、系统配置、日志管理、密码重置、用户导入导出，以及当前被页面限制的字典删除行为说明。当前这些候选不属于本次 Word 正文。
