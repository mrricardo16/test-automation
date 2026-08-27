# TC-PLATFORM-13-MARKDOWN-TABLE-VALIDATION-001

- TestCaseId: `TC-PLATFORM-13-MARKDOWN-TABLE-VALIDATION-001`
- Title: Markdown 表格语法与 Typora 兼容性校验
- Scope: 最终 Markdown 报告和 Markdown 报告模板的表格生成与静态校验
- Expected: 每个表格具有表头、分隔行和列数一致的数据行；单元格内管道符已转义；正式主表固定九列、最右侧保留图片证据列，并使用 Typora 局部横向滚动和不显示 `<br>` 的单元格换行。
- TestData: 合法 GFM 表格、缺少分隔行的非法表格、列数不一致表格、包含转义管道符的表格；不执行业务页面操作。
- ExecutionStatus: 设计校验用例，未执行真实业务测试。
