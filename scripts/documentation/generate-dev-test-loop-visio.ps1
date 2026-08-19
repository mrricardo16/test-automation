[CmdletBinding()]
param(
    [string]$OutputDirectory = '',
    [string]$PdfToPngPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'outputs\process'
}

function Set-CellFormula {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [Parameter(Mandatory)][string]$Formula
    )
    try { $Shape.CellsU($Cell).FormulaU = $Formula } catch { }
}

function Set-ShapeStyle {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Fill,
        [Parameter(Mandatory)][string]$Line = 'RGB(92,110,130)',
        [double]$FontSize = 9,
        [string]$Font = '微软雅黑',
        [bool]$Dashed = $false
    )
    Set-CellFormula $Shape 'FillForegnd' $Fill
    Set-CellFormula $Shape 'FillPattern' '1'
    Set-CellFormula $Shape 'LineColor' $Line
    Set-CellFormula $Shape 'LineWeight' '1.2 pt'
    $effectiveFontSize = [Math]::Round($FontSize * 1.22, 1)
    Set-CellFormula $Shape 'Char.Size' "$effectiveFontSize pt"
    Set-CellFormula $Shape 'Char.Font' ('FONT("' + $Font + '")')
    Set-CellFormula $Shape 'Para.HorzAlign' '1'
    Set-CellFormula $Shape 'Para.VertAlign' '1'
    Set-CellFormula $Shape 'TxtWidth' 'GUARD(Width-0.10 in)'
    Set-CellFormula $Shape 'TxtHeight' 'GUARD(Height-0.08 in)'
    Set-CellFormula $Shape 'LeftMargin' '0.04 in'
    Set-CellFormula $Shape 'RightMargin' '0.04 in'
    Set-CellFormula $Shape 'TopMargin' '0.03 in'
    Set-CellFormula $Shape 'BottomMargin' '0.03 in'
    if ($Dashed) { Set-CellFormula $Shape 'LinePattern' '2' }
}

function New-MasterShape {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)]$Stencil,
        [Parameter(Mandatory)][string]$MasterName,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height,
        [Parameter(Mandatory)][string]$Text,
        [Parameter(Mandatory)][string]$Fill,
        [string]$Line = 'RGB(92,110,130)',
        [double]$FontSize = 8.5,
        [bool]$Dashed = $false
    )
    $shape = $Page.Drop($Stencil.Masters.ItemU($MasterName), $X, $Y)
    Set-CellFormula $shape 'Width' "$Width in"
    Set-CellFormula $shape 'Height' "$Height in"
    $shape.Text = ($Text -replace '\\n', [Environment]::NewLine)
    Set-ShapeStyle $shape $Fill $Line $FontSize '微软雅黑' $Dashed
    return $shape
}

function New-PlainText {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height,
        [Parameter(Mandatory)][string]$Text,
        [double]$FontSize = 8,
        [string]$Color = 'RGB(45,62,80)',
        [bool]$Bold = $false,
        [bool]$Dashed = $false
    )
    $shape = $Page.DrawRectangle($X - $Width / 2, $Y - $Height / 2, $X + $Width / 2, $Y + $Height / 2)
    Set-CellFormula $shape 'FillPattern' '0'
    Set-CellFormula $shape 'LinePattern' '0'
    Set-CellFormula $shape 'Char.Color' $Color
    $effectiveFontSize = [Math]::Round($FontSize * 1.22, 1)
    Set-CellFormula $shape 'Char.Size' "$effectiveFontSize pt"
    Set-CellFormula $shape 'Char.Font' 'FONT("微软雅黑")'
    Set-CellFormula $shape 'Para.HorzAlign' '1'
    Set-CellFormula $shape 'Para.VertAlign' '1'
    Set-CellFormula $shape 'TxtWidth' 'GUARD(Width)'
    Set-CellFormula $shape 'TxtHeight' 'GUARD(Height)'
    if ($Bold) { Set-CellFormula $shape 'Char.Style' '1' }
    if ($Dashed) {
        Set-CellFormula $shape 'FillPattern' '0'
        Set-CellFormula $shape 'LinePattern' '2'
        Set-CellFormula $shape 'LineColor' $Color
        Set-CellFormula $shape 'LineWeight' '0.8 pt'
    }
    $shape.Text = ($Text -replace '\\n', [Environment]::NewLine)
    return $shape
}

