# RSSComposer 调度系统正式执行报告

- 运行编号：`SOURCE-ASSISTED-FORMAL-20260827-02`
- 总体结论：**BLOCKED（安全子集已执行，Golden Path 被产品侧初始化故障阻断）**
- 本轮不是 82 条用例全部 PASS；仅将实际具备适配器和安全前置条件的用例纳入正式 manifest。

## 实际结果

| 指标 | 结果 |
|---|---:|
| Web Reachable | PASS |
| API Reachable（运行初期） | PASS |
| API Reachable（初始化后） | ERROR（短暂连接拒绝，随后恢复） |
| Web Authentication | PASS |
| Control API Authentication | PASS |
| Runtime Fixture Fabrication | PASS |
| TEST_OWNED 地图上传 | PASS |
| 操作员手动切换到 AT | PASS（已确认） |
| 后端调度活动地图 | PASS（mapStatus=1、isOfficial=true） |
| 链式搬运进程创建/绑定 | PASS |
| 链式搬运进程运行 | PASS |
| 状态反馈进程创建/运行 | PASS（操作员已手工建立，当前观测为运行中） |
| DummyCar 身份 | PASS（DummyOmniForkLiftCar） |
| DummyCar 初始化/定位 | FAIL（产品异常，siteid=-1） |
| Map/Process Readiness | BLOCKED |
| Golden Path | BLOCKED（未执行） |
| Formal Manifest | 25 |
| Formal Executed | 24 |
| Formal PASS | 20 |
| Formal FAIL | 3 |
| Formal ERROR | 1 |
| Formal BLOCKED | 14 |
| Manual Required | 16 |
| Pending Authority | 28 |
| Formal Skipped | 0 |
| Not Yet Executed | 62 |
| Cleanup Residual | 1（保留 TEST_OWNED DummyCar） |

- 本轮追加执行了网页用户分页、任务查询、车辆合法修改、效能统计查询等已授权用例；每个实际 PASS/FAIL/ERROR 结果均保留截图图例。任务分页在无安全可创建任务数据时记录 BLOCKED，未执行会触发物理链路的任务创建。

## 已执行

- `TC-WEB-LOGIN-001`：真实 Playwright 登录 PASS（支持性前置核验）。
- `TC-USER-CREATE-001`：通过用户管理 UI 新增本轮 TEST_OWNED 用户，重新查询核验，删除并再次查询确认不存在，PASS。
- 操作员已手动从地图 1 切换到 `AT_0827_02_MAP`；运行时观测确认当前地图为正式地图，未重复地图上传、发布或切换。
- 当前 AT 地图的链式搬运进程 `1144666` 刷新后显示“运行中”，状态反馈进程也显示“运行中”。
- 通过正式车辆类型接口确认 `DummyOmniForkLiftCar`，创建 TEST_OWNED `AT_0827_02_DUMMY(1901)`；初始化路径按操作员确认不再执行，运行态仍为 `siteid=-1`。

## 环境边界

- 状态反馈进程已由操作员手工建立，当前只读刷新观测为运行中；未复用未知既有进程，也未修改生产进程。
- DummyCar 初始化历史尝试后产品日志记录 `Car.Reset()` 的 Avalonia “Call from invalid thread”异常；因此未把“初始化成功响应”误判为已定位，也未执行普通车辆试运行。
- 虽然链式进程和状态反馈进程当前均显示运行中，但 DummyCar 未完成定位，未创建模板、未创建 Golden Path 业务任务、未执行派车/反馈/取消恢复物理链路。
- 数据库只读目标已解析并完成连接/表存在性核验；未通过 SQL 创建或修改业务数据。
- FL-01..10 设计状态 PASS；执行状态 BLOCKED。Pending Authority 28 条保持“尚未执行/当前不可执行”，不计入 Formal Skipped，也不将运行观察结果改写为 Expected。

## 保留与清理

- 本轮 TEST_OWNED 用户已删除并复核不存在。
- TEST_OWNED DummyCar 已新增并完成身份复核；按操作员要求保留，作为后续继续验证的运行设施。
- TEST_OWNED 地图和测试地图下的链式进程作为可复用测试基础设施保留；未创建 Golden Path 业务数据。

## 证据与明细

详见同目录的 `runtime-readiness.json`、`fixture-registry.json`、`automation-mapping.json`、`formal-manifest.json`、`formal-result.json`、`golden-fixture-registry.json`、`golden-path-result.json`、`golden-path-evidence-index.json`、`evidence-index.json` 和 `cleanup-verification.json`。
