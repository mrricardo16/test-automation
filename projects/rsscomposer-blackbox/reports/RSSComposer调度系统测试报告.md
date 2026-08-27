# RSSComposer 调度系统测试报告（Source-Assisted System Test）

> 本报告由通用黑盒测试用例规范和 RSSComposer 项目适配器生成。本次只材料化测试设计资产并重生成报告，没有执行 Formal Run、FAST、Regression、Runtime 或业务测试。

## 1. 测试基本信息

| 项目 | 内容 |
| --- | --- |
| 报告名称 | RSSComposer 调度系统测试报告 |
| 正式 Catalog 版本 | RSSCOMPOSER-BLACKBOX-FINE-GRAINED-CATALOG-V1 |
| 生成来源 | outputs/blackbox-testcase-generation-standard-rebuild/黑盒细粒度测试用例.json |
| 权威版本 | DEV-HANDOFF-REAL-20260824-105102 |
| Handoff Hash | d0e4c9ee346187cf3e0bb2723efa8925436263e535ba5924076ab019c5cb37e3 |
| Generation Standard | GENERIC-BLACKBOX-TESTCASE-GENERATION-STANDARD-V1 |
| 材料化时间 | 2026-08-27T02:01:15.800Z |
| 细粒度正式用例 | 当前原子用例 72 条；最终 Catalog 82 条；确认预期 54 条，pending 28 条 |
| 报告范围 | 仅展示当前正式 Catalog 的完整细粒度测试用例；历史执行记录不进入本报告正文 |

## 2. 测试结果概览

新细粒度用例全部为“尚未执行”，不继承任何历史 PASS、FAIL 或 ERROR。只有会改变主要 PASS/FAIL 判定的真实业务歧义才保留为 Pending；通用 CRUD 语义使用 DESIGN_DEFAULT。

| 指标 | 结果 |
| --- | --- |
| 主 Catalog 用例总数 | 72 |
| Expected 已确认 | 54 |
| Expected Pending | 28 |
| Expectation Gap | 28 |
| 新细粒度尚未执行 | 72 |
| 可自动执行设计资格 | 35 |
| 需人工执行设计资格 | 16 |
| 当前不可执行 | 28 |

## 3. 细粒度正式 Catalog

主表只显示正式 Catalog 中的细粒度 TestCase。每条用例一行，固定九列；pending 用例与确认预期用例共同可见，但 pending 不进入执行队列。

### 3.1 系统管理

#### 用户管理

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户查询-默认加载 | TC-USER-QUERY-001 | 用户管理页面已打开。 | 查询数据：页面当前可用的测试用户记录 | 1、打开用户管理页面。　2、等待初始查询完成。&#10;3、观察列表是否显示当前数据集。 | 1、查询结果符合当前查询页面可用数据集。&#10;2、不返回明显不匹配的用户管理。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 用户查询-无匹配结果 | TC-USER-QUERY-002 | 用户管理页面已打开。 | 查询条件：确认不存在的用户标识 | 1、在用户名查询框输入不存在的用户标识。　2、点击查询。&#10;3、检查结果集。 | 1、查询结果符合不存在的用户标识。&#10;2、不返回明显不匹配的用户管理。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 用户删除-删除后查询 | TC-USER-QUERY-003 | 测试用户已完成删除。 | 查询条件：已删除用户的唯一标识 | 1、按已删除用户的唯一标识查询。　2、检查正常业务结果集。 | 1、查询结果符合已删除用户标识。&#10;2、不返回明显不匹配的用户记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |

##### 新增

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户新增-合法数据创建成功 | TC-USER-CREATE-001 | 已进入系统管理的用户管理页面；测试用户名不存在。 | 用户名：BB25_USER_<RunId>　显示名称：自动化测试用户　密码：受控合法测试密码 | 1、使用管理员账号登录系统。&#10;2、展开“系统管理”并进入“用户管理”。&#10;3、点击“新增”。&#10;4、输入唯一用户名、显示名称和受控合法密码。&#10;5、点击“保存”。　6、根据用户名重新查询。&#10;【清理】删除本次创建的测试用户，并重新查询确认不存在。 | 1、保存成功。&#10;2、用户出现在列表。&#10;3、用户名和显示名称与输入一致。 | 尚未执行 / 可自动执行 | — | — |
| 用户新增-用户名重复校验 | TC-USER-CREATE-002 | 基准用户 BB25_USER_BASE 已存在且归属为测试数据。 | 用户名：BB25_USER_BASE　其他字段：合法显示名称和受控合法密码 | 1、点击“新增”。&#10;2、输入已存在的用户名 BB25_USER_BASE。&#10;3、填写其余合法字段。　4、点击“保存”。&#10;5、根据用户名重新查询。&#10;【清理】保留基准用户；查询并清理本次可能产生的测试残留。 | 1、创建失败。&#10;2、出现用户名重复提示。&#10;3、列表中只有原基准用户，不产生第二条相同用户名记录。 | 尚未执行 / 可自动执行 | — | — |
| 用户新增-密码低于最小长度 | TC-USER-CREATE-003 | 已获得密码最小长度 N 的批准规则。 | 用户名：BB25_USER_<RunId>　密码：长度 N-1 | 1、点击“新增”。　2、输入唯一用户名和合法显示名称。&#10;3、输入长度为 N-1 的密码。　4、点击“保存”。&#10;5、根据用户名查询。&#10;【清理】查询并删除本次可能产生的残留，确认用户名不存在。 | 1、创建失败。&#10;2、出现密码长度校验提示。&#10;3、列表中不存在该用户名。 | 尚未执行 / 可自动执行 | — | — |
| 用户新增-用户名为空 | TC-USER-CREATE-004 | 目标功能页面可访问。 | 用户名：空值　显示名称/密码：合法测试值 | 1、点击“新增”。　2、保持用户名为空。&#10;3、填写合法显示名称和受控合法密码。　4、点击“保存”。&#10;5、查询用户列表。&#10;【清理】确认列表没有本次新增残留。 | 1、保存被拒绝。&#10;2、出现用户名必填提示。&#10;3、列表不新增用户。 | 尚未执行 / 可自动执行 | — | — |
| 用户新增-显示名为空 | TC-USER-CREATE-005 | 目标功能页面可访问。 | 用户名：BB25_USER_<RunId>　显示名称：空值　密码：受控合法测试密码 | 1、点击“新增”。　2、输入唯一用户名。&#10;3、保持显示名称为空。　4、输入受控合法密码并保存。&#10;5、根据用户名查询。&#10;【清理】查询并确认没有本次新增残留。 | 1、保存被拒绝。&#10;2、出现显示名称必填提示。&#10;3、列表不新增该用户名。 | 尚未执行 / 可自动执行 | — | — |
| 用户删除-删除后同唯一键重建 | TC-USER-CREATE-006 | 原测试用户已完成删除。 | 唯一字段：原测试用户的唯一值 | 1、打开新增页面。&#10;2、使用原测试用户的唯一值提交合法数据。&#10;3、重新查询该唯一值。&#10;【清理】按批准规则清理重建对象。 | 【待确认】删除后是否允许使用原唯一键重新创建对象的规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 用户新增-显示名超长 | TC-USER-CREATE-007 | 用户管理页面可访问。 | 测试输入：批准规则中的该场景数据 | 1、进入用户管理功能。&#10;2、按照“用户新增-显示名超长”准备对应测试输入。&#10;3、提交或执行当前场景操作。&#10;4、检查页面结果和业务对象状态。&#10;【清理】按本用例实际产生的数据执行清理或恢复。 | 【待确认】未提供显示名最大长度和超长拒绝 Expected。 | 尚未执行 / 当前不可执行 | — | — |
| 用户新增-用户名长度边界 | TC-USER-CREATE-008 | 用户管理页面可访问。 | 测试输入：批准规则中的该场景数据 | 1、进入用户管理功能。&#10;2、按照“用户新增-用户名长度边界”准备对应测试输入。&#10;3、提交或执行当前场景操作。&#10;4、检查页面结果和业务对象状态。&#10;【清理】按本用例实际产生的数据执行清理或恢复。 | 【待确认】未提供用户名最小/最大长度，不能猜测 min/max。 | 尚未执行 / 当前不可执行 | — | — |
| 用户新增-非法字符 | TC-USER-CREATE-009 | 用户管理页面可访问。 | 测试输入：批准规则中的该场景数据 | 1、进入用户管理功能。&#10;2、按照“用户新增-非法字符”准备对应测试输入。&#10;3、提交或执行当前场景操作。&#10;4、检查页面结果和业务对象状态。&#10;【清理】按本用例实际产生的数据执行清理或恢复。 | 【待确认】未提供允许字符集合和错误提示合同。 | 尚未执行 / 当前不可执行 | — | — |

