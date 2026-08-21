# 07：模块设计

## 模块总表

| Module ID | Frontend entry / directory | Backend area | Main operations | Confidence |
| --- | --- | --- | --- | --- |
| MOD-CODEGEN | src/views/codegen | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-DASHBOARD | src/views/dashboard | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-DEMO | src/views/demo | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-DRAWING-TOOL | src/views/drawing-tool | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-EMPLOYEE | src/views/Employee | Employee | 用户、角色、菜单、策略 CRUD/权限关系 | CONFIRMED_FROM_CODE |
| MOD-ERROR | src/views/error | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-KANBAN | src/views/KanBan | Monitor / Map | 监控看板与实时数据 | CONFIRMED_FROM_CODE |
| MOD-LOGIN | src/views/login | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-LOGS | src/views/Logs | Log | 系统日志、RSS 日志、异常/文件日志 | CONFIRMED_FROM_CODE |
| MOD-PROFILE | src/views/profile | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-REDIRECT | src/views/redirect | UNKNOWN / not one-to-one | 页面功能由源码组件确定；业务语义部分 UNKNOWN | CONFIRMED_FROM_CODE |
| MOD-STATISTICS | src/views/Statistics | Report | 统计查询/展示 | CONFIRMED_FROM_CODE |
| MOD-SYS | src/views/Sys | Info / Employee | 车辆、外部系统、字典页面 | CONFIRMED_FROM_CODE |
| MOD-SYSTEM | src/views/system | Employee / Info / Log | 用户、部门、字典、通知、配置、角色、菜单、日志页面 | CONFIRMED_FROM_CODE |
| MOD-TASK | src/views/Task | Task / Temp | 任务、任务模板、策略、任务项、维护 | CONFIRMED_FROM_CODE |

## System Management Design

当前源码中的系统管理不是单一目录，而是由 `src/views/system`、`src/views/Employee`、`src/views/Sys` 与 `src/views/Logs` 的若干页面共同组成。

| Submodule | Frontend source | Backend Controller/API families | Service family | Permissions |
| --- | --- | --- | --- | --- |
| 用户管理 | `views/system/user`, `views/Employee/User` | `UserController`, `/User/*` | `UserService` | 前端 `hasAuth` + 后端 token path；具体按钮权限来自用户信息/菜单数据 |
| 角色管理 | `views/system/role`, `views/Employee/Role` | `RoleController`, `/Role/*` | `RoleService`, `RoleMenuService` | 角色/权限数据由后端返回 |
| 菜单管理 | `views/system/menu`, `views/Employee/Menu` | `MenuController`, `/Menu/*` | `MenuService` | 菜单路由和按钮 permission 字段 |
| 字典/配置 | `views/system/dict`, `views/system/config`, `views/Sys/DictManager` | `DictController`, `ExSystemController` and system API families | `DictService`, `ExSystemService` | 页面权限与 token policy 需结合运行时菜单确认 |
| 部门/通知/日志 | `views/system/dept`, `views/system/notice`, `views/system/log`, `views/Logs` | 对应 system/log Controller families where present | Service by source file | UNKNOWN where exact page-to-controller route is not statically matched |

本节只描述代码中存在的入口、API 和关系；不生成操作步骤，也不把既有真实测试用例扩展为本阶段测试设计。
