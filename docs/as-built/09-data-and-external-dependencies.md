# 09：数据与外部依赖

| Dependency | Type | Used by | Source evidence | Purpose confidence |
| --- | --- | --- | --- | --- |
| SqlSugarCore / SqlSugarClient | ORM/data access | `DbContext`, `BaseService`, domain services | `HZ.Tools/HZ.DbHelper/DbContext.cs` | CONFIRMED_FROM_CODE; actual schema/runtime DB unknown |
| MySqlConnector | Database connector package | `HZ.DbHelper` project/package | `HZ.Tools/HZ.DbHelper.csproj` | CONFIRMED_FROM_CODE; selected DB type is configuration-driven |
| Redis | Cache/session/user info | `TokenService`, `RedisUserinfoHelper`, HZ.Redis | `TokenService.cs`, HZ.Redis project | CONFIRMED_FROM_CODE; server address/availability UNKNOWN |
| EmbedIO | HTTP server/API | `RSStarter.UseEmbedIO` | `RSStarter.cs`, csproj | CONFIRMED_FROM_CODE |
| WebSocket | Dashboard realtime channel | `WebSocketHelper`, `RSStarter.UseWebSocket` | `RSStarter.cs`, `AppCode/WebScoketHelper.cs` | CONFIRMED_FROM_CODE; endpoint value runtime-configured |
| MQTTnet | Message/vehicle integration code path | HZ.Mqtt and app code | csproj and source references | CONFIRMED_FROM_CODE; external broker/protocol UNKNOWN |
| Plugins DLL | Dynamic plugin extension | `RSStarter.UsePlugins` | `RSStarter.cs` | CONFIRMED_FROM_CODE; installed plugin set UNKNOWN |
| License file | Startup prerequisite | `Program.Main` reads `rss.lic` | `Program.cs` | CONFIRMED_FROM_CODE; actual license value omitted |
| File/log packages | Log analysis, import/download, image/export paths | LogAnalysis controllers/services and frontend file APIs | source file names and APIs | CONFIRMED_FROM_CODE; filesystem layout runtime-dependent |

## Data model summary

HZ.Model 下静态识别到 **76** 个模型/实体候选文件。该计数不等于数据库表数量；关系、索引和实际数据库 schema 未通过连接数据库确认。

| Model kind | Count | Notes |
| --- | ---: | --- |
| Entity | 32 | Source file candidates under HZ.Model |
| Model | 22 | Source file candidates under HZ.Model |
| View/DTO | 22 | Source file candidates under HZ.Model |

禁止事项执行记录：本阶段没有连接真实数据库、没有上传/下载文件、没有调用外部 API、没有启动 WebSocket/MQTT。