##### 修改

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户修改-合法字段保存 | TC-USER-UPDATE-001 | 存在本轮测试自有且可修改的用户记录。 | 修改字段：一个允许修改的合法字段值 | 1、打开测试用户编辑页面。　2、修改一个合法字段。&#10;3、保存。　4、重新查询并读取该用户。&#10;【清理】将修改字段恢复原值并重新查询确认。 | 1、合法字段保存成功。&#10;2、重新读取得到修改后的值。&#10;3、非目标字段没有无关变化。 | 尚未执行 / 可自动执行 | — | — |
| 用户修改-唯一字段重复校验 | TC-USER-UPDATE-002 | 存在测试用户 A；存在另一条具有唯一值的基准用户 B。 | 唯一字段：用户 B 的唯一值 | 1、打开测试用户 A 的编辑页面。&#10;2、将唯一字段改为用户 B 的值。&#10;3、保存并重新查询用户 A。&#10;【清理】确认用户 A 和 B 的原值未被误修改。 | 【待确认】唯一字段修改后的重复值处理规则和失败后原值保持规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 状态

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户状态-禁用启用与登录影响 | TC-USER-UPDATE-003 | 用户管理页面可访问。 | 测试输入：批准规则中的该场景数据 | 1、进入用户管理功能。&#10;2、按照“用户状态-禁用启用与登录影响”准备对应测试输入。&#10;3、提交或执行当前场景操作。&#10;4、检查页面结果和业务对象状态。&#10;【清理】按本用例实际产生的数据执行清理或恢复。 | 【待确认】未定义禁用、启用、在线会话和重新登录的完整状态矩阵。 | 尚未执行 / 当前不可执行 | — | — |

##### 删除

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户删除-正常删除 | TC-USER-DELETE-001 | 存在本轮测试自有且可删除的用户记录。 | 测试对象：本轮测试自有用户记录 | 1、选中测试用户。　2、点击删除并确认。&#10;3、观察删除结果。 | 1、删除操作成功。&#10;2、用户记录不再作为正常有效对象出现在普通业务查询结果中。 | 尚未执行 / 可自动执行 | — | — |
| 用户删除-重复删除 | TC-USER-DELETE-002 | 同一测试用户已完成第一次删除。 | 测试对象：第一次删除后的用户标识 | 1、再次提交同一用户的删除操作。&#10;2、记录页面反馈和查询结果。 | 【待确认】重复删除的幂等成功、对象不存在提示或业务错误规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 筛选重置

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户查询-清空筛选条件 | TC-USER-RESET-001 | 用户管理页面已打开。 | 筛选条件：一个可以产生结果变化的合法条件 | 1、输入筛选条件并执行查询。　2、点击重置或清空筛选。&#10;3、观察筛选控件和查询结果。 | 1、筛选条件被清除。&#10;2、界面恢复该功能定义的默认查询状态。 | 尚未执行 / 可自动执行 | — | — |

##### 分页

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户查询-分页切页 | TC-USER-PAGE-001 | 用户管理页面已打开；测试数据足以形成至少两页结果。 | 查询数据：覆盖多个页面的测试用户记录 | 1、执行合法查询。　2、切换到另一页。&#10;3、检查当前页数据和筛选条件。 | 1、指定页显示该页对应的数据集。&#10;2、当前生效的筛选条件未被无故改变。 | 尚未执行 / 可自动执行 | — | — |

#### 用户角色关系

##### 关系

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 用户角色关联-保存后重新查询 | TC-URB-BIND-001 | 测试用户和测试角色已存在；记录运行前关联状态。 | 用户：BB25_USER_<RunId>　角色：BB25_TEST_ROLE | 1、选择测试用户。　2、选择测试角色。&#10;3、保存关联。　4、刷新或重新查询用户角色关系。&#10;5、恢复运行前关联状态。&#10;【清理】移除本次新增关联或恢复原关联，并重新查询确认。 | 1、保存成功。&#10;2、重新查询显示已保存关联。&#10;3、恢复后关联回到运行前状态。 | 尚未执行 / 可自动执行 | — | — |
| 角色关联-解除关联 | TC-URB-UNBIND-001 | 测试对象和关联对象已存在；记录运行前关联状态。 | 关联对象：本轮测试对象关系 | 1、打开关联维护页面。　2、解除一条已存在的测试关联。&#10;3、保存并重新查询关联。&#10;【清理】恢复运行前关联状态。 | 【待确认】解除关联后的权限刷新和在线会话生效时机未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 角色关联-重复绑定 | TC-URB-BIND-002 | 测试关联已存在。 | 关联关系：已存在的测试关联 | 1、再次提交同一关联。　2、记录保存结果和关系数量。&#10;【清理】保持原关联状态。 | 【待确认】重复绑定应拒绝、幂等成功或产生错误的规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 权限

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 角色关联-权限变化生效 | TC-URB-PERMISSION-001 | 存在具备不同权限的测试身份；测试对象关系已准备。 | 权限变更：批准的测试角色权限变化 | 1、调整测试身份的角色关联。　2、刷新页面或重新登录。&#10;3、访问受影响功能并记录结果。&#10;【清理】恢复测试身份的原角色关联。 | 【待确认】关联权限变化对菜单、页面、按钮和在线会话的生效时机未获批准。 | 尚未执行 / 当前不可执行 | — | — |

