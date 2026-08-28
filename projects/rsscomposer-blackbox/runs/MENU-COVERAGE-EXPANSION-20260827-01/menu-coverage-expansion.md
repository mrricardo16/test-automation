# Menu Coverage Expansion

- 运行编号：`MENU-COVERAGE-EXPANSION-20260827-01`
- 阶段：Catalog 扩容与 Menu Coverage Gate
- 正式业务执行：未开始
- Catalog：历史 82 条 + 新增 56 条 = 138 条
- IN_SCOPE 叶子菜单：19 个；Gate：**PASS**
- 综合看板：OUT_OF_SCOPE，不计入 Catalog 覆盖率分母

## 缺口决策

- 61 个候选 Operation Gap 已逐项复核。
- 56 个有真实页面/API证据的操作形成细粒度用例。
- 5 个地图共享状态变更操作暂缓：UPDATE、DELETE、STATE、CREATE、INTEGRATION。
- 未把统计页面不存在的分页/重置等操作生成用例。

## 执行边界

- 新用例全部保持“尚未执行”，不继承历史 PASS/FAIL/ERROR/BLOCKED/MANUAL 结果。
- 车辆初始化、重定位、物理运行、正式进程启停、共享地图保存/发布和真实第三方调用均不得由本轮自动化触发。
- 有前置数据要求的用例，必须先通过网页操作创建 TEST_OWNED 数据，并在结束后清理。

## 机器可读证据

- `expanded-testcase-catalog.json`
- `menu-coverage-gate.json`
- `case-design-decisions.json`
- `legacy-result-preservation.json`
- `registry-additions.json`
