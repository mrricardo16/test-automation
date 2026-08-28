# BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001

- 状态：已复现，待产品修复
- 严重性建议：High（初始化操作导致调度窗体重启）
- 发现方式：正式 Web UI 车辆管理 → TEST_OWNED DummyCar → 初始化
- 影响对象：DummyCar 初始化流程；会话被带回登录界面，后续运行态无法安全确认

## 前置条件

- 当前地图：`AT_0827_02_MAP`
- 车辆：`AT_0827_02_DUMMY(1901)`
- 车型：`DummyOmniForkLiftCar` / `dummyomniforkliftcar`
- 车辆类型：模拟车，图层：`g`

## 复现步骤

1. 在正式车辆管理中新增上述 TEST_OWNED DummyCar。
2. 在该车辆行点击“初始化”。
3. 确认初始化操作。

## 预期结果

初始化完成后车辆应处于可观测、已定位、空闲且无异常状态；调度窗体保持运行。

## 实际结果

- `/action/ResetAGV` 返回 HTTP 200、业务码 200、操作成功。
- 运行态 `siteid` 仍为 `-1`，未完成定位。
- 产品进程随后重启，窗体回到登录界面。
- 产品日志记录 `Car.Reset()` 的 Avalonia `Call from invalid thread` 异常。
- 已在本轮两次复现，时间约为 14:23:41 和 14:26:18。

## 证据

- `../artifacts/dummy-car/dummy-car-initialize-error.json`
- `../artifacts/dummy-car/dummy-car-live-api-provisioning.json`
- 产品日志（只读）：`D:/HZ_RSS40/03_trunk/src_m_rsscomposer/Build/log/2026-08-27/20260827-14Q(00).log`

## 当前测试处置

- 该问题按产品 FAIL 记录，不再重复执行初始化。
- 后续仅允许新增 TEST_OWNED 车辆并核对新增结果；不执行 ResetAGV、重定位、派车或 Golden Path。
- 已创建的测试车辆保留用于新增车辆证据；未因该 Bug 伪造车辆已定位或流程通过。
