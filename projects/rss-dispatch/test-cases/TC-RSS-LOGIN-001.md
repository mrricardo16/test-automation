# TC-RSS-LOGIN-001：SA 登录并进入 Dashboard

| 字段 | 内容 |
| --- | --- |
| TestCaseId | `TC-RSS-LOGIN-001` |
| 依据条目 | 公共前置 §1.2；登录为项目执行前置 |
| 模块 | Web 登录 |
| 优先级 | P0 |
| 类型 | 功能/入口 |
| 前置条件 | `http://localhost:8223` 可访问；后端可用；账号具有系统管理权限 |
| 测试数据 | 登录名 `sa`；密码由 `RSS_TEST_PASSWORD` 运行时注入 |
| 操作步骤 | 打开登录 URL；填写登录名和密码；点击登录 |
| 预期结果 | 登录成功并进入 `#/dashboard` |
| 通过标准 | 登录接口成功；页面 URL 为 Dashboard；Dashboard 根节点可见 |
| 证据 | `artifacts/TC-RSS-LOGIN-001/` 下保存结果截图；失败/错误保存额外证据 |
