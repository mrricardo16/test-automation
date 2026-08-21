# RSS调度 系统管理 CRUD 重执行汇总

执行日期：2026-08-20
依据：`功能_02_Web管理端_系统管理(1).md`、`流程_01_权限与登录.md`
TestCase：`TC-RSS-SM-CRUD-001`

## 结果

| 模块 | 状态 | 实际结果 |
| --- | --- | --- |
| 角色查询/新增/修改/删除 | PASS | 普通管理员完成预置角色修改、关联查询和删除；普通管理员新增角色首次查询有异步延迟，等待刷新后可见并删除。 |
| 用户查询/修改/启停/关联/删除 | PASS | 普通管理员完成测试用户角色关联、名称修改、禁用/恢复、删除；删除后角色用户列表不再包含该用户。 |
| 菜单新增/修改/启停/删除 | PASS | 测试菜单保存后树中可见；修改名称、路由、地址，禁用/恢复及删除均以树刷新结果核验。 |
| 字典新增/修改/删除 | PASS | 使用“手工”类型创建测试字典，修改名称/排序后删除；系统类型字典未修改。 |
| 外部系统新增/修改/删除 | PASS | 使用 `127.0.0.1` 不可用测试端口创建临时配置，修改后删除；既有 WMS 未修改。 |
| 普通管理员登录 | PASS | `RSS-AUTO-CRUD-ADMIN` 成功登录并显示五个系统管理入口；`sa` 仅用于准备和清理。 |

## 清理核验

- 用户查询 `RSS-AUTO-CRUD`：0 条。
- 角色查询 `RSS-AUTO-CRUD-ADMIN-ROLE`：0 条；测试角色已删除。
- 菜单树不含 `RSS-AUTO-CRUD-`。
- 字典列表不含 `RSS-AUTO-CRUD-`。
- 外部系统查询 `RSS-AUTO-CRUD`：0 条。
- 清理证据：[用户](../artifacts/TC-RSS-SM-CRUD-001/user-cleanup.png)、[角色](../artifacts/TC-RSS-SM-CRUD-001/role-cleanup.png)、[菜单](../artifacts/TC-RSS-SM-CRUD-001/menu-cleanup.png)、[字典](../artifacts/TC-RSS-SM-CRUD-001/dict-cleanup.png)、[外部系统](../artifacts/TC-RSS-SM-CRUD-001/exsystem-cleanup.png)。

## 文档仍需补充

- 新增/修改/删除接口的成功响应必须同时给出 `statusCode` 和 `isSuccess` 的判定契约，不能只依赖页面 toast。
- 外部系统地址格式、是否触发连通性检查、测试环境隔离和回滚要求需要写入文档。
- 普通管理员的角色新增列表刷新时序和最终一致性要求需要明确。
- 数据库、Redis、日志只读核验连接及字段脱敏规则仍未提供，本轮以 UI、路由和列表一致性为主。