#### 角色管理

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 角色查询-按名称查询 | TC-ROLE-QUERY-001 | 角色管理页面已打开；存在可查询的测试角色。 | 查询条件：测试角色名称 | 1、输入角色名称查询条件。　2、点击查询。&#10;3、检查结果是否符合查询条件。 | 1、查询结果符合角色名称查询条件。&#10;2、不返回明显不匹配的角色记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |

##### 新增

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 角色新增-合法数据创建 | TC-ROLE-CREATE-001 | 角色管理页面已打开；测试角色名称当前不存在。 | 角色名称：本轮唯一测试角色名称 | 1、点击新增。　2、输入合法且唯一的角色数据。&#10;3、保存。　4、重新查询该角色。&#10;【清理】删除本轮测试角色并重新查询确认。 | 1、合法且唯一的角色记录创建成功。&#10;2、重新查询可以读取该对象。&#10;3、关键字段与提交值一致。 | 尚未执行 / 可自动执行 | — | — |

##### 权限

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 权限访问-菜单拒绝 | TC-ROLE-PERMISSION-001 | 权限模型中已存在无目标权限的测试身份。 | 权限身份：无目标权限测试身份 | 1、使用无目标权限测试身份检查菜单访问。&#10;2、记录访问结果和页面反馈。 | 【待确认】菜单层级的拒绝合同和可观察结果未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 权限访问-页面拒绝 | TC-ROLE-PERMISSION-002 | 权限模型中已存在无目标权限的测试身份。 | 权限身份：无目标权限测试身份 | 1、使用无目标权限测试身份检查页面访问。&#10;2、记录访问结果和页面反馈。 | 【待确认】页面层级的拒绝合同和可观察结果未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 权限访问-按钮拒绝 | TC-ROLE-PERMISSION-003 | 权限模型中已存在无目标权限的测试身份。 | 权限身份：无目标权限测试身份 | 1、使用无目标权限测试身份检查按钮访问。&#10;2、记录访问结果和页面反馈。 | 【待确认】按钮层级的拒绝合同和可观察结果未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 权限访问-直接 URL拒绝 | TC-ROLE-PERMISSION-004 | 权限模型中已存在无目标权限的测试身份。 | 权限身份：无目标权限测试身份 | 1、使用无目标权限测试身份检查直接 URL访问。&#10;2、记录访问结果和页面反馈。 | 【待确认】直接 URL层级的拒绝合同和可观察结果未获批准。 | 尚未执行 / 当前不可执行 | — | — |

### 3.2 任务管理

#### 任务新增

##### 新增

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务新增-合法依赖创建成功 | TC-TNEW-CREATE-001 | 隔离模板、车辆、站点和楼层均已批准并可清理。 | 模板/车辆/站点/楼层：批准的隔离依赖　任务参数：BB25_TASK_<RunId> | 1、进入任务管理并点击“新增”。&#10;2、依次选择合法模板、车辆、站点和楼层。&#10;3、填写任务参数并提交。　4、根据任务标识查询列表。&#10;【清理】按批准方案终止或删除测试任务，并查询确认已清理。 | 1、任务创建成功。&#10;2、生成唯一任务标识。&#10;3、任务出现在列表并关联正确依赖。 | 尚未执行 / 需人工执行 | — | — |
| 任务新增-无效模板引用校验 | TC-TNEW-CREATE-002 | 其余任务依赖使用批准的合法隔离数据。 | 模板：无效模板标识　其余依赖：批准的合法隔离依赖 | 1、选择或输入模板为无效值。&#10;2、填写其余合法任务依赖和参数。　3、点击保存。&#10;4、查询任务列表。&#10;【清理】查询并清理本次可能产生的任务残留。 | 1、无效模板不产生任务。 | 尚未执行 / 需人工执行 | — | — |
| 任务新增-无效车辆引用校验 | TC-TNEW-CREATE-003 | 其余任务依赖使用批准的合法隔离数据。 | 车辆：无效车辆标识　其余依赖：批准的合法隔离依赖 | 1、选择或输入车辆为无效值。&#10;2、填写其余合法任务依赖和参数。　3、点击保存。&#10;4、查询任务列表。&#10;【清理】查询并清理本次可能产生的任务残留。 | 1、无效车辆不产生任务。 | 尚未执行 / 需人工执行 | — | — |
| 任务新增-无效站点引用校验 | TC-TNEW-CREATE-004 | 其余任务依赖使用批准的合法隔离数据。 | 站点：无效站点标识　其余依赖：批准的合法隔离依赖 | 1、选择或输入站点为无效值。&#10;2、填写其余合法任务依赖和参数。　3、点击保存。&#10;4、查询任务列表。&#10;【清理】查询并清理本次可能产生的任务残留。 | 1、无效站点不产生任务。 | 尚未执行 / 需人工执行 | — | — |
| 任务新增-无效楼层引用校验 | TC-TNEW-CREATE-005 | 其余任务依赖使用批准的合法隔离数据。 | 楼层：无效楼层标识　其余依赖：批准的合法隔离依赖 | 1、选择或输入楼层为无效值。&#10;2、填写其余合法任务依赖和参数。　3、点击保存。&#10;4、查询任务列表。&#10;【清理】查询并清理本次可能产生的任务残留。 | 1、无效楼层不产生任务。 | 尚未执行 / 需人工执行 | — | — |
| 任务新增-重复任务 | TC-TNEW-CREATE-006 | 已存在一条相同业务依赖的基准任务。 | 任务依赖：与基准任务相同的合法依赖 | 1、打开任务新增页面。　2、填写与基准任务相同的业务依赖。&#10;3、提交并查询任务列表。&#10;【清理】按批准方案清理可能产生的任务。 | 【待确认】重复任务应拒绝、幂等成功或新建任务的规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 任务新增-缺少必填依赖 | TC-TNEW-CREATE-007 | 任务新增页面已打开。 | 必填依赖：缺少一个页面标示为必填的依赖 | 1、打开任务新增页面。　2、保持一个必填依赖为空。&#10;3、填写其余合法数据并保存。　4、查询任务列表。 | 【待确认】缺少该依赖时的拒绝提示和是否产生任务的业务合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |

