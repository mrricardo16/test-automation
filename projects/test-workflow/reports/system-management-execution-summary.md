# 系统管理真实页面测试执行汇总

执行日期：2026-08-18
执行范围：真实 Web 页面 `http://localhost:8223` 的系统管理模块
执行方式：Playwright 真实页面交互；数据库仅做只读交叉核验
测试数据：用户、角色、菜单、字典、外部系统配置均按要求使用 `CS` 命名；临时菜单和外部系统配置已通过页面删除。

## 最终结论

- `CS` 用户最终存在且启用。
- `CS` 角色最终存在，角色编码、名称、描述均为 `CS`。
- 角色权限页面最终显示 28 个权限树节点全部勾选。
- `CS` 用户最终已关联 `CS` 角色。
- 菜单测试数据 `CS` 已删除；刷新后菜单树和系统管理导航均不再显示 `CS`。
- 外部系统测试数据 `CS` 已删除。
- 字典类型 `CS` 及其子项仍保留：页面明确提示“系统类型不可删除”，因此未使用数据库或其他绕过方式清理。

## 只读数据库交叉核验

连接目标：`192.168.12.195:3306/872_default`，使用用户提供的只读查询权限路径；本次未执行任何 SQL 写入。

- 用户：`cn_s_login=CS`、`cn_s_name=CS`、`cn_n_disabled=1`。
- 角色：`cn_s_rolecode=CS`、`cn_s_rolename=CS`、`cn_s_describe=CS`。
- 用户角色关联行数：`1`。
- `CS` 角色权限关联行数：`28`，与页面权限树 28 个节点一致。
- 未读取、输出或保存密码字段。

## 用例与证据

每一行均有对应截图；`ERROR` 为测试定位/浏览器交互适配问题，`FAIL` 为页面真实结果与预期不一致。原始失败/错误截图均保留。

| TestCaseId | 状态 | 预期 / 实际摘要 | 证据截图 |
|---|---|---|---|
| TC-SM-ENV-001 | PASS | 登录后进入用户管理；页面显示系统管理和按钮 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ENV-001/result.png` |
| TC-SM-USER-001 | PASS | 查询 CS；结果包含 CS | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-001/result.png` |
| TC-SM-USER-003-UI | ERROR | 标准 checkbox 定位失败，使用稳定 label 定位继续 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-003/error.png` |
| TC-SM-USER-003 | PASS | 修改 CS 后列表仍显示 CS | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-003/result.png` |
| TC-SM-USER-004 | PASS | 删除 CS 后列表 0 条 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-004/result.png` |
| TC-SM-USER-002 | PASS | 新增 CS 用户成功且启用 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-002/result.png` |
| TC-SM-ROLE-001-NAV | ERROR | 菜单定位未找到角色入口，使用已知路由继续 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-001/navigation-error.png` |
| TC-SM-ROLE-001 | PASS | 新增 CS 角色成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-001/result.png` |
| TC-SM-ROLE-002 | PASS | 修改 CS 角色成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-002/result.png` |
| TC-SM-ROLE-003-LOCATOR | ERROR | 权限树初始严格定位失败，改用 treeitem 首个 label | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-003/selection-error.png` |
| TC-SM-ROLE-003 | PASS | 28 个权限节点全选并保存成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-003/result.png` |
| TC-SM-ROLE-004 | PASS | 删除 CS 角色成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-004/deleted.png` |
| TC-SM-ROLE-004-RESTORE | PASS | 删除测试后恢复 CS 角色及全部权限 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-ROLE-004/permissions-restored.png` |
| TC-SM-USER-005 | PASS | CS 用户角色表显示 CS / CS 且已选中 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-USER-005/verified.png` |
| TC-SM-MENU-001 | PASS | 新增 CS 菜单成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-MENU-001/result.png` |
| TC-SM-MENU-002 | PASS | 修改 CS 菜单成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-MENU-002/result.png` |
| TC-SM-MENU-003 | PASS | 刷新后可定位 CS 菜单 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-MENU-003/result.png` |
| TC-SM-MENU-004 | PASS | 删除 CS 菜单成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-MENU-004/result.png` |
| TC-SM-MENU-005 | PASS | 刷新后 CS 菜单节点和导航均消失 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-MENU-005/result.png` |
| TC-SM-DICT-001 | PASS | 新增 CS 字典类型成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-001/result.png` |
| TC-SM-DICT-001-ITEM-UI | ERROR | 普通确认点击出现 no element at point，force 点击后继续 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-001/item-save-error.png` |
| TC-SM-DICT-001-ITEM | PASS | 新增 CS 字典子项成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-001/item-created.png` |
| TC-SM-DICT-002 | PASS | 修改 CS 子项排序为 2 成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-002/result.png` |
| TC-SM-DICT-003 | FAIL | 刷新默认根节点，未自动显示子项；选择 CS 节点后才显示 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-003/result.png` |
| TC-SM-DICT-003-RETRY | PASS | 选择 CS 字典节点后显示子项 001-10-01，排序 2 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-003-RETRY/verified.png` |
| TC-SM-DICT-004 | FAIL | 删除 CS 子项被页面拒绝，提示系统类型不可删除 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-DICT-004/result.png` |
| TC-SM-EXSYS-001 | PASS | 新增 CS 外部系统配置成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-EXSYS-001/result.png` |
| TC-SM-EXSYS-002 | PASS | 修改 CS 外部系统地址成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-EXSYS-002/result.png` |
| TC-SM-EXSYS-003 | PASS | 按编码和名称 CS 查询仅返回 CS | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-EXSYS-003/result.png` |
| TC-SM-EXSYS-004 | PASS | 删除 CS 外部系统成功 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-EXSYS-004/result.png` |
| TC-SM-FINAL-001 | PASS | CS 角色权限树 28 个节点全部 checked | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-FINAL-001/role-permissions.png` |
| TC-SM-FINAL-002 | PASS | CS 用户已关联 CS 角色 | `E:/automated-testing/projects/test-workflow/artifacts/system-management/TC-SM-FINAL-002/user-role.png` |

## 失败与限制说明

1. 字典刷新后默认选择根节点，首次断言没有看到 CS 子项；重新选择 CS 节点后子项真实显示，已以 `TC-SM-DICT-003-RETRY` 保留复核证据。
2. 字典 CS 子项删除由产品页面拒绝并提示“系统类型不可删除”。这是页面真实结果，未通过 SQL、接口或修改产品代码绕过。
3. 部分 Element Plus 隐藏 checkbox 的标准自动化定位失败，已单独标记 `ERROR` 并保留截图；后续使用稳定语义结构继续完成实际页面测试。

## 证据复采集修订

原始截图中发现部分页面在 `fullPage` 模式下受应用固定布局和浏览器页面尺寸影响，生成了窄条或重复布局的 PNG；这些原始文件未删除，继续作为历史执行证据保留。

针对审核使用，已使用统一 1280×720 可视区域重新采集 32 条正式用例截图，保存于：

`E:/automated-testing/projects/test-workflow/artifacts/system-management-viewport/`

最终 Excel 使用这批新截图，并在 `用例执行明细` 中新增 `截图预览` 列直接嵌入图片；原始截图路径也同步保留在 `截图证据` 列。
