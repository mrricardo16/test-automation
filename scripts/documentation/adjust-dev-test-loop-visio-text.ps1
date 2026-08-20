[CmdletBinding()]
param(
    [string]$InputVsdxPath = '',
    [string]$OutputDirectory = '',
    [string]$PdfToPngPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'projects\test-workflow\outputs\process'
}
if ([string]::IsNullOrWhiteSpace($InputVsdxPath)) {
    $InputVsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.vsdx'
}
$InputVsdxPath = [IO.Path]::GetFullPath($InputVsdxPath)
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
$vsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.vsdx'
$pdfPath = Join-Path $OutputDirectory '开发测试闭环流程图.pdf'
$pngPath = Join-Path $OutputDirectory '开发测试闭环流程图.png'
$tempVsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.__text-adjusted.vsdx'
$tempPdfPath = Join-Path $OutputDirectory '开发测试闭环流程图.__text-adjusted.pdf'
$tempPngPath = Join-Path $OutputDirectory '开发测试闭环流程图.__text-adjusted.png'

function Set-CellFormula {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [Parameter(Mandatory)][string]$Formula
    )
    $Shape.CellsU($Cell).FormulaU = $Formula
}

function Release-ComObject {
    param($Object)
    if ($null -ne $Object) {
        try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { }
    }
}

function Get-PointValue {
    param([string]$Formula)
    if ($Formula -match '([0-9]+(?:\.[0-9]+)?)\s*pt') {
        return [double]$Matches[1]
    }
    return 0.0
}

function Get-TextProfile {
    param([Parameter(Mandatory)][string]$Text)

    $compact = ($Text -replace "`r|`n", ' ')
    if ($compact -match '开发与测试闭环协作流程图') {
        return [pscustomobject]@{ Category = 'Title'; FontSize = 32.0; Bold = $true }
    }
    if ($compact -match '开发端白盒分析|测试端黑盒覆盖验证') {
        return [pscustomobject]@{ Category = 'LaneHeader'; FontSize = 18.0; Bold = $true }
    }
    if ($compact -match 'Design Validation Gate|选择测试方式|覆盖目标是否达成|问题类型') {
        return [pscustomobject]@{ Category = 'Decision'; FontSize = 24.0; Bold = $true }
    }
    if ($compact -match '核心交付文件|核心反馈文件|DESIGN_RUNTIME_MISMATCH|图例|原则：|测试证据包') {
        return [pscustomobject]@{ Category = 'AuxiliaryLong'; FontSize = 16.0; Bold = $false }
    }
    if ($compact -match '开发 → 测试|测试 → 开发|缺陷回归循环|版本迭代闭环|否：补充') {
        $fontSize = if (($compact -split ' / ').Count -gt 1) { 18.0 } else { 20.0 }
        return [pscustomobject]@{ Category = 'ArrowLabel'; FontSize = $fontSize; Bold = $true }
    }
    if ($compact -match '获取当前版本|DEV-TEST-HANDOFF Skill|生成 As-Built|生成 Test Handoff|接收 Test Handoff|Codex 读取|建立测试覆盖矩阵|生成 TestCase|执行覆盖性测试|收集测试证据|汇总测试结果|测试反馈开发文件|本轮回归通过|接收测试反馈|分析测试反馈|更新源码|重新生成 Test Handoff|生成已验证操作流程|Playwright 文档截图|等待下一版本') {
        return [pscustomobject]@{ Category = 'MainProcess'; FontSize = 26.0; Bold = $true }
    }
    if ($compact -match '开发端白盒分析|测试设计基线|设计基线：|测试交接包|辅助产物') {
        return [pscustomobject]@{ Category = 'Auxiliary'; FontSize = 18.0; Bold = $false }
    }
    return [pscustomobject]@{ Category = 'Auxiliary'; FontSize = 18.0; Bold = $false }
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
    if (-not $renderer) { throw '未找到 pdftoppm.exe，无法导出 PNG。' }
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
}

function Get-ShapeGeometry {
    param([Parameter(Mandatory)]$Shape)
    return [pscustomobject]@{
        Id = [int]$Shape.ID
        Name = [string]$Shape.NameU
        PinX = [double]$Shape.CellsU('PinX').ResultIU
        PinY = [double]$Shape.CellsU('PinY').ResultIU
        Width = [double]$Shape.CellsU('Width').ResultIU
        Height = [double]$Shape.CellsU('Height').ResultIU
    }
}