#### 任务取消

##### 状态

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务状态-允许取消的任务 | TC-TCANCEL-CANCEL-001 | 已有批准的隔离任务状态夹具。 | 任务状态：批准的允许取消的任务状态　任务归属：测试自有任务 | 1、选择处于允许取消的任务状态的测试任务。&#10;2、执行取消操作。　3、重新查询任务状态。&#10;【清理】恢复或清理测试任务状态，并重新查询确认。 | 1、任务状态变为已取消。 | 尚未执行 / 需人工执行 | — | — |
| 任务状态-禁止取消的终态任务 | TC-TCANCEL-CANCEL-002 | 已有批准的隔离任务状态夹具。 | 任务状态：批准的禁止取消的终态任务状态　任务归属：测试自有任务 | 1、选择处于禁止取消的终态任务状态的测试任务。&#10;2、执行取消操作。　3、重新查询任务状态。&#10;【清理】恢复或清理测试任务状态，并重新查询确认。 | 1、取消入口不可用或提交被拒绝。&#10;2、任务状态保持终态。 | 尚未执行 / 需人工执行 | — | — |
| 任务状态-取消状态矩阵 | TC-TCANCEL-CANCEL-003 | 已准备批准的测试任务状态夹具。 | 任务状态：待确认的状态矩阵样本 | 1、选择目标状态的测试任务。　2、执行取消操作。&#10;3、重新查询状态并记录结果。&#10;【清理】恢复或清理测试任务。 | 【待确认】任务状态与取消操作的允许矩阵未获批准。 | 尚未执行 / 当前不可执行 | — | — |

#### 任务重发

##### 状态

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务状态-允许重发的任务 | TC-TRESEND-RESEND-001 | 已有批准的隔离任务状态夹具。 | 任务状态：批准的允许重发的任务状态　任务归属：测试自有任务 | 1、选择处于允许重发的任务状态的测试任务。&#10;2、执行重发操作。　3、重新查询任务状态。&#10;【清理】恢复或清理测试任务状态，并重新查询确认。 | 1、重发成功。&#10;2、任务产生可追踪的重发结果。 | 尚未执行 / 需人工执行 | — | — |
| 任务状态-禁止重发的任务 | TC-TRESEND-RESEND-002 | 已有批准的隔离任务状态夹具。 | 任务状态：批准的禁止重发的任务状态　任务归属：测试自有任务 | 1、选择处于禁止重发的任务状态的测试任务。&#10;2、执行重发操作。　3、重新查询任务状态。&#10;【清理】恢复或清理测试任务状态，并重新查询确认。 | 1、重发入口不可用或提交被拒绝。&#10;2、原任务状态保持。 | 尚未执行 / 需人工执行 | — | — |

#### 任务查询

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务查询-默认加载 | TC-TQUERY-QUERY-001 | 任务查询页面已打开。 | 查询数据：项目测试任务数据 | 1、打开任务查询页面。　2、等待初始查询完成。&#10;3、检查当前数据集。 | 1、查询结果符合当前任务查询页面数据集。&#10;2、不返回明显不匹配的任务记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 任务查询-按条件查询 | TC-TQUERY-QUERY-002 | 任务查询页面已打开；存在可区分的测试任务数据。 | 查询条件：一个已知任务属性值 | 1、输入查询条件。　2、点击查询。&#10;3、检查结果集。 | 1、查询结果符合已知任务查询条件。&#10;2、不返回明显不匹配的任务记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 任务查询-排序 | TC-TQUERY-QUERY-003 | 任务查询页面已打开；页面显示可排序字段。 | 排序数据：可区分排序顺序的任务记录 | 1、选择一个排序字段和方向。　2、执行查询或排序。&#10;3、检查结果顺序。 | 【待确认】排序字段、方向和相同值时的稳定顺序未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 分页

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务查询-分页 | TC-TQUERY-PAGE-001 | 查询结果足以形成至少两页。 | 查询数据：覆盖多个页面的任务记录 | 1、执行查询。　2、切换到另一页。&#10;3、检查页内数据和筛选条件。 | 1、指定页显示该页对应的数据集。&#10;2、当前生效的筛选条件未被无故改变。 | 尚未执行 / 可自动执行 | — | — |

#### 任务生命周期

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务生命周期-新增后查询 | TC-TLIFE-QUERY-001 | 合法任务依赖已准备；测试任务尚不存在。 | 任务标识：本轮唯一任务标识 | 1、创建一条合法测试任务。　2、按任务标识重新查询。&#10;3、检查关键字段。&#10;【清理】按批准方案清理测试任务。 | 1、查询结果符合刚创建任务的唯一标识。&#10;2、不返回明显不匹配的任务记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |

##### 状态

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务生命周期-取消后查询 | TC-TLIFE-CANCEL-001 | 存在可取消的测试任务。 | 任务对象：本轮测试任务 | 1、执行取消操作。　2、重新查询任务。&#10;3、记录状态和列表可见性。&#10;【清理】按批准方案清理或恢复测试任务。 | 【待确认】取消后的状态、查询可见性和终态清理规则未获批准。 | 尚未执行 / 当前不可执行 | — | — |

### 3.3 车辆管理

#### 车辆管理

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 车辆查询-按编号查询 | TC-VEH-QUERY-001 | 车辆管理页面已打开；存在测试车辆记录。 | 查询条件：测试车辆编号 | 1、输入车辆编号查询条件。　2、点击查询。&#10;3、检查结果集。 | 1、查询结果符合车辆编号查询条件。&#10;2、不返回明显不匹配的车辆记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 车辆查询-无匹配结果 | TC-VEH-QUERY-002 | 车辆管理页面已打开。 | 查询条件：确认不存在的车辆标识 | 1、输入不存在的车辆标识。　2、点击查询。&#10;3、检查结果集中没有匹配记录。 | 1、查询结果符合不存在的车辆标识。&#10;2、不返回明显不匹配的车辆记录。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |

