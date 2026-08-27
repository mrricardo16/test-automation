# 通用黑盒测试用例生成规范

本规范适用于 Web 管理端、企业后台、CRUD 系统、WMS/WCS/MES、SaaS 后台和内部业务系统。
业务对象、模块和字段均从项目输入动态读取；本规范不预设任何具体业务对象。

## 1. 设计模型

```text
PROJECT → MODULE → FEATURE → OPERATION → BUSINESS RULE → SCENARIO → TESTCASE
```

生成器先读取黑盒输入、页面能力、需求、交接资料和批准基线，再建立能力清单。只有能力清单表明某个操作存在时，才启用对应的测试设计模式。

支持识别的能力包括：CREATE、READ、UPDATE、DELETE、QUERY、PAGINATION、SORT、RESET、STATE_TRANSITION、RELATIONSHIP、PERMISSION、DOWNLOAD、UPLOAD、EXPORT、IMPORT、VISUAL_VALIDATION、WORKFLOW、SESSION。

## 2. Expected 判定策略

| ExpectedBasis | 含义 | 适用范围 |
| --- | --- | --- |
| DESIGN_DEFAULT | 从明确的功能操作语义直接得到的基础测试预期 | 查询、新增、修改、删除、重置、分页等通用行为 |
| AUTHORITATIVE_RULE | 来自需求、交接、批准基线或设计规范的业务特有规则 | 必填、唯一、长度、枚举、状态矩阵、关系、权限等 |
| PENDING_AUTHORITY | 存在多个合理结果且会改变 PASS/FAIL，而批准资料没有定义 | 幂等、删除后重建、会话失效时机、未定义状态转换等 |

`DESIGN_DEFAULT` 和 `AUTHORITATIVE_RULE` 都属于 `EXPECTED_CONFIRMED`。只有真正影响 Primary Assertion 的不确定性才能生成 `PENDING_AUTHORITY`。

### 2.1 通用默认预期

- QUERY：结果符合查询条件，不返回明显不匹配数据，查询不修改业务数据。
- 无匹配查询：结果集中不存在匹配记录；空表格、暂无数据或 0 条记录的具体文案不影响基础判定，除非资料明确要求。
- CREATE：合法且唯一的数据创建成功，重新查询可以读取对象，关键字段与提交值一致。
- UPDATE：合法字段保存成功，重新读取得到新值，非目标字段没有无关变化。
- DELETE：删除成功，对象不再作为正常有效对象出现在普通业务查询中；不推断物理删除还是软删除。
- RESET：筛选条件被清除，界面恢复该功能定义的默认查询状态；未被指定为目标的默认排序和分页不阻塞用例。
- PAGINATION：指定页显示对应数据集，当前筛选条件不被无故改变；未被指定为目标的 pageSize 不阻塞用例。

### 2.2 何时保留 Pending

以下问题可能改变主要判定，且资料没有定义时，才允许 Pending：重复删除是幂等成功还是报错、删除后能否复用唯一键、禁用后的在线会话何时失效、重复业务提交是拒绝/幂等/新建、状态 A 是否允许执行操作 B、无来源的具体长度边界或枚举集合。

默认排序、空态文案、软删除实现、日志内部形态等 Secondary Detail Unknown 不得阻塞基础用例；如有价值，应单独登记为非阻塞候选。

## 3. 防止生成器臆造规则

输入只说明“支持按名称查询”时，只生成“按名称查询”，Expected 为“返回符合名称查询条件的记录”。不得自行改写为精确、模糊、前缀、Contains、大小写敏感或 Trim 规则。只有输入明确支持这些能力时，才生成对应场景。

同理，不能因不知道物理删除/软删除、空态文案、默认排序或 pageSize 而将整个基础用例 Pending。

## 4. 权限适用性

每个项目记录 `PermissionApplicability=APPLICABLE|NOT_APPLICABLE|UNSPECIFIED`。

- 没有明确权限模型时，普通 CRUD 用例不得注入“管理员具备权限”，不得生成权限缺口。
- 存在角色、权限、菜单权限、操作权限或权限矩阵时，单独生成权限用例；普通功能用例仍保持业务目标单一。
- 运行环境、登录身份和项目级安全约束写入项目级前提，不在每条用例重复。

## 5. Atomicity 与数据设计

每条用例只能有一个 Objective 和一个 Primary Assertion。以下组合必须拆分：正常/重复/非法、删除后查询/重复删除/重新创建、默认/条件/分页/排序、正常修改/原值/非法字段。

前置条件只写该用例真正需要的业务状态；测试数据必须说明具体字段、值的来源、唯一性或边界依据。查询通常不需要 Cleanup；新增按夹具策略删除自有对象；修改必要时恢复原值；校验失败且无数据产生时不写机械清理。PostCondition 只在对验证有价值时显示。

禁止使用“准备隔离数据”“执行目标操作并记录结果”“按批准规则清理”“实际执行前补齐 Expected”等无业务内容的通用填充语句。

## 6. 执行资格与 Expected 分离

`ExpectedResult` 说明产品在业务上应达到的结果；`ExecutionEligibility` 说明本次是否安全、可自动化或需人工执行。高风险删除真实资源时，Expected 仍可采用 DESIGN_DEFAULT，但资格应为 `MANUAL_REQUIRED` 或 `BLOCKED`，不能把安全限制转换成 Expected Pending。

## 7. 生成流程

```text
LOAD BLACKBOX INPUTS
→ BUILD MODULE INVENTORY
→ BUILD FEATURE INVENTORY
→ BUILD CAPABILITY INVENTORY
→ EXTRACT AUTHORITATIVE RULES
→ APPLY GENERIC DESIGN DEFAULTS
→ BUILD APPLICABLE TEST DESIGN MODELS
→ GENERATE FINE-GRAINED SCENARIOS
→ SPLIT ATOMIC CASES
→ GENERATE EXPECTED
→ CLASSIFY EXPECTED BASIS
→ CLASSIFY EXECUTION ELIGIBILITY
→ CREATE TRUE GAPS ONLY
→ MATERIALIZE CATALOG
→ GENERATE REPORT
```

## 8. Synthetic Acceptance

模板级验收必须覆盖：A“按名称查询”无匹配算法时使用 DESIGN_DEFAULT；B“删除对象”无软/硬删除说明时使用 DESIGN_DEFAULT；C“删除后再次删除”无规则时 Pending；D 无权限模型时普通 CRUD 不含管理员前提且无权限缺口；E 有权限矩阵时生成独立权限用例；F 真实设备删除时 Expected 与执行资格分离；G 一个“正常修改+重复校验”组合用例必须被 `MULTIPLE_PRIMARY_RULES` 检出并拆分。
