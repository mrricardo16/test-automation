# 02：后端架构

## Solution / Project

Solution 数量：**1**；Project 数量：**12**。

| Project | TargetFramework | ProjectReference | 主要 PackageReference |
| --- | --- | --- | --- |
| HZ.Common | net8.0 |  | Newtonsoft.Json 13.0.4 |
| SimpleCore | netstandard2.0 | ../SimpleTools/SimpleTools.csproj | Newtonsoft.Json 13.0.4<br>Jint 3.1.6<br>morelinq 4.3.0<br>System.Reflection.Metadata 8.0.0<br>System.Collections.Immutable 8.0.0<br>System.Drawing.Common 8.0.0<br>System.Threading.Tasks.Extensions 4.5.4 |
| SimpleTools | netstandard2.0 |  |  |
| HZ.Interfaces | net8.0 | ../HZ.Common/HZ.Common.csproj<br>../HZ.Model/HZ.Model.csproj<br>../HZ.Tools/HZ.DbHelper/HZ.DbHelper.csproj<br>../HZ.Tools/HZ.Redis/HZ.Redis.csproj | Autofac 8.2.0<br>SqlSugarCore 5.1.4.214 |
| HZ.Model | net8.0 | ../HZ.Cores/SimpleCore/SimpleCore.csproj | SqlSugarCore 5.1.4.214<br>System.ComponentModel.Annotations 5.0.0 |
| HZ.RSSComposer | net8.0 | ../HZ.Common/HZ.Common.csproj<br>../HZ.Interfaces/HZ.Interfaces.csproj<br>../HZ.Model/HZ.Model.csproj<br>../HZ.Tools/HZ.LanguageTrans/HZ.LanguageTrans.csproj<br>../HZ.Tools/HZ.Redis/HZ.Redis.csproj<br>../HZ.Tools/HZ.Mqtt/HZ.Mqtt.csproj<br>../HZ.Cores/SimpleCore/SimpleCore.csproj | Autofac 8.2.0<br>Avalonia 11.3.9<br>Avalonia.Desktop 11.3.9<br>Avalonia.Themes.Fluent 11.3.9<br>Avalonia.Controls.DataGrid 11.3.9<br>Avalonia.Fonts.Inter 11.3.9<br>Avalonia.Diagnostics 11.3.9<br>CommunityToolkit.Mvvm 8.2.1 |
| HZ.DbHelper | net8.0 | ../../HZ.Common/HZ.Common.csproj | SqlSugarCore 5.1.4.214<br>MySqlConnector 2.3.7 |
| HZ.Encrypt | netstandard2.0 |  | System.Management 8.0.0 |
| HZ.LanguageTrans | net8.0 | ../../HZ.Common/HZ.Common.csproj |  |
| HZ.Mqtt | net8.0 |  | MQTTnet 4.3.6.1152 |
| HZ.Redis | net8.0 |  | Newtonsoft.Json 13.0.3<br>StackExchange.Redis 2.10.1 |
| SimpleCore | netstandard2.0 |  | Newtonsoft.Json 13.0.4<br>Jint 3.1.6<br>morelinq 4.3.0<br>System.Reflection.Metadata 8.0.0<br>System.Collections.Immutable 8.0.0<br>System.Drawing.Common 8.0.0<br>System.Threading.Tasks.Extensions 4.5.4 |

## 启动与 Web 运行链

```mermaid
sequenceDiagram
    participant P as Program.Main
    participant A as App / LoginWindow
    participant S as RSStarter
    participant E as EmbedIO WebServer
    P->>P: Configuration.Load / license check / global exception
    P->>A: BuildAvaloniaApp().StartWithClassicDesktopLifetime
    A->>A: LoginWindow closes with LoginSuccess
    A->>S: InitAfterLogin()
    S->>S: UseSystemParam / UsePlugins / UseHeuristics
    S->>E: UseEmbedIO() registers /api and / controllers
    S->>S: UseWebSocket / UseLogAnalysis / recovery monitor
```

源码入口：`HZ.RSSComposer/Program.cs`、`HZ.RSSComposer/App.axaml.cs`、`HZ.RSSComposer/RSStarter.cs`。运行时 WebServer 注册基于 EmbedIO；并非 ASP.NET Core Controller/MVC 映射。

## 分层与依赖

- `Controller` / `Areas/*Controller`：EmbedIO WebApiController，读取请求、组装 ApiResult，并通过 `ServiceLocator.GetService<T>()` 获取服务。
- `HZ.Interfaces/Service`：Service 与 `BaseService<T>`，业务调用通过 `DbContext`/SqlSugar 和 Redis 等基础设施完成。
- `HZ.Model`：Entity、View/DTO 和模型；本阶段只列摘要，不复制字段全文。
- `HZ.Tools/HZ.DbHelper`：`DbContext`、`SessionInfo`、数据库类型映射和 AOP 日志。
- 未观察到独立 Repository 项目；文档不虚构 Repository 层。

## Controller 覆盖