##### 新增

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 车辆新增-合法车辆 | TC-VEH-CREATE-001 | 测试车辆编号不在运营数据中。 | 车辆编号：BB25_VEHICLE_<RunId>　车辆类型：批准车辆类型 | 1、点击“新增”。　2、输入合法车辆编号、名称和类型。&#10;3、点击保存。　4、按车辆编号重新查询。&#10;【清理】删除本次测试车辆并查询确认不存在。 | 1、保存成功。&#10;2、车辆出现在列表。&#10;3、字段值与输入一致。 | 尚未执行 / 需人工执行 | — | — |
| 车辆新增-编号重复 | TC-VEH-CREATE-002 | 基准车辆编号已存在且归属明确。 | 车辆编号：BB25_VEHICLE_BASE　车辆类型：批准合法类型 | 1、点击“新增”。　2、输入已存在车辆编号。&#10;3、填写其余合法字段。　4、点击保存。&#10;5、重新查询车辆列表。&#10;【清理】保留基准车辆并清理本次残留。 | 1、保存被拒绝。&#10;2、出现编号重复提示。&#10;3、列表中不产生第二辆相同编号车辆。 | 尚未执行 / 需人工执行 | — | — |
| 车辆新增-非法车辆类型 | TC-VEH-CREATE-003 | 已批准非法类型输入规则。 | 车辆编号：BB25_VEHICLE_<RunId>　车辆类型：批准的非法枚举值 | 1、点击“新增”。　2、输入唯一车辆编号。&#10;3、选择或输入非法车辆类型。　4、点击保存。&#10;5、重新查询车辆列表。&#10;【清理】查询并清理本次可能产生的车辆残留。 | 1、保存被拒绝。&#10;2、出现车辆类型校验提示。&#10;3、列表中不产生该车辆。 | 尚未执行 / 需人工执行 | — | — |
| 车辆新增-编号为空 | TC-VEH-CREATE-004 | 车辆新增页面已打开。 | 车辆编号：空值 | 1、保持车辆编号为空。　2、填写其余合法字段。&#10;3、保存并查询车辆列表。 | 【待确认】车辆编号为空时的必填校验合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 车辆新增-名称为空 | TC-VEH-CREATE-005 | 车辆新增页面已打开。 | 车辆名称：空值 | 1、保持车辆名称为空。　2、填写其余合法字段。&#10;3、保存并查询车辆列表。 | 【待确认】车辆名称为空时的必填校验合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 车辆新增-编号长度边界 | TC-VEH-CREATE-006 | 车辆新增页面已打开；已取得批准的编号长度边界。 | 车辆编号：批准边界值及越界值 | 1、分别输入批准边界值和越界值。　2、填写其余合法字段。&#10;3、分别保存并查询结果。 | 【待确认】车辆编号长度边界和越界处理合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 车辆新增-非法字符 | TC-VEH-CREATE-007 | 车辆新增页面已打开；已取得批准的字符集合。 | 车辆编号：批准规则中的非法字符样本 | 1、输入含非法字符的车辆编号。　2、填写其余合法字段。&#10;3、保存并查询车辆列表。 | 【待确认】车辆编号允许字符集合和拒绝行为未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 修改

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 车辆修改-合法字段保存 | TC-VEH-UPDATE-001 | 存在本轮测试自有且可修改的车辆记录。 | 修改字段：一个允许修改的合法字段值 | 1、打开测试车辆编辑页面。　2、修改一个合法字段。&#10;3、保存并重新查询车辆。&#10;【清理】恢复原值并重新查询确认。 | 1、合法字段保存成功。&#10;2、重新读取得到修改后的值。&#10;3、非目标字段没有无关变化。 | 尚未执行 / 可自动执行 | — | — |
| 车辆修改-非法字段 | TC-VEH-UPDATE-002 | 存在可修改的测试车辆。 | 修改字段：批准规则之外的字段或值 | 1、打开测试车辆编辑页面。　2、输入非法字段值。&#10;3、保存并重新查询车辆。&#10;【清理】确认原值未被误修改。 | 【待确认】车辆字段可修改范围和非法值处理合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 删除

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 车辆删除-正常删除后查询 | TC-VEH-DELETE-001 | 存在本轮测试自有且可安全删除的车辆记录；已确认不会影响真实设备。 | 测试对象：本轮测试自有车辆记录 | 1、删除测试车辆。　2、按车辆标识重新查询。&#10;3、检查正常业务结果集。 | 1、删除操作成功。&#10;2、车辆记录不再作为正常有效对象出现在普通业务查询结果中。 | 尚未执行 / 需人工执行 | — | — |

### 3.4 监控管理

#### 监控看板

##### 视觉检查

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 监控看板-地图与状态人工复核 | TC-MON-VISUAL-001 | 已登录监控看板；批准的监控数据源可用或明确记录不可用状态。 | 监控数据：批准的地图、任务、车辆和充电状态 | 1、打开监控看板。　2、等待地图和状态区域加载。&#10;3、逐项复核地图、任务、车辆和充电状态。&#10;4、记录空态、错误和异常布局。 | 1、地图、任务、车辆和充电状态符合批准视觉基线。&#10;2、依赖不可用时显示可诊断空态或错误。 | 尚未执行 / 需人工执行 | — | — |

### 3.5 日志管理

#### 日志下载

##### 下载

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 日志下载-批准非敏感日志包 | TC-LOG-DOWNLOAD-001 | 已进入日志管理；批准的非敏感日志包出现在列表。 | 日志包：批准的非敏感测试日志包 | 1、查询日志包列表。　2、选择批准的非敏感日志包。&#10;3、点击下载。　4、复核下载来源和脱敏状态。&#10;【清理】删除临时下载文件和敏感中间产物。 | 1、下载内容来自列表中批准的日志包。&#10;2、不接受任意文件路径。&#10;3、敏感内容不进入报告。 | 尚未执行 / 需人工执行 | — | — |

### 3.6 统计分析

#### 统计查询