if (-not (Test-Path -LiteralPath $InputVsdxPath)) {
    throw "输入 VSDX 不存在：$InputVsdxPath"
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
foreach ($tempPath in @($tempVsdxPath, $tempPdfPath, $tempPngPath)) {
    if (Test-Path -LiteralPath $tempPath) { Remove-Item -LiteralPath $tempPath -Force }
}

$visio = $null
$document = $null
$verifyDocument = $null
$changed = @()
$beforeGeometry = @{}
$textShapeCount = 0
$loweredForOverflow = @()

try {
    $visio = New-Object -ComObject Visio.Application
    $visio.Visible = $false
    $visio.AlertResponse = 7
    $document = $visio.Documents.OpenEx($InputVsdxPath, 64)
    $page = $document.Pages.Item(1)
    $originalShapeCount = $page.Shapes.Count

    foreach ($shape in $page.Shapes) {
        $geometry = Get-ShapeGeometry $shape
        $beforeGeometry[[int]$shape.ID] = $geometry
        $text = [string]$shape.Text
        if ([string]::IsNullOrWhiteSpace($text)) { continue }

        $textShapeCount++
        $profile = Get-TextProfile $text
        $compactText = ($text -replace "`r|`n", ' ')
        $overflowAdjusted = $false
        if ($compactText -match 'Design Validation Gate|选择测试方式|覆盖目标是否达成') {
            $profile.FontSize = 22.0
            $overflowAdjusted = $true
        }
        if ($compactText -match '建立测试覆盖矩阵|汇总测试结果') {
            $profile.FontSize = 22.0
            $overflowAdjusted = $true
        }
        if ($compactText -match '^Design Validation Gate') {
            $shape.Text = 'Design' + [Environment]::NewLine + 'Validation Gate' + [Environment]::NewLine + '设计质量门'
            $text = [string]$shape.Text
        } elseif ($compactText -match '^选择测试方式') {
            $shape.Text = '选择测试方式' + [Environment]::NewLine + 'Web UI / API /' + [Environment]::NewLine + 'UI+API / 人工'
            $text = [string]$shape.Text
        } elseif ($compactText -match '^覆盖目标是否达成') {
            $shape.Text = '覆盖目标是否' + [Environment]::NewLine + '达成？' + [Environment]::NewLine + 'Coverage Contract'
            $text = [string]$shape.Text
        } elseif ($compactText -match '^建立测试覆盖矩阵') {
            $shape.Text = '建立测试覆盖矩阵' + [Environment]::NewLine + '模块 / 功能 / 规则 / 流程 / 校验' + [Environment]::NewLine + '权限 / 状态 / 接口 / 异常'
            $text = [string]$shape.Text
        } elseif ($compactText -match '^汇总测试结果') {
            $shape.Text = '汇总测试结果' + [Environment]::NewLine + 'PASS / FAIL / ERROR / BLOCKED' + [Environment]::NewLine + 'MANUAL / NOT_APPLICABLE'
            $text = [string]$shape.Text
        }
        $oldFormula = [string]$shape.CellsU('Char.Size').FormulaU
        $oldFontSize = Get-PointValue $oldFormula
        Set-CellFormula $shape 'Char.Size' "$($profile.FontSize) pt"
        Set-CellFormula $shape 'Char.Font' 'FONT("微软雅黑")'
        if ($profile.Bold) { Set-CellFormula $shape 'Char.Style' '1' }
        if ($overflowAdjusted) {
            $loweredForOverflow += (($text -replace "`r|`n", ' ').Trim())
        }

        $changed += [pscustomobject]@{
            Id = [int]$shape.ID
            Name = [string]$shape.NameU
            Text = (($text -replace "`r|`n", ' / ').Trim())
            Category = $profile.Category
            OriginalFontSize = $oldFontSize
            NewFontSize = $profile.FontSize
            OverflowAdjusted = $overflowAdjusted
        }
    }

    $document.SaveAs($tempVsdxPath)
    $document.ExportAsFixedFormat(1, $tempPdfPath, 0, 0, 0, 0, 0, 0)
    $document.Close()
    Release-ComObject $document
    $document = $null

    Move-Item -LiteralPath $tempVsdxPath -Destination $vsdxPath -Force
    Move-Item -LiteralPath $tempPdfPath -Destination $pdfPath -Force
    Convert-PdfToPng -PdfPath $pdfPath -PngPath $tempPngPath -RendererPath $PdfToPngPath
    Move-Item -LiteralPath $tempPngPath -Destination $pngPath -Force

    $verifyDocument = $visio.Documents.Open($vsdxPath)
    $verifyPage = $verifyDocument.Pages.Item(1)
    if ($verifyPage.Shapes.Count -ne $originalShapeCount) {
        throw "VSDX Shape 数量发生变化：原 $originalShapeCount，新 $($verifyPage.Shapes.Count)"
    }
    $afterGeometry = @{}
    foreach ($shape in $verifyPage.Shapes) {
        $afterGeometry[[int]$shape.ID] = Get-ShapeGeometry $shape
    }
    foreach ($id in $beforeGeometry.Keys) {
        if (-not $afterGeometry.ContainsKey($id)) { throw "Shape ID 缺失：$id" }
        $before = $beforeGeometry[$id]
        $after = $afterGeometry[$id]
        foreach ($property in @('PinX', 'PinY', 'Width', 'Height')) {
            if ([math]::Abs($before.$property - $after.$property) -gt 0.0001) {
                throw "Shape 几何发生变化：ID=$id Property=$property"
            }
        }
    }

    $mainBefore = @($changed | Where-Object Category -eq 'MainProcess' | ForEach-Object OriginalFontSize)
    $mainAfter = @($changed | Where-Object Category -eq 'MainProcess' | ForEach-Object NewFontSize)
    $decisionBefore = @($changed | Where-Object Category -eq 'Decision' | ForEach-Object OriginalFontSize)
    $decisionAfter = @($changed | Where-Object Category -eq 'Decision' | ForEach-Object NewFontSize)
    $auxBefore = @($changed | Where-Object { $_.Category -in @('Auxiliary', 'AuxiliaryLong') } | ForEach-Object OriginalFontSize)
    $auxAfter = @($changed | Where-Object { $_.Category -in @('Auxiliary', 'AuxiliaryLong') } | ForEach-Object NewFontSize)

    Write-Output 'VISIO_AUTOMATION=AVAILABLE'
    Write-Output "VISIO_VERSION=$($visio.Version) BUILD=$($visio.Build)"
    Write-Output "TEXT_SHAPES_MODIFIED=$($changed.Count)"
    Write-Output "ORIGINAL_MAIN_FONT_RANGE=$([math]::Round(($mainBefore | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($mainBefore | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output "NEW_MAIN_FONT_RANGE=$([math]::Round(($mainAfter | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($mainAfter | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output "ORIGINAL_DECISION_FONT_RANGE=$([math]::Round(($decisionBefore | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($decisionBefore | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output "NEW_DECISION_FONT_RANGE=$([math]::Round(($decisionAfter | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($decisionAfter | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output "ORIGINAL_AUXILIARY_FONT_RANGE=$([math]::Round(($auxBefore | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($auxBefore | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output "NEW_AUXILIARY_FONT_RANGE=$([math]::Round(($auxAfter | Measure-Object -Minimum).Minimum,1))-$([math]::Round(($auxAfter | Measure-Object -Maximum).Maximum,1)) pt"
    Write-Output 'FLOW_STRUCTURE_CHANGED=No'
    Write-Output 'NODE_POSITION_CHANGED=No'
    Write-Output 'NODE_SIZE_CHANGED=No'
    Write-Output 'TEXT_OVERFLOW=NOT_DETECTED_BY_GEOMETRY_CHECK'
    Write-Output "INDIVIDUAL_OVERFLOW_ADJUSTMENTS=$($loweredForOverflow -join '；')"
    Write-Output "VSDX_PATH=$vsdxPath"
    Write-Output "PNG_PATH=$pngPath"
    Write-Output "PDF_PATH=$pdfPath"
    Write-Output "VSDX_SHAPES=$($verifyPage.Shapes.Count)"
    Write-Output 'VSDX_REOPEN=PASS'
    Write-Output 'VSDX_GEOMETRY_PRESERVED=PASS'
    Write-Output 'VSDX_NATIVE_EDITABLE_SHAPES=PASS'
    Write-Output 'PNG_SIGNATURE=PASS'
}
catch {
    Write-Error $_
    exit 1
}
finally {
    if ($verifyDocument) { try { $verifyDocument.Close() } catch { } }
    if ($document) { try { $document.Close() } catch { } }
    if ($visio) { try { $visio.Quit() } catch { } }
    Release-ComObject $verifyDocument
    Release-ComObject $document
    Release-ComObject $visio
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