共识别 **33** 个 Controller/WebApiController。
| Controller | Area | Base type | RequiresToken | ServiceLocator 引用 | Source |
| --- | --- | --- | --- | --- | --- |
| CarController | Car | WebBaseController | Yes | ICarService<br>IMapService<br>ISystemLogService | HZ.RSSComposer/Areas/Car/CarController.cs |
| CarExtendController | Car | WebBaseController | Yes |  | HZ.RSSComposer/Areas/Car/CarExtendController.cs |
| AccountController | Employee | WebBaseController | No | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | HZ.RSSComposer/Areas/Employee/AccountController.cs |
| MenuController | Employee | WebBaseController | Yes | IMenuService<br>ISystemLogService | HZ.RSSComposer/Areas/Employee/MenuController.cs |
| RoleController | Employee | WebBaseController | Yes | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | HZ.RSSComposer/Areas/Employee/RoleController.cs |
| StrategyController | Employee | WebBaseController | Yes | IStrategyService<br>ISystemLogService | HZ.RSSComposer/Areas/Employee/StrategyController.cs |
| UserController | Employee | WebBaseController | Yes | ISystemLogService<br>ITokenService<br>IUserService | HZ.RSSComposer/Areas/Employee/UserController.cs |
| CarCollectController | Info | WebBaseController | No |  | HZ.RSSComposer/Areas/Info/CarCollectController.cs |
| CarFaultController | Info | WebBaseController | No |  | HZ.RSSComposer/Areas/Info/CarFaultController.cs |
| DictController | Info | WebBaseController | Yes | IDictService<br>ISystemLogService<br>ITokenService | HZ.RSSComposer/Areas/Info/DictController.cs |
| ExSystemController | Info | WebBaseController | Yes | IExSystemService<br>ISystemLogService | HZ.RSSComposer/Areas/Info/ExSystemController.cs |
| FaultDescController | Info | WebBaseController | Yes | IFaultDescService | HZ.RSSComposer/Areas/Info/FaultDescController.cs |
| LogAnalysisController | Log | WebBaseController | Yes |  | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs |
| MSGSendThirdController | Log | WebBaseController | Yes | IMsgSendThirdService | HZ.RSSComposer/Areas/Log/MSGSendThirdController.cs |
| SystemLogController | Log | WebBaseController | Yes | ISystemLogService | HZ.RSSComposer/Areas/Log/SystemLogController.cs |
| MapController | Map | WebBaseController | Yes | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | HZ.RSSComposer/Areas/Map/MapController.cs |
| MissionController | Map | WebBaseController | Yes | IMissionService<br>ISystemLogService | HZ.RSSComposer/Areas/Map/MissionController.cs |
| PropMetaController | Map | WebBaseController | Yes |  | HZ.RSSComposer/Areas/Map/PropMetaController.cs |
| SiteController | Map | WebBaseController | Yes | ISiteService<br>ISystemLogService | HZ.RSSComposer/Areas/Map/SiteController.cs |
| TrackController | Map | WebBaseController | Yes | ISystemLogService<br>ITrackService | HZ.RSSComposer/Areas/Map/TrackController.cs |
| KanBanController | Monitor | WebBaseController | No | ICarImgService<br>ICarService<br>ITaskService | HZ.RSSComposer/Areas/Monitor/KanBanController.cs |
| StatisticsController | Report | WebBaseController | Yes | IBatteryService<br>ICarCollectService<br>ICarFaultService<br>ICarService<br>IMapService<br>ITaskService | HZ.RSSComposer/Areas/Report/StatisticsController.cs |
| TaskController | Task | WebBaseController | Yes | ISystemLogService<br>ITaskService<br>ITmpService | HZ.RSSComposer/Areas/Task/TaskController.cs |
| TaskMaintananController | Task | WebBaseController | Yes | ISystemLogService<br>ITaskMaintananceService | HZ.RSSComposer/Areas/Task/TaskMaintananController.cs |
| TaskScriptController | Task | WebBaseController | Yes | ITaskScriptService | HZ.RSSComposer/Areas/Task/TaskScriptController.cs |
| WebBaseController | Infrastructure | WebAPIContainer | Yes | ITokenService | HZ.RSSComposer/Areas/WebBaseController.cs |
| actionController | External/Controller | BaseController | No |  | HZ.RSSComposer/Controller/actionController.cs |
| appVersionController | External/Controller | WebApiController | No |  | HZ.RSSComposer/Controller/appVersionController.cs |
| ctrlController | External/Controller | BaseController | No |  | HZ.RSSComposer/Controller/ctrlController.cs |
| infoController | External/Controller | BaseController | No | ICarImgService | HZ.RSSComposer/Controller/infoController.cs |
| taskController | External/Controller | BaseController | No | ITaskCancelService<br>ITaskService<br>ITmpService | HZ.RSSComposer/Controller/taskController.cs |
| WebAPIAgvInterface | Infrastructure | WebApiController | No |  | HZ.RSSComposer/Interfaces/WebAPIAgvInterface.cs |
| WebAPIContainer | Infrastructure | WebApiController | No |  | HZ.RSSComposer/Interfaces/WebAPIContainer.cs |

## 技术栈（源码确认）

| Concern | Implementation | Evidence |
| --- | --- | --- |
| Desktop host | Avalonia 11.3.9 package in `HZ.RSSComposer.csproj` | `HZ.RSSComposer/Program.cs` |
| HTTP/Web API | EmbedIO WebServer / WebApiController | `RSStarter.UseEmbedIO()` |
| ORM/data access | SqlSugarCore + `SqlSugarClient` | `HZ.Tools/HZ.DbHelper/DbContext.cs` |
| DI/service location | Autofac + `ServiceLocator` | `HZ.Interfaces/ServiceLocator.cs` |
| Database connector | MySqlConnector package; runtime DB type is configuration-driven | `HZ.Tools/HZ.DbHelper/DbContext.cs` |
| Cache | HZ.Redis / StackExchange.Redis | `HZ.Tools/HZ.Redis`, `TokenService.cs` |
| Serialization | Newtonsoft.Json | csproj and controllers |
| Realtime | WebSocket and MQTTnet code paths | `RSStarter.cs`, package references |
