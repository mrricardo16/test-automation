# TC-RSS-FL-AUTH-04：登录态失效与异常分支

| 字段 | 内容 |
| --- | --- |
| TestCaseId | `TC-RSS-FL-AUTH-04` |
| 依据条目 | `FL-AUTH-04` |
| 类型 | P1 接口/流程异常 |
| 操作 | 在已取得有效 token 后，分别测试缺 token、无效 token、业务层 `statusCode=600`、关闭标签页、未登录直达业务页、登出后旧 token |
| 通过标准 | 按 HTTP 状态、响应体 `statusCode`、message 和 UI 跳转分别判定，不混淆网关 600 与业务层 200/600 |
| 风险 | Redis 清空/重启不在本轮自动执行；仅测试可安全构造的请求，不污染共享登录态 |
| 证据 | `artifacts/TC-RSS-FL-AUTH-04/` |