##### 查询

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 统计查询-合法时间范围有数据 | TC-STAT-QUERY-001 | 已进入统计查询页面；批准的有数据时间范围和统计源数据已准备。 | 时间范围：批准的有数据时间范围　筛选条件：批准的合法筛选条件 | 1、进入统计查询。　2、输入批准的有数据时间范围。&#10;3、输入合法筛选条件。　4、点击查询。 | 1、显示统计结果。&#10;2、字段、单位和时间范围符合批准基线。 | 尚未执行 / 当前不可执行 | — | — |
| 统计查询-合法时间范围无数据 | TC-STAT-QUERY-002 | 已进入统计查询页面；批准的无数据时间范围和空态规则已准备。 | 时间范围：批准的合法无数据时间范围　筛选条件：批准的合法筛选条件 | 1、进入统计查询。　2、输入批准的无数据时间范围。&#10;3、点击查询。 | 1、显示批准的无数据空态。&#10;2、不显示伪造统计。&#10;3、不修改业务数据。 | 尚未执行 / 当前不可执行 | — | — |
| 统计查询-默认加载 | TC-STAT-QUERY-003 | 统计查询页面已打开。 | 统计数据：批准的只读统计数据 | 1、打开统计查询页面。　2、等待初始查询完成。&#10;3、检查统计结果或无数据状态。 | 1、查询结果符合当前统计页面默认查询。&#10;2、不返回明显不匹配的统计结果。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 统计查询-按时间范围查询 | TC-STAT-QUERY-004 | 统计查询页面已打开；已准备合法时间范围和统计数据。 | 时间范围：批准的合法时间范围 | 1、输入合法时间范围。　2、点击查询。&#10;3、检查统计结果属于该时间范围。 | 1、查询结果符合合法时间范围。&#10;2、不返回明显不匹配的统计结果。&#10;3、查询不修改业务数据。 | 尚未执行 / 可自动执行 | — | — |
| 统计查询-排序 | TC-STAT-QUERY-005 | 统计页面显示可排序字段。 | 排序数据：可区分排序顺序的统计结果 | 1、选择排序字段和方向。　2、执行排序。&#10;3、检查结果顺序。 | 【待确认】统计结果排序字段、方向和稳定顺序未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 校验

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 统计查询-时间范围边界 | TC-STAT-VALIDATE-001 | 统计查询页面已打开。 | 时间范围：开始等于结束、开始晚于结束 | 1、分别输入两种时间范围。　2、分别点击查询。&#10;3、记录校验结果。 | 【待确认】时间范围边界是否合法以及无效时的拒绝合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 统计查询-缺少时间条件 | TC-STAT-VALIDATE-002 | 统计查询页面已打开。 | 时间条件：缺少开始或结束时间 | 1、清空一个时间字段。　2、点击查询。&#10;3、记录校验结果。 | 【待确认】缺少时间字段时的校验合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 统计查询-超出允许范围 | TC-STAT-VALIDATE-003 | 统计查询页面已打开；已取得允许时间范围规则。 | 时间范围：批准范围之外的时间值 | 1、输入超出允许范围的时间。　2、点击查询。&#10;3、记录校验结果。 | 【待确认】超出允许时间范围时的拒绝或裁剪行为未获批准。 | 尚未执行 / 当前不可执行 | — | — |
| 统计查询-非法格式 | TC-STAT-VALIDATE-004 | 统计查询页面已打开。 | 筛选字段：批准规则中的非法格式样本 | 1、输入非法格式筛选值。　2、点击查询。&#10;3、记录校验结果。 | 【待确认】非法筛选格式和拒绝提示合同未获批准。 | 尚未执行 / 当前不可执行 | — | — |

##### 筛选重置

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 统计查询-组合条件重置 | TC-STAT-RESET-001 | 统计查询页面已打开。 | 筛选条件：两个合法组合筛选条件 | 1、输入组合筛选条件并查询。　2、点击重置。&#10;3、检查筛选控件和默认查询状态。 | 1、筛选条件被清除。&#10;2、界面恢复该功能定义的默认查询状态。 | 尚未执行 / 可自动执行 | — | — |

##### 分页

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 统计查询-分页 | TC-STAT-PAGE-001 | 统计结果足以形成至少两页。 | 统计数据：覆盖多个页面的只读统计数据 | 1、执行统计查询。　2、切换到另一页。&#10;3、检查页内数据和筛选条件。 | 1、指定页显示该页对应的数据集。&#10;2、当前生效的筛选条件未被无故改变。 | 尚未执行 / 可自动执行 | — | — |


## 4. 模块状态汇总

| 模块 | 主 Catalog 用例 | Expected 已确认 | Expected Pending | 尚未执行 |
| --- | --- | --- | --- | --- |
| 系统管理 | 29 | 15 | 14 | 29 |
| 任务管理 | 18 | 13 | 5 | 18 |
| 车辆管理 | 12 | 7 | 5 | 12 |
| 监控管理 | 1 | 1 | 0 | 1 |
| 日志管理 | 1 | 1 | 0 | 1 |
| 统计分析 | 11 | 6 | 5 | 11 |





## 5. Current Effective State（Source-Assisted Final Catalog）

| 指标 | 数值 |
| --- | --- |
| 原子 Catalog 用例 | 72 |
| 最终 Catalog 用例 | 82 |
| 确认 Expected | 54 |
| Pending Expected | 28 |
| AUTO_ALLOWED | 35 |
| MANUAL_REQUIRED | 16 |
| NOT_EXECUTABLE / Expected 未确认 | 28 |
| Formal Manifest | 0 |
| Formal Business Case 已执行 | 0 |

## 6. Expectation Gap（Resolution Audit）

本轮仅以流程册关闭有明确业务预期的生命周期 Gap；源码发现不会关闭 Gap。剩余 28 条 Gap 保留为 Expected 阻断。

