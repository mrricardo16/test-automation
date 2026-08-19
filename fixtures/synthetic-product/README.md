# Synthetic Product

这是 `E:\automated-testing` 自有的受控测试产品，不代表任何真实业务系统。

Runtime 由 `scripts/platform/synthetic-runtime.mjs` 启动，绑定 `127.0.0.1:0`，由当前测试记录并拥有子进程 PID。测试结束时只向该 PID 发送退出信号，并等待进程退出；不会使用 `taskkill /IM` 或其他 broad process kill。

数据只存在于 Runtime 内存中。`POST /__control/reset` 需要 `x-synthetic-control: reset-only`，每次恢复 `data/seed.json` 的确定性状态。

预置场景：

- 登录与角色权限：`admin`、`viewer`，密码仅为测试夹具值 `test-only-password`。
- Items CRUD、必填和长度校验。
- `draft → submitted → approved` 状态流转及非法转换 `409`。
- `newDashboard=false` Feature Flag。
- `/api/faults/500` 受控服务器错误。
- `/api/bugs/known` 暴露 `SYN-BUG-001` 的 expected/actual 差异，为未来 `EXPECT_PRODUCT_FAIL` 使用；当前阶段不把产品缺陷改写为 PASS。
- `/api/manual-only` 和页面中的 Canvas/OS 说明代表 MANUAL 边界。

该 Runtime 不读取 `config/local-projects.json`，不连接真实业务 localhost，不访问真实 DLL、数据库、源码或真实凭据。
