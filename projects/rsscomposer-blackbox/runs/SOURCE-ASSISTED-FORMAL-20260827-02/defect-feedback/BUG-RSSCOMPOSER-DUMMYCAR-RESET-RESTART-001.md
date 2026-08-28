# BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001

- DefectId：BUG-RSSCOMPOSER-DUMMYCAR-RESET-RESTART-001
- ExecutionStatus：FAIL
- CoverageStatus：COVERED
- GateStatus：BLOCKED_BY_PRODUCT_DEFECT
- Reproduction：正式车辆管理中新增 DummyCar 后点击初始化。
- Expected：车辆完成定位并保持窗体运行。
- Actual：ResetAGV 返回成功，但 siteid=-1，窗体重启；日志记录 Avalonia Call from invalid thread。
- Evidence：../artifacts/dummy-car/dummy-car-initialize-error.json；产品只读日志路径见主 Bug 记录。
- Next action：产品修复 Car.Reset() 跨线程 UI 调用后回归；本轮禁止再次执行初始化。
- Regression scope：FL-TASK-01～10 及所有依赖 DummyCar 定位的物理流程。