| GapId | TestCaseId | 分类 | 原因 | 状态 |
| --- | --- | --- | --- | --- |
| GAP-GEN-USER-UPDATE-DUPLICATE-001 | TC-USER-UPDATE-002 | TRUE_AMBIGUITY | 唯一字段修改后的重复值处理规则和失败后原值保持规则未获批准。 | STILL_PENDING |
| GAP-GEN-USER-DELETE-REPEAT-001 | TC-USER-DELETE-002 | TRUE_AMBIGUITY | 重复删除的幂等成功、对象不存在提示或业务错误规则未获批准。 | STILL_PENDING |
| GAP-GEN-USER-DELETE-RECREATE-001 | TC-USER-CREATE-006 | TRUE_AMBIGUITY | 删除后是否允许使用原唯一键重新创建对象的规则未获批准。 | STILL_PENDING |
| GAP-GEN-ROLE-RELATION-REMOVE-001 | TC-URB-UNBIND-001 | TRUE_AMBIGUITY | 解除关联后的权限刷新和在线会话生效时机未获批准。 | STILL_PENDING |
| GAP-GEN-ROLE-RELATION-DUPLICATE-001 | TC-URB-BIND-002 | TRUE_AMBIGUITY | 重复绑定应拒绝、幂等成功或产生错误的规则未获批准。 | STILL_PENDING |
| GAP-GEN-ROLE-RELATION-EFFECTIVE-001 | TC-URB-PERMISSION-001 | TRUE_AMBIGUITY | 关联权限变化对菜单、页面、按钮和在线会话的生效时机未获批准。 | STILL_PENDING |
| GAP-GEN-PERMISSION-1 | TC-ROLE-PERMISSION-001 | TRUE_AMBIGUITY | 菜单层级的拒绝合同和可观察结果未获批准。 | STILL_PENDING |
| GAP-GEN-PERMISSION-2 | TC-ROLE-PERMISSION-002 | TRUE_AMBIGUITY | 页面层级的拒绝合同和可观察结果未获批准。 | STILL_PENDING |
| GAP-GEN-PERMISSION-3 | TC-ROLE-PERMISSION-003 | TRUE_AMBIGUITY | 按钮层级的拒绝合同和可观察结果未获批准。 | STILL_PENDING |
| GAP-GEN-PERMISSION-4 | TC-ROLE-PERMISSION-004 | TRUE_AMBIGUITY | 直接 URL层级的拒绝合同和可观察结果未获批准。 | STILL_PENDING |
| GAP-GEN-TASK-QUERY-SORT-001 | TC-TQUERY-QUERY-003 | TRUE_AMBIGUITY | 排序字段、方向和相同值时的稳定顺序未获批准。 | STILL_PENDING |
| GAP-GEN-TASK-DUPLICATE-001 | TC-TNEW-CREATE-006 | TRUE_AMBIGUITY | 重复任务应拒绝、幂等成功或新建任务的规则未获批准。 | STILL_PENDING |
| GAP-GEN-TASK-REQUIRED-001 | TC-TNEW-CREATE-007 | TRUE_AMBIGUITY | 缺少该依赖时的拒绝提示和是否产生任务的业务合同未获批准。 | STILL_PENDING |
| GAP-GEN-TASK-STATE-001 | TC-TCANCEL-CANCEL-003 | TRUE_AMBIGUITY | 任务状态与取消操作的允许矩阵未获批准。 | STILL_PENDING |
| GAP-GEN-VEHICLE-REQUIRED-ID-001 | TC-VEH-CREATE-004 | TRUE_AMBIGUITY | 车辆编号为空时的必填校验合同未获批准。 | STILL_PENDING |
| GAP-GEN-VEHICLE-REQUIRED-NAME-001 | TC-VEH-CREATE-005 | TRUE_AMBIGUITY | 车辆名称为空时的必填校验合同未获批准。 | STILL_PENDING |
| GAP-GEN-VEHICLE-LENGTH-001 | TC-VEH-CREATE-006 | TRUE_AMBIGUITY | 车辆编号长度边界和越界处理合同未获批准。 | STILL_PENDING |
| GAP-GEN-VEHICLE-CHARSET-001 | TC-VEH-CREATE-007 | TRUE_AMBIGUITY | 车辆编号允许字符集合和拒绝行为未获批准。 | STILL_PENDING |
| GAP-GEN-VEHICLE-UPDATE-INVALID-001 | TC-VEH-UPDATE-002 | TRUE_AMBIGUITY | 车辆字段可修改范围和非法值处理合同未获批准。 | STILL_PENDING |
| GAP-GEN-STATS-SORT-001 | TC-STAT-QUERY-005 | TRUE_AMBIGUITY | 统计结果排序字段、方向和稳定顺序未获批准。 | STILL_PENDING |
| GAP-GEN-STATS-RANGE-001 | TC-STAT-VALIDATE-001 | TRUE_AMBIGUITY | 时间范围边界是否合法以及无效时的拒绝合同未获批准。 | STILL_PENDING |
| GAP-GEN-STATS-MISSING-001 | TC-STAT-VALIDATE-002 | TRUE_AMBIGUITY | 缺少时间字段时的校验合同未获批准。 | STILL_PENDING |
| GAP-GEN-STATS-OVER-001 | TC-STAT-VALIDATE-003 | TRUE_AMBIGUITY | 超出允许时间范围时的拒绝或裁剪行为未获批准。 | STILL_PENDING |
| GAP-GEN-STATS-FORMAT-001 | TC-STAT-VALIDATE-004 | TRUE_AMBIGUITY | 非法筛选格式和拒绝提示合同未获批准。 | STILL_PENDING |
| GAP-FG-USER-VALIDATION-007 | TC-USER-CREATE-007 | TRUE_AMBIGUITY | 未提供显示名最大长度和超长拒绝 Expected。 | STILL_PENDING |
| GAP-FG-USER-VALIDATION-008 | TC-USER-CREATE-008 | TRUE_AMBIGUITY | 未提供用户名最小/最大长度，不能猜测 min/max。 | STILL_PENDING |
| GAP-FG-USER-VALIDATION-009 | TC-USER-CREATE-009 | TRUE_AMBIGUITY | 未提供允许字符集合和错误提示合同。 | STILL_PENDING |
| GAP-FG-USER-STATE-011 | TC-USER-UPDATE-003 | TRUE_AMBIGUITY | 未定义禁用、启用、在线会话和重新登录的完整状态矩阵。 | STILL_PENDING |

## 7. 本轮阶段结果

| 阶段 | 结果 | 说明 |
| --- | --- | --- |
| PHASE 1 AUTHORITY LOAD | PASS | 已加载报告、流程册、冻结 Handoff 及仓库测试依据。 |
| PHASE 2 SOURCE AUDIT | PASS_WITH_GAPS | 后端/前端源码只读审计完成；Source 未被用作 Expected Oracle。 |
| PHASE 3 GAP RESOLUTION | PARTIAL_WITH_TRUE_GAPS_RETAINED | 可由流程权威关闭的 Gap 已关闭，其余保留。 |
| PHASE 4 COVERAGE / TESTCASE REBUILD | PASS_WITH_BLOCKED_EXECUTION | 新增 10 条 FL-TASK Composite 设计记录。 |
| PHASE 5 READINESS | BLOCKED | Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked |
| PHASE 6 FORMAL RUN | BLOCKED | Formal Manifest 为空；未启动业务 Runtime。 |
| PHASE 7 REPORT | PASS | Markdown、HTML、审计与追踪产物已生成。 |

## 8. FL-TASK-01～10 Composite Catalog

