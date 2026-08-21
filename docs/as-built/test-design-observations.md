# ARCH-001：后续测试设计观察（非 TestCase）

> 本文件只保留架构观察，不包含正式测试编号、步骤、预期结果或执行状态。

| 模块 | 风险/观察点 | 为什么后续值得测试 | 关联设计 |
| --- | --- | --- | --- |
| Auth | 前端 token header、后端 RequiresToken、Redis user info 三者需要一致 | 可验证登录、失效 token、权限边界 | `06-auth-permission-design.md` |
| Dynamic routes | 路由由后端菜单数据生成，组件解析失败回退 404 | 可验证菜单/组件/权限组合 | `03-frontend-architecture.md` |
| System Management | 用户/角色/菜单/字典 API 存在多套 `src/api` 家族 | 可验证页面实际调用与后端 route 对应关系 | `05-frontend-backend-mapping.md` |
| Error handling | `statusCode=600` 会触发全局登出/重定向 | 可验证失败响应后的统一行为 | `10-error-and-observability.md` |
| Unmatched APIs | 116 个前端记录与 44 个后端端点静态未匹配 | 需要版本/动态/外部边界确认后再选测试 | `11-known-unknowns.md` |