function New-Connector {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double]$X1,
        [Parameter(Mandatory)][double]$Y1,
        [Parameter(Mandatory)][double]$X2,
        [Parameter(Mandatory)][double]$Y2,
        [string]$Color = 'RGB(71,94,117)',
        [double]$Weight = 1.5,
        [bool]$Dashed = $false,
        [bool]$Arrow = $true
    )
    $line = $Page.DrawLine($X1, $Y1, $X2, $Y2)
    Set-CellFormula $line 'LineColor' $Color
    Set-CellFormula $line 'LineWeight' "$Weight pt"
    if ($Arrow) { Set-CellFormula $line 'EndArrow' '4' }
    if ($Dashed) { Set-CellFormula $line 'LinePattern' '2' }
    return $line
}

function New-Polyline {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double[]]$Points,
        [string]$Color = 'RGB(71,94,117)',
        [double]$Weight = 1.5,
        [bool]$Dashed = $false
    )
    $line = $Page.DrawPolyline($Points, 0)
    Set-CellFormula $line 'LineColor' $Color
    Set-CellFormula $line 'LineWeight' "$Weight pt"
    Set-CellFormula $line 'EndArrow' '4'
    if ($Dashed) { Set-CellFormula $line 'LinePattern' '2' }
    return $line
}

function Release-ComObject {
    param($Object)
    if ($null -ne $Object) {
        try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { }
    }
}

function Find-PdfToPngExecutable {
    param([string]$ExplicitPath)
    if (-not [string]::IsNullOrWhiteSpace($ExplicitPath) -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $command = Get-Command 'pdftoppm.exe' -ErrorAction SilentlyContinue
    if ($command -and (Test-Path -LiteralPath $command.Source)) {
        return $command.Source
    }

    $runtimeRoots = @(
        (Join-Path $env:LOCALAPPDATA 'codex-runtimes'),
        (Join-Path $env:USERPROFILE '.cache\codex-runtimes')
    ) | Where-Object { Test-Path -LiteralPath $_ }
    foreach ($root in $runtimeRoots) {
        $candidate = Get-ChildItem -LiteralPath $root -Filter 'pdftoppm.exe' -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($candidate) { return $candidate.FullName }
    }
    return $null
}

function Convert-PdfToPng {
    param(
        [Parameter(Mandatory)][string]$PdfPath,
        [Parameter(Mandatory)][string]$PngPath,
        [string]$RendererPath = ''
    )
    $renderer = Find-PdfToPngExecutable $RendererPath
    if (-not $renderer) {
        Write-Warning '未找到 pdftoppm.exe；跳过 PNG 输出，保留有效 VSDX/PDF。'
        return $false
    }

    $prefix = [IO.Path]::Combine([IO.Path]::GetDirectoryName($PngPath), [IO.Path]::GetFileNameWithoutExtension($PngPath))
    & $renderer '-png' '-singlefile' '-r' '144' $PdfPath $prefix
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $PngPath)) {
        throw "PDF 转 PNG 失败：$renderer"
    }
    $signature = [IO.File]::ReadAllBytes($PngPath)
    $expected = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    if ($signature.Length -lt $expected.Length -or (@(0..7 | ForEach-Object { $signature[$_] -eq $expected[$_] }) -contains $false)) {
        throw "PNG 签名无效：$PngPath"
    }
    return $true
}

$created = @()
$visio = $null
$document = $null
$stencil = $null
$verifyDocument = $null