| 测试场景 | TestCaseId | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 状态 | 实际验证 | 图片示例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 任务模板从零到可下单 | TC-TFLOW-COMPOSITE-001 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-01 顺序执行并观察 DB、API | 接口铺设 TEST_OWNED 模板及至少两步流转后可被建单引用。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 建单→派车→执行→完成→反馈 | TC-TFLOW-COMPOSITE-002 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-02 顺序执行并观察 API、DB、MOCK | 任务主表、每条明细、反馈队列和车辆释放形成闭环。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 第三方下发→状态反馈 | TC-TFLOW-COMPOSITE-003 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-03 顺序执行并观察 API、DB、MOCK | 外部来源保持来源字段，桩收到与队列对应的状态报文。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 取放货业务交互门控 | TC-TFLOW-COMPOSITE-004 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-04 顺序执行并观察 MOCK、DB、LOG | 放行前车辆不越过门控点，恢复后任务继续。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 取消任务两条路径与终态 | TC-TFLOW-COMPOSITE-005 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-05 顺序执行并观察 API、DB、MOCK | 取消结果以稳定终态、车辆行为和反馈为准，不只看接口提示。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 优先级与派单顺序 | TC-TFLOW-COMPOSITE-006 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-06 顺序执行并观察 API、DB | 派发顺序可由批准策略和优先级解释，执行中任务不被抢占。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 任务完成等待与链式接续 | TC-TFLOW-COMPOSITE-007 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-07 顺序执行并观察 MOCK、DB、LOG | 接续成功时车辆不空驶回位，窗口到期后资源恢复常规调度。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 任务异常结束与重发 | TC-TFLOW-COMPOSITE-008 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-08 顺序执行并观察 API、DB、LOG | 原任务保持异常终态，新任务独立生成且车辆资源释放。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 指定车任务与派不出去排查 | TC-TFLOW-COMPOSITE-009 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-09 顺序执行并观察 API、DB | 指定车约束不被绕过；恢复后由指定车完成。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |
| 任务状态反馈闭环 | TC-TFLOW-COMPOSITE-010 | 安全夹具、DummyCar、模板、进程、Mock、清理能力就绪 | AT_TFLOW_<RunId> | 按 FL-TASK-10 顺序执行并观察 DB、MOCK、LOG | 所有队列行最终销账；失败、超时、空响应和非约定响应可被区分。 | BLOCKED | 未执行；Missing required checks: FixedControlToken, DatabaseReachable, ActiveMapReady, RequiredProcessesRunning, DummyCarAvailable, CarInitialized, TemplateFixtureReady, MockPortAvailable, FormalAutomationLinked | — |

## 9. Coverage Summary

| 维度 | 结果 |
| --- | --- |
| Feature Coverage | COVERED_WITH_EXECUTION_BLOCKERS；82 条 Case 有设计记录 |
| Rule Coverage | PARTIAL；12 条规则记录 |
| State Coverage | DESIGNED_NOT_EXECUTED；状态 0/1/2/7/10 已设计 |
| Flow Coverage | DESIGN_COVERED_EXECUTION_BLOCKED；FL-TASK-01～10 设计 10/10，执行 0/10 |
| Gap Coverage | OPEN_GAPS_RETAINED；剩余真实 Gap 28 |
| Formal Execution Coverage | BLOCKED；Manifest 0，Business Case 0 |
| P0 Coverage | FORMAL_BLOCKED |
| P1 Coverage | FORMAL_BLOCKED |

## 10. Execution Readiness / Formal Result

- FULL_FLOW_EXECUTION_GATE = BLOCKED
- FORMAL_SYSTEM_RUN_STATUS = BLOCKED
- Missing checks: FixedControlToken、DatabaseReachable、ActiveMapReady、RequiredProcessesRunning、DummyCarAvailable、CarInitialized、TemplateFixtureReady、MockPortAvailable、FormalAutomationLinked
- Formal business cases executed: No
- Formal PASS/FAIL are both 0 because no business Case entered the Manifest.
- FL-TASK flow records are BLOCKED at the gate, not product FAIL; no Runtime observation was collected.

## 11. Required Statistics

| Metric | Value |
| --- | --- |
| AuthorityDocumentsLoaded | 3 |
| SourceProjectsAudited | 2 |
| SourceCapabilitiesFound | 415 |
| HandoffMissingCapabilityCount | 4 |
| SourceDesignConflictCount | 0 |
| CurrentGapCountBefore | 29 |
| ResolvedGapCount | 1 |
| RemainingGapCount | 28 |
| ExistingCaseCountBefore | 72 |
| FinalCaseCount | 82 |
| AddedCaseCount | 10 |
| SplitCaseCount | 0 |
| DeprecatedCaseCount | 0 |
| P0Coverage | FORMAL_BLOCKED |
| P1Coverage | FORMAL_BLOCKED |
| FLTaskMainFlowCoverage | DESIGN_COVERED_EXECUTION_BLOCKED |
| ConfirmedExpectedCount | 54 |
| PendingExpectedCount | 28 |
| AutoAllowedCount | 35 |
| ManualRequiredCount | 16 |
| NotExecutableCount | 28 |
| FormalManifestCaseCount | 0 |
| FormalPassCount | 0 |
| FormalFailCount | 0 |
| FormalErrorCount | 0 |
| FormalBlockedCount | 10 |
| CleanupResidualCount | 0 |

## 12. Final Gates

| Gate | Status |
| --- | --- |
| SOURCE_AUDIT_STATUS | PASS_WITH_OPEN_AUTHORITY_AND_COVERAGE_GAPS |
| HANDOFF_COMPLETENESS_STATUS | PASS_WITH_MISSING_CAPABILITIES |
| DESIGN_SOURCE_ALIGNMENT_STATUS | PASS_WITH_OPEN_AUTHORITY_GAPS |
| GAP_RESOLUTION_STATUS | PARTIAL_WITH_TRUE_GAPS_RETAINED |
| TESTCASE_COVERAGE_STATUS | PASS_WITH_EXECUTION_BLOCKERS |
| FL_TASK_01_10_COVERAGE_STATUS | DESIGN_COVERED_10_OF_10_EXECUTION_BLOCKED |
| EXECUTION_READINESS_STATUS | BLOCKED |
| FORMAL_SYSTEM_RUN_STATUS | BLOCKED |
| CLEANUP_VERIFICATION_STATUS | NOT_REQUIRED_NO_MUTATION |
| FINAL_REPORT_STATUS | PASS |
| FINAL_SYSTEM_TEST_STATUS | BLOCKED_BY_ENVIRONMENT_AND_HARNESS_READINESS |

## 13. Artifact Index

- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/source-design-audit.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/source-design-audit.md
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/handoff-completeness-audit.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/gap-resolution-audit.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/coverage-matrix.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/flow-coverage-matrix.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/flow-coverage-matrix.md
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/final-testcase-catalog.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/execution-readiness.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/execution-readiness.md
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/formal-manifest.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/formal-result.json
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/formal-result.md
- projects/rsscomposer-blackbox/runs/SOURCE-ASSISTED-FORMAL-20260827-01/evidence-index.json
- projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.md
- projects/rsscomposer-blackbox/reports/RSSComposer调度系统测试报告.html

> Source locations and detailed alignment records are intentionally kept in standalone audit artifacts. Source behavior is observation only and never silently changes Expected.
