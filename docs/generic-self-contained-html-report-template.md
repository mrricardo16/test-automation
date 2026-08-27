# 自包含单文件 HTML 测试报告模板

Markdown 是主源，导出的 HTML 是交付制品。HTML 将 CSS、交互脚本和已解析的本地 PNG、JPEG/JPG、WEBP、GIF 全部内嵌，不使用外部 CSS、JavaScript、字体、CDN 或网络资源；复制单一 HTML 到新目录后仍可离线打开。

主 TestCase 表保留九列，图片证据位于最右列。宽表仅在 `.testcase-table-scroll` 内横向滚动，页面不横向滚动；表头 Sticky。步骤、预期、测试数据和前置条件使用真实 HTML block 分行。

顶部目录使用页内 Anchor。已嵌入图片可点击打开 Lightbox，并支持点击背景或 Escape 关闭。缺失或不支持图片显示“图片证据缺失”及原始相对路径，并由校验器计数。

本模板不实现搜索，也不将“测试场景”和 `TestCaseId` 两列 Sticky。