try {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $vsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.vsdx'
    $pdfPath = Join-Path $OutputDirectory '开发测试闭环流程图.pdf'
    $pngPath = Join-Path $OutputDirectory '开发测试闭环流程图.png'
    foreach ($path in @($vsdxPath, $pdfPath, $pngPath)) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }

    $visio = New-Object -ComObject Visio.Application
    $visio.Visible = $false
    $visio.AlertResponse = 7
    $document = $visio.Documents.Add('')
    $page = $document.Pages.Item(1)
    $page.Name = '开发测试闭环'
    $pageSheet = $page.PageSheet
    Set-CellFormula -Shape $pageSheet -Cell 'PageWidth' -Formula '46 in'
    Set-CellFormula -Shape $pageSheet -Cell 'PageHeight' -Formula '34 in'

    $stencilPath = Join-Path ${env:ProgramFiles} 'Microsoft Office\root\Office16\Visio Content\2052\BASIC_M.VSSX'
    if (-not (Test-Path -LiteralPath $stencilPath)) {
        throw "BASIC_M.VSSX 不存在：$stencilPath"
    }
    $stencil = $visio.Documents.OpenEx($stencilPath, 64)

    # 画布背景与标题
    $background = $page.DrawRectangle(0, 0, 46, 34)
    Set-CellFormula $background 'FillForegnd' 'RGB(248,250,252)'
    Set-CellFormula $background 'FillPattern' '1'
    Set-CellFormula $background 'LinePattern' '0'
    $background.SendToBack()
    New-PlainText $page 23 33.1 38 0.75 '开发与测试闭环协作流程图' 22 'RGB(27,55,81)' $true | Out-Null
    New-PlainText $page 23 32.35 38 0.38 '开发端白盒分析 → 测试交接 → 测试端黑盒覆盖测试 → 测试反馈 → 修复 / 更新基线 → 再次交付测试' 9.5 'RGB(77,96,115)' | Out-Null

    # 双泳道
    $devLane = New-MasterShape $page $stencil 'Rectangle' 11.65 15.75 21.2 29.2 '开发端\n白盒分析、设计基线、缺陷修复与再次交付' 'RGB(235,244,252)' 'RGB(80,126,160)' 11
    $testLane = New-MasterShape $page $stencil 'Rectangle' 34.35 15.75 21.2 29.2 '测试端\n黑盒覆盖验证、证据收集与独立反馈' 'RGB(237,248,242)' 'RGB(72,137,98)' 11
    Set-CellFormula $devLane 'FillPattern' '1'
    Set-CellFormula $testLane 'FillPattern' '1'
    $devLane.SendToBack()
    $testLane.SendToBack()
    New-PlainText $page 11.65 30.55 18.5 0.45 '开发端（理解实现，定义并维护 Expected）' 10.5 'RGB(38,91,128)' $true | Out-Null
    New-PlainText $page 34.35 30.55 18.5 0.45 '测试端（依据基线，独立验证 Runtime）' 10.5 'RGB(42,109,73)' $true | Out-Null

    # 开发主流程
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 29.15 9.7 1.18 '获取当前版本\n前后端源码' 'RGB(214,233,248)' | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 27.35 9.7 1.18 'DEV-TEST-HANDOFF Skill\n白盒分析 / 反向工程' 'RGB(214,233,248)' | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 25.55 9.7 1.18 '生成 As-Built\n现状设计文档' 'RGB(214,233,248)' | Out-Null
    New-MasterShape $page $stencil 'Diamond' 11.65 23.55 3.0 1.35 'Design Validation Gate\n设计质量门' 'RGB(255,243,207)' 'RGB(173,128,42)' 7.2 | Out-Null
    New-MasterShape $page $stencil 'Parallelogram' 11.65 21.25 9.7 1.55 '生成 Test Handoff\n测试交接包' 'RGB(221,231,238)' 'RGB(83,105,121)' 8.7 | Out-Null
    New-PlainText $page 11.65 20.05 9.9 0.42 '设计基线：Expected / 业务规则 / API / 权限 / 状态 / 可测试性' 6.8 'RGB(54,75,95)' | Out-Null
    New-Connector $page 11.65 28.55 11.65 27.95 | Out-Null
    New-Connector $page 11.65 26.95 11.65 26.15 | Out-Null
    New-Connector $page 11.65 24.95 11.65 24.25 | Out-Null
    New-Connector $page 11.65 22.85 11.65 22.05 | Out-Null

    # 开发交付说明框
    New-PlainText $page 6.0 25.2 8.9 3.65 "开发 → 测试\n核心交付文件（均为 Markdown）\n1. 测试工作流 / 测试范围 / 模块清单\n2. 页面路由 / 业务规则 / 业务流程\n3. API 合同 / 输入校验 / 权限规则\n4. 状态模型 / Test Data Contract\n5. 可测试性映射 / 错误行为 / 风险优先级\n6. 已知限制 / Coverage Contract / 追踪矩阵\n7. Runtime 可观察点 / Environment Notes" 6.3 'RGB(66,88,107)' $false $true | Out-Null

    # 测试主流程（从跨泳道交付点开始）
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 21.25 9.7 1.35 '接收 Test Handoff\n测试交接包' 'RGB(218,244,227)' 'RGB(62,128,88)' 8.7 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 19.45 9.7 1.18 'Codex 读取测试交接文档\n从 00-TEST-WORKFLOW.md 开始' 'RGB(218,244,227)' 'RGB(62,128,88)' 7.3 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 17.65 9.7 1.22 '建立测试覆盖矩阵\n模块 / 功能 / 规则 / 流程 / 校验 / 权限 / 状态 / 接口 / 异常' 'RGB(218,244,227)' 'RGB(62,128,88)' 6.4 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 15.85 9.7 1.18 '生成 TestCase\n根据 Coverage Contract 设计' 'RGB(218,244,227)' 'RGB(62,128,88)' 7.8 | Out-Null
    New-MasterShape $page $stencil 'Diamond' 34.35 13.75 3.0 1.45 '选择测试方式\nWeb UI / API / UI+API / 人工' 'RGB(255,243,207)' 'RGB(173,128,42)' 7.2 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 11.55 9.7 1.25 '执行覆盖性测试\nPlaywright / API Test / Manual\n真实运行环境验证' 'RGB(218,244,227)' 'RGB(62,128,88)' 7.7 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 9.65 9.7 1.18 '收集测试证据\nScreenshot / Trace / Console / Network\nExpected / Actual' 'RGB(218,244,227)' 'RGB(62,128,88)' 7.3 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 34.35 7.75 9.7 1.18 '汇总测试结果\nPASS / FAIL / ERROR / BLOCKED / MANUAL / NOT_APPLICABLE' 'RGB(218,244,227)' 'RGB(62,128,88)' 6.6 | Out-Null
    New-MasterShape $page $stencil 'Diamond' 34.35 5.75 3.0 1.45 '覆盖目标是否达成？\nCoverage Contract' 'RGB(255,243,207)' 'RGB(173,128,42)' 7.6 | Out-Null
    New-MasterShape $page $stencil 'Parallelogram' 34.35 3.65 9.7 1.55 '测试反馈开发文件\n回归 / 缺陷 / 覆盖 / 偏差 / Evidence' 'RGB(255,232,214)' 'RGB(171,92,43)' 8.2 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 39.3 3.65 3.9 1.55 '本轮回归通过\nCoverage 达标\n无阻断缺陷' 'RGB(223,235,247)' 'RGB(54,102,145)' 8.2 | Out-Null
    New-PlainText $page 29.1 5.8 4.5 0.52 '否：补充 TestCase / 补充测试' 7.2 'RGB(161,93,30)' $false $true | Out-Null
    New-Connector $page 34.35 20.55 34.35 20.05 | Out-Null
    New-Connector $page 34.35 18.85 34.35 18.25 | Out-Null
    New-Connector $page 34.35 17.05 34.35 16.45 | Out-Null
    New-Connector $page 34.35 15.25 34.35 14.48 | Out-Null
    New-Connector $page 34.35 13.02 34.35 12.2 | Out-Null
    New-Connector $page 34.35 10.85 34.35 10.25 | Out-Null
    New-Connector $page 34.35 9.05 34.35 8.35 | Out-Null
    New-Connector $page 34.35 7.15 34.35 6.48 | Out-Null
    New-Connector $page 35.6 5.75 37.4 4.35 'RGB(54,102,145)' 1.8 | Out-Null
    New-Connector $page 33.1 5.75 29.1 5.8 'RGB(190,111,43)' 1.3 $true | Out-Null
    New-Connector $page 29.1 5.55 33.0 11.55 'RGB(190,111,43)' 1.3 $true | Out-Null

    # 交付箭头：开发 → 测试
    New-Connector $page 16.55 21.25 29.45 21.25 'RGB(41,107,160)' 3.2 | Out-Null
    New-PlainText $page 23.0 22.0 10.6 0.55 '开发 → 测试\n测试设计基线 / 测试合同' 8.5 'RGB(31,92,143)' $true | Out-Null

    # 测试反馈箭头：测试 → 开发
    New-Connector $page 29.45 3.65 16.55 16.0 'RGB(195,80,45)' 3.2 | Out-Null
    New-PlainText $page 23.0 15.25 10.8 0.68 '测试 → 开发\n测试结果 / 缺陷 / 覆盖 / 设计偏差 / Evidence' 8.5 'RGB(167,67,40)' $true | Out-Null

    # 开发反馈处理与归因
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 16.0 9.7 1.3 '接收测试反馈\n测试反馈开发文件' 'RGB(255,232,214)' 'RGB(171,92,43)' 8.2 | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 14.15 9.7 1.18 '分析测试反馈\n区分真实结果与基线' 'RGB(255,232,214)' 'RGB(171,92,43)' 8 | Out-Null
    New-MasterShape $page $stencil 'Diamond' 11.65 12.25 3.0 1.45 '问题类型？\n问题归因' 'RGB(255,243,207)' 'RGB(173,128,42)' 8 | Out-Null
    New-PlainText $page 11.65 10.25 9.7 2.65 "产品缺陷 → 修复产品代码 → 开发自检\n设计文档问题 → 修正 As-Built → Design Gate\nDESIGN_RUNTIME_MISMATCH → 核对源码 / 部署 / 设计 / 权限 / Feature Flag\n测试数据 / 环境 / 自动化 / 需求 → 更新对应合同或说明" 6.4 'RGB(115,72,39)' $false $true | Out-Null
    New-MasterShape $page $stencil 'Rounded Rectangle' 11.65 7.8 9.7 1.35 '更新源码 / 更新 As-Built\n更新 Test Data Contract / Environment Notes / Known Issues' 'RGB(233,238,244)' 'RGB(83,105,121)' 7.2 | Out-Null
    New-MasterShape $page $stencil 'Parallelogram' 11.65 5.55 9.7 1.55 '重新生成 Test Handoff\n再次交付测试' 'RGB(221,231,238)' 'RGB(83,105,121)' 8.2 | Out-Null
    New-Connector $page 11.65 15.3 11.65 14.75 'RGB(195,80,45)' 1.8 | Out-Null
    New-Connector $page 11.65 13.55 11.65 12.98 'RGB(195,80,45)' 1.8 | Out-Null
    New-Connector $page 11.65 11.52 11.65 11.55 'RGB(195,80,45)' 1.0 $true | Out-Null
    New-Connector $page 11.65 8.55 11.65 6.35 'RGB(190,111,43)' 2.1 | Out-Null
    New-Polyline $page ([double[]](7.0,5.55,3.0,5.55,3.0,21.25,6.8,21.25)) 'RGB(190,111,43)' 2.5 $false | Out-Null
    New-PlainText $page 3.15 13.5 2.2 5.0 '缺陷回归循环\n修复 / 更新\n→ 重新交付\n→ 再次测试\n→ 再反馈' 8.2 'RGB(178,90,29)' $true | Out-Null

    # 反馈文件清单与证据索引
    New-PlainText $page 17.6 9.6 6.4 3.5 "测试 → 开发\n核心反馈文件\n1. regression-report.md\n2. defect-list.md\n3. coverage-report.md\n4. design-runtime-mismatch.md\n5. manual-boundaries.md\n6. execution-summary.md\n7. evidence-index.md" 6.5 'RGB(126,69,48)' $false $true | Out-Null
    New-PlainText $page 39.1 1.85 9.0 1.0 '测试证据包：错误截图 / Trace / Console / Network / 失败现场\n通过 evidence-index.md 建立索引' 6.5 'RGB(65,87,105)' $false $true | Out-Null

    # 操作手册辅助支线
    New-MasterShape $page $stencil 'Rounded Rectangle' 40.0 7.75 5.0 1.18 '生成已验证操作流程\n仅使用已验证 PASS 流程' 'RGB(241,236,250)' 'RGB(116,82,151)' 7.2 $true | Out-Null
    New-MasterShape $page $stencil 'Parallelogram' 40.0 6.15 5.0 1.18 'Playwright 文档截图\n生成 Word 操作手册' 'RGB(241,236,250)' 'RGB(116,82,151)' 7.2 $true | Out-Null
    New-Connector $page 39.3 7.75 37.85 7.75 'RGB(116,82,151)' 1.1 $true | Out-Null
    New-Connector $page 40.0 7.15 40.0 6.75 'RGB(116,82,151)' 1.1 $true | Out-Null
    New-PlainText $page 40.0 8.95 5.2 0.45 '辅助产物，不是主闭环必要条件' 6.3 'RGB(116,82,151)' | Out-Null

    # 版本级闭环
    New-MasterShape $page $stencil 'Rounded Rectangle' 39.2 28.95 6.7 1.05 '等待下一版本 / 新需求' 'RGB(240,242,245)' 'RGB(107,117,128)' 8.0 $true | Out-Null
    New-Polyline $page ([double[]](42.5,4.4,44.2,4.4,44.2,28.95,42.6,28.95)) 'RGB(107,117,128)' 1.5 $true | Out-Null
    New-Polyline $page ([double[]](35.8,29.0,35.8,28.0,15.0,28.0,15.0,29.0)) 'RGB(107,117,128)' 1.5 $true | Out-Null
    New-PlainText $page 29.5 29.0 9.0 0.45 '版本迭代闭环：新版本 / 新需求 → 获取当前版本源码' 7.0 'RGB(92,105,117)' $true | Out-Null

    # 图例与原则
    New-PlainText $page 4.2 2.0 6.3 1.6 "图例\n矩形：处理流程    菱形：质量门 / 判断\n平行四边形：交付或反馈文件\n实线：主流程    粗色回流：反馈 / 回归\n虚线：辅助产物或版本循环" 6.5 'RGB(57,77,94)' $false $true | Out-Null
    New-PlainText $page 23.0 1.0 34.0 0.48 '原则：开发定义并维护设计基线；测试依据基线独立验证真实运行结果；测试端不得擅自修改 Expected。' 7.6 'RGB(27,55,81)' $true | Out-Null

    $document.SaveAs($vsdxPath)
    $created += $vsdxPath
    try {
        $document.ExportAsFixedFormat(1, $pdfPath, 0, 0, 0, 0, 0, 0)
        if (Test-Path -LiteralPath $pdfPath) { $created += $pdfPath }
    } catch {
        Write-Warning "PDF 导出失败：$($_.Exception.Message)"
    }
    if (Convert-PdfToPng -PdfPath $pdfPath -PngPath $pngPath -RendererPath $PdfToPngPath) {
        $created += $pngPath
    }

    $document.Close()
    Release-ComObject $document
    $document = $null
    $verifyDocument = $visio.Documents.Open($vsdxPath)
    $verifyPage = $verifyDocument.Pages.Item(1)
    $shapeTexts = New-Object System.Collections.Generic.List[string]
    for ($i = 1; $i -le $verifyPage.Shapes.Count; $i++) {
        $text = [string]$verifyPage.Shapes.Item($i).Text
        if (-not [string]::IsNullOrWhiteSpace($text)) { [void]$shapeTexts.Add($text) }
    }
    $allText = $shapeTexts -join "`n"
    $required = @(
        '开发端', '测试端', 'DEV-TEST-HANDOFF', 'As-Built', 'Design Validation Gate',
        'Test Handoff', '测试覆盖矩阵', 'TestCase', 'Playwright', 'API Test',
        'Evidence', 'Coverage Contract', '测试反馈开发文件', 'regression-report.md',
        'defect-list.md', 'coverage-report.md', 'design-runtime-mismatch.md',
        'evidence-index.md', '问题类型', '修复产品代码', '修正 As-Built',
        'DESIGN_RUNTIME_MISMATCH', '重新生成 Test Handoff', '本轮回归通过',
        '等待下一版本 / 新需求'
    )
    $missing = @($required | Where-Object { $allText -notlike "*$_*" })
    if ($missing.Count -gt 0) { throw ('VSDX 关键 Shape 文本缺失：' + ($missing -join ', ')) }
    if ($verifyPage.Shapes.Count -lt 40) { throw "VSDX Shape 数量异常：$($verifyPage.Shapes.Count)" }
    $verifyDocument.Close()
    Release-ComObject $verifyDocument
    $verifyDocument = $null

    $size = (Get-Item -LiteralPath $vsdxPath).Length
    Write-Output "VISIO_AUTOMATION=AVAILABLE"
    Write-Output "VISIO_VERSION=$($visio.Version) BUILD=$($visio.Build)"
    Write-Output "VSDX_PATH=$vsdxPath"
    Write-Output "VSDX_SIZE=$size"
    Write-Output "VSDX_SHAPES=$($shapeTexts.Count)"
    Write-Output "PDF_PATH=$pdfPath EXISTS=$([bool](Test-Path -LiteralPath $pdfPath))"
    Write-Output "PNG_PATH=$pngPath EXISTS=$([bool](Test-Path -LiteralPath $pngPath))"
    Write-Output "VSDX_REOPEN=PASS"
    Write-Output "VSDX_NATIVE_EDITABLE_SHAPES=PASS"
}
catch {
    Write-Error $_
    exit 1
}
finally {
    if ($verifyDocument) { try { $verifyDocument.Close() } catch { } }
    if ($document) { try { $document.Close() } catch { } }
    if ($stencil) { try { $stencil.Close() } catch { } }
    if ($visio) { try { $visio.Quit() } catch { } }
    Release-ComObject $verifyDocument
    Release-ComObject $document
    Release-ComObject $stencil
    Release-ComObject $visio
}
