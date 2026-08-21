# 01：系统总览

## As-Built 结论

当前系统由一个以 Avalonia 桌面宿主启动的 .NET 8 后端/调度程序与一个 Vue 3 + Vite 前端组成。后端在登录成功后的 RSStarter.InitAfterLogin() 链中启动 EmbedIO WebServer；前端通过运行时 RssConfig.RSSApi 配置，经 axios 请求后端 /api WebApi 路由。

```mermaid
flowchart TD
    Browser[浏览器 / Vue 应用] --> Axios[axios request wrapper]
    Axios --> RuntimeConfig[RssConfig.RSSApi 运行时配置]
    RuntimeConfig --> EmbedIO[EmbedIO WebServer]
    EmbedIO --> ApiRoot[/api WebApi controllers]
    EmbedIO --> RootApi[/ 根路由 WebAPIContainer / WebAPIAgvInterface]
    ApiRoot --> Areas[Areas 控制器与 ServiceLocator]
    ApiRoot --> External[Controller 外部接口]
    Areas --> SqlSugar[SqlSugar DbContext]
    Areas --> Redis[HZ.Redis / StackExchange.Redis]
    EmbedIO --> WebSocket[WebSocket 看板推送]
    Areas --> ExternalSystems[MQTT / 外部系统 / 文件与日志处理]
```

## 主要模块

| 范围 | 模块/区域 | 证据等级 |
| --- | --- | --- |
| Backend | Car | CONFIRMED_FROM_CODE（11 个端点） |
| Backend | Employee | CONFIRMED_FROM_CODE（36 个端点） |
| Backend | External/Controller | CONFIRMED_FROM_CODE（23 个端点） |
| Backend | Info | CONFIRMED_FROM_CODE（19 个端点） |
| Backend | Infrastructure | CONFIRMED_FROM_CODE（10 个端点） |
| Backend | Log | CONFIRMED_FROM_CODE（11 个端点） |
| Backend | Map | CONFIRMED_FROM_CODE（37 个端点） |
| Backend | Monitor | CONFIRMED_FROM_CODE（5 个端点） |
| Backend | Report | CONFIRMED_FROM_CODE（3 个端点） |
| Backend | Task | CONFIRMED_FROM_CODE（9 个端点） |
| Frontend | codegen | CONFIRMED_FROM_CODE |
| Frontend | dashboard | CONFIRMED_FROM_CODE |
| Frontend | demo | CONFIRMED_FROM_CODE |
| Frontend | drawing-tool | CONFIRMED_FROM_CODE |
| Frontend | Employee | CONFIRMED_FROM_CODE |
| Frontend | error | CONFIRMED_FROM_CODE |
| Frontend | KanBan | CONFIRMED_FROM_CODE |
| Frontend | login | CONFIRMED_FROM_CODE |
| Frontend | Logs | CONFIRMED_FROM_CODE |
| Frontend | profile | CONFIRMED_FROM_CODE |
| Frontend | redirect | CONFIRMED_FROM_CODE |
| Frontend | Statistics | CONFIRMED_FROM_CODE |
| Frontend | Sys | CONFIRMED_FROM_CODE |
| Frontend | system | CONFIRMED_FROM_CODE |
| Frontend | Task | CONFIRMED_FROM_CODE |

## 关键边界

- `CONFIRMED_FROM_CODE`：路线、类、方法、包、调用关系和源码配置键由当前源码直接支持。
- `CONFIRMED_FROM_RUNTIME`：仅引用既有 Web 报告中的登录/首页运行结果；本阶段未重新启动系统。
- `INFERRED`：由目录、调用和命名关系推断的页面业务归属。
- `UNKNOWN`：源码没有提供足够信息的实际部署取值、数据库现状、外部协议语义和原始需求意图。
