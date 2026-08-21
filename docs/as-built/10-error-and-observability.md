# 10：错误处理与可观测性

## Frontend

- `src/utils/request.ts` 统一处理业务失败、HTTP/axios error、`statusCode=600` 重登录和 Element Plus message。
- `src/plugins/permission.ts` 捕获动态路由生成异常，清理 user data 后重定向登录。
- `src/utils/errorHandling.js` 参与网络错误消息转换；当前文档不复制真实运行日志内容。
- `console.log`/`console.error` 仍存在于部分启动/动态路由路径；是否接入集中日志系统 UNKNOWN。

## Backend

- `RSStarter.UseGlobalException()` 注册未观察任务异常和 AppDomain 未处理异常处理；记录 `Diagnosis`，终止时尝试重启进程。
- `WebBaseController.OnBeforeHandler()` 在 token 缺失/无效时写入状态码和序列化后的 `ApiResult`，并关闭 response stream。
- 多个 Controller 使用 `try/catch` 创建 `ApiResult`；全局是否统一所有异常响应格式 UNKNOWN。
- `OpenApiLogger` 对外部 Controller 的 API 调用进行日志登记/序列化接线；Areas 控制器是否入库由源码注释明确为不登记。

## 日志/监控

| Signal | Source | Status |
| --- | --- | --- |
| Diagnosis/custom logs | `Diagnosis.Post` references | CONFIRMED_FROM_CODE |
| Open API logging | `OpenApiLogger` | CONFIRMED_FROM_CODE |
| Scheduler/log analysis | `UseLogAnalysis` and log-analysis services | CONFIRMED_FROM_CODE |
| Central monitoring/metrics/tracing backend | no complete source proof | UNKNOWN |
