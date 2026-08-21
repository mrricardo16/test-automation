[CmdletBinding()]
param(
    [string]$OutputDirectory = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$VSDX_EXPORT_MODE = 'SKELETON'
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'projects\test-workflow\outputs\process'
}

function Set-CellFormula {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [Parameter(Mandatory)][string]$Formula
    )
    try { $Shape.CellsU($Cell).FormulaU = $Formula } catch { }
}

function Release-ComObject {
    param($Object)
    if ($null -ne $Object) {
        try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { }
    }
}

function Set-Style {
    param(
        [Parameter(Mandatory)]$Shape,
        [string]$Fill = 'RGB(247,247,247)',
        [string]$Line = 'RGB(90,90,90)',
        [double]$FontSize = 9,
        [string]$FontColor = 'RGB(30,30,30)',
        [bool]$Bold = $false,
        [bool]$Dashed = $false
    )
    Set-CellFormula $Shape 'FillForegnd' $Fill
    Set-CellFormula $Shape 'FillPattern' '1'
    Set-CellFormula $Shape 'LineColor' $Line
    Set-CellFormula $Shape 'LineWeight' '1.1 pt'
    Set-CellFormula $Shape 'Char.Color' $FontColor
    Set-CellFormula $Shape 'Char.Size' "$FontSize pt"
    Set-CellFormula $Shape 'Char.Font' 'FONT("微软雅黑")'
    Set-CellFormula $Shape 'Para.HorzAlign' '1'
    Set-CellFormula $Shape 'Para.VertAlign' '1'
    Set-CellFormula $Shape 'TxtWidth' 'GUARD(Width-0.10 in)'
    Set-CellFormula $Shape 'TxtHeight' 'GUARD(Height-0.08 in)'
    Set-CellFormula $Shape 'LeftMargin' '0.04 in'
    Set-CellFormula $Shape 'RightMargin' '0.04 in'
    Set-CellFormula $Shape 'TopMargin' '0.03 in'
    Set-CellFormula $Shape 'BottomMargin' '0.03 in'
    if ($Bold) { Set-CellFormula $Shape 'Char.Style' '1' }
    if ($Dashed) { Set-CellFormula $Shape 'LinePattern' '2' }
}

function New-Shape {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)]$Stencil,
        [Parameter(Mandatory)][string]$Master,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height,
        [string]$Text = '',
        [string]$Fill = 'RGB(247,247,247)',
        [string]$Line = 'RGB(90,90,90)',
        [double]$FontSize = 9,
        [string]$FontColor = 'RGB(30,30,30)',
        [bool]$Bold = $false,
        [bool]$Dashed = $false
    )
    $shape = $Page.DrawRectangle($X - $Width / 2, $Y - $Height / 2, $X + $Width / 2, $Y + $Height / 2)
    Set-CellFormula $shape 'Width' "$Width in"
    Set-CellFormula $shape 'Height' "$Height in"
    if ($Master -eq 'Diamond') {
        Set-CellFormula $shape 'Angle' '45 deg'
        Set-CellFormula $shape 'TxtAngle' '-45 deg'
    }
    $shape.Text = ($Text -replace '\\n', [Environment]::NewLine)
    Set-Style $shape $Fill $Line $FontSize $FontColor $Bold $Dashed
    return $shape
}

function New-Text {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height,
        [Parameter(Mandatory)][string]$Text,
        [double]$FontSize = 8,
        [string]$Color = 'RGB(45,45,45)',
        [bool]$Bold = $false,
        [bool]$Dashed = $false
    )
    $shape = $Page.DrawRectangle($X - $Width / 2, $Y - $Height / 2, $X + $Width / 2, $Y + $Height / 2)
    Set-CellFormula $shape 'FillPattern' '0'
    Set-CellFormula $shape 'LinePattern' '0'
    Set-CellFormula $shape 'Char.Color' $Color
    Set-CellFormula $shape 'Char.Size' "$FontSize pt"
    Set-CellFormula $shape 'Char.Font' 'FONT("微软雅黑")'
    Set-CellFormula $shape 'Para.HorzAlign' '1'
    Set-CellFormula $shape 'Para.VertAlign' '1'
    Set-CellFormula $shape 'TxtWidth' 'GUARD(Width)'
    Set-CellFormula $shape 'TxtHeight' 'GUARD(Height)'
    if ($Bold) { Set-CellFormula $shape 'Char.Style' '1' }
    if ($Dashed) {
        Set-CellFormula $shape 'LinePattern' '2'
        Set-CellFormula $shape 'LineColor' $Color
    }
    $shape.Text = ($Text -replace '\\n', [Environment]::NewLine)
    return $shape
}

function New-Arrow {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double]$X1,
        [Parameter(Mandatory)][double]$Y1,
        [Parameter(Mandatory)][double]$X2,
        [Parameter(Mandatory)][double]$Y2,
        [string]$Color = 'RGB(0,112,192)',
        [double]$Weight = 1.2,
        [bool]$Dashed = $false
    )
    $line = $Page.DrawLine($X1, $Y1, $X2, $Y2)
    Set-CellFormula $line 'LineColor' $Color
    Set-CellFormula $line 'LineWeight' "$Weight pt"
    Set-CellFormula $line 'EndArrow' '4'
    if ($Dashed) { Set-CellFormula $line 'LinePattern' '2' }
    return $line
}

function New-PolylineArrow {
    param(
        [Parameter(Mandatory)]$Page,
        [Parameter(Mandatory)][double[]]$Points,
        [string]$Color = 'RGB(0,112,192)',
        [double]$Weight = 1.2,
        [bool]$Dashed = $false
    )
    $line = $Page.DrawPolyline($Points, 0)
    Set-CellFormula $line 'LineColor' $Color
    Set-CellFormula $line 'LineWeight' "$Weight pt"
    Set-CellFormula $line 'EndArrow' '4'
    if ($Dashed) { Set-CellFormula $line 'LinePattern' '2' }
    return $line
}

function Read-ZipEntryText {
    param(
        [Parameter(Mandatory)]$Archive,
        [Parameter(Mandatory)][string]$EntryName
    )
    $entry = $Archive.Entries | Where-Object FullName -eq $EntryName | Select-Object -First 1
    if (-not $entry) { throw "VSDX 缺少 ZIP 条目：$EntryName" }
    $stream = $entry.Open()
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() }
    finally { $reader.Dispose(); $stream.Dispose() }
}

function Convert-VstxToVsdx {
    param(
        [Parameter(Mandatory)][string]$TemplatePath,
        [Parameter(Mandatory)][string]$OutputPath,
        [hashtable]$ReplacementText = @{}
    )
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $source = [IO.Compression.ZipFile]::OpenRead($TemplatePath)
    $target = [IO.Compression.ZipFile]::Open($OutputPath, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($entry in $source.Entries) {
            $newEntry = $target.CreateEntry($entry.FullName, [IO.Compression.CompressionLevel]::Optimal)
            $input = $entry.Open()
            $output = $newEntry.Open()
            try {
                if ($ReplacementText.ContainsKey($entry.FullName)) {
                    $bytes = [Text.Encoding]::UTF8.GetBytes([string]$ReplacementText[$entry.FullName])
                    $output.Write($bytes, 0, $bytes.Length)
                } elseif ($entry.FullName -eq '[Content_Types].xml' -or $entry.FullName.EndsWith('.xml', [StringComparison]::OrdinalIgnoreCase)) {
                    $reader = New-Object IO.StreamReader($input, [Text.Encoding]::UTF8)
                    $xml = $reader.ReadToEnd()
                    $xml = $xml.Replace('application/vnd.ms-visio.template.main+xml', 'application/vnd.ms-visio.drawing.main+xml')
                    $xml = [regex]::Replace($xml, '<\?NewValue[^?]*\?>', '')
                    $bytes = [Text.Encoding]::UTF8.GetBytes($xml)
                    $output.Write($bytes, 0, $bytes.Length)
                    $reader.Dispose()
                } else {
                    $input.CopyTo($output)
                }
            }
            finally { $output.Dispose(); $input.Dispose() }
        }
    }
    finally { $target.Dispose(); $source.Dispose() }
}

$visio = $null
$verifyVisio = $null
$document = $null
$stencil = $null
$verifyDocument = $null
$debugLogPath = ''

function Write-DebugStep {
    param([Parameter(Mandatory)][string]$Message)
    if (-not [string]::IsNullOrWhiteSpace($debugLogPath)) {
        Add-Content -LiteralPath $debugLogPath -Value ("{0} {1}" -f (Get-Date -Format 'HH:mm:ss.fff'), $Message) -Encoding UTF8
    }
}

function Get-ShapeCellResult {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [double]$Default = 0
    )
    try { return [double]$Shape.CellsU($Cell).ResultIU }
    catch { return $Default }
}

function Get-ShapeFormula {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [string]$Default = ''
    )
    try { return [string]$Shape.CellsU($Cell).FormulaU }
    catch { return $Default }
}

function Convert-VisioColorToHex {
    param(
        [Parameter(Mandatory)]$Shape,
        [Parameter(Mandatory)][string]$Cell,
        [string]$Default = '#FFFFFF'
    )
    $formula = Get-ShapeFormula $Shape $Cell $Default
    $match = [regex]::Match($formula, 'RGB\((\d+),(\d+),(\d+)\)')
    if ($match.Success) {
        return '#{0:X2}{1:X2}{2:X2}' -f [int]$match.Groups[1].Value, [int]$match.Groups[2].Value, [int]$match.Groups[3].Value
    }
    if ($formula -match '^#[0-9A-Fa-f]{6}$') { return $formula }
    return $Default
}

function Add-VsdxCell {
    param(
        [Parameter(Mandatory)]$XmlDocument,
        [Parameter(Mandatory)]$Parent,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Value,
        [string]$Formula = '',
        [string]$Unit = ''
    )
    $cell = $XmlDocument.CreateElement('Cell', 'http://schemas.microsoft.com/office/visio/2012/main')
    $cell.SetAttribute('N', $Name)
    $cell.SetAttribute('V', $Value)
    if (-not [string]::IsNullOrWhiteSpace($Formula)) { $cell.SetAttribute('F', $Formula) }
    if (-not [string]::IsNullOrWhiteSpace($Unit)) { $cell.SetAttribute('U', $Unit) }
    [void]$Parent.AppendChild($cell)
}

function Add-VsdxGeometry {
    param(
        [Parameter(Mandatory)]$XmlDocument,
        [Parameter(Mandatory)]$ShapeElement,
        [switch]$Diamond,
        [double[]]$Points = $null
    )
    $ns = 'http://schemas.microsoft.com/office/visio/2012/main'
    $section = $XmlDocument.CreateElement('Section', $ns)
    $section.SetAttribute('N', 'Geometry')
    $section.SetAttribute('IX', '0')
    Add-VsdxCell $XmlDocument $section 'NoFill' '0'
    Add-VsdxCell $XmlDocument $section 'NoLine' '0'
    if ($null -ne $Points -and $Points.Count -ge 4) {
        $rows = @()
        for ($i = 0; $i -lt $Points.Count; $i += 2) {
            $rows += ,@($(if($i -eq 0){'RelMoveTo'}else{'RelLineTo'}), [string](($i / 2) + 1), [string]$Points[$i], [string]$Points[$i + 1])
        }
    } elseif ($Diamond) {
        $rows = @(
            @('RelMoveTo', '1', '0.5', '0'),
            @('RelLineTo', '2', '1', '0.5'),
            @('RelLineTo', '3', '0.5', '1'),
            @('RelLineTo', '4', '0', '0.5'),
            @('RelLineTo', '5', '0.5', '0')
        )
    } else {
        $rows = @(
            @('RelMoveTo', '1', '0', '0'),
            @('RelLineTo', '2', '1', '0'),
            @('RelLineTo', '3', '1', '1'),
            @('RelLineTo', '4', '0', '1'),
            @('RelLineTo', '5', '0', '0')
        )
    }
    foreach ($rowData in $rows) {
        $row = $XmlDocument.CreateElement('Row', $ns)
        $row.SetAttribute('T', $rowData[0])
        $row.SetAttribute('IX', $rowData[1])
        Add-VsdxCell $XmlDocument $row 'X' $rowData[2]
        Add-VsdxCell $XmlDocument $row 'Y' $rowData[3]
        [void]$section.AppendChild($row)
    }
    [void]$ShapeElement.AppendChild($section)
}

function Convert-CanonicalPointToVisio {
    param(
        [Parameter(Mandatory)]$Layout,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y
    )
    return [pscustomobject]@{
        X = ($X / $Layout.Page.SourceWidth) * $Layout.Page.VisioWidthIn
        Y = $Layout.Page.VisioHeightIn - (($Y / $Layout.Page.SourceHeight) * $Layout.Page.VisioHeightIn)
    }
}

function Convert-CanonicalRectToVisio {
    param(
        [Parameter(Mandatory)]$Layout,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height
    )
    $topLeft = Convert-CanonicalPointToVisio $Layout $X $Y
    return [pscustomobject]@{
        PinX = $topLeft.X + (($Width / $Layout.Page.SourceWidth) * $Layout.Page.VisioWidthIn / 2)
        PinY = $topLeft.Y - (($Height / $Layout.Page.SourceHeight) * $Layout.Page.VisioHeightIn / 2)
        Width = ($Width / $Layout.Page.SourceWidth) * $Layout.Page.VisioWidthIn
        Height = ($Height / $Layout.Page.SourceHeight) * $Layout.Page.VisioHeightIn
    }
}

function Convert-CanonicalEdgePointsToVisio {
    param(
        [Parameter(Mandatory)]$Layout,
        [Parameter(Mandatory)]$Edge
    )
    $sourcePoints = @($Edge.Points)
    $visioPoints = New-Object 'System.Collections.Generic.List[object]'
    for ($i = 0; $i -lt $sourcePoints.Count; $i++) {
        $point = @($sourcePoints[$i])
        [void]$visioPoints.Add((Convert-CanonicalPointToVisio $Layout $point[0] $point[1]))
    }
    return $visioPoints.ToArray()
}

function Add-VsdxTextSection {
    param(
        [Parameter(Mandatory)]$XmlDocument,
        [Parameter(Mandatory)]$ShapeElement,
        [Parameter(Mandatory)][double]$FontSize,
        [string]$TextColor = '#1E1E1E'
    )
    $ns = 'http://schemas.microsoft.com/office/visio/2012/main'
    $character = $XmlDocument.CreateElement('Section', $ns)
    $character.SetAttribute('N', 'Character')
    $character.SetAttribute('IX', '0')
    $charRow = $XmlDocument.CreateElement('Row', $ns)
    $charRow.SetAttribute('IX', '0')
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $charRow -Name 'Font' -Value 'SimSun'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $charRow -Name 'Color' -Value $TextColor
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $charRow -Name 'Size' -Value ([Convert]::ToString(($FontSize / 72), [Globalization.CultureInfo]::InvariantCulture))
    [void]$character.AppendChild($charRow)
    [void]$ShapeElement.AppendChild($character)
}

function New-VsdxShapeElement {
    param(
        [Parameter(Mandatory)]$XmlDocument,
        [Parameter(Mandatory)]$Layout,
        [Parameter(Mandatory)][int]$Id,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][double]$X,
        [Parameter(Mandatory)][double]$Y,
        [Parameter(Mandatory)][double]$Width,
        [Parameter(Mandatory)][double]$Height,
        [string]$Text = '',
        [ValidateSet('Process','Decision','Lane','Header','Note','Text','Annotation')][string]$Kind = 'Process',
        [double]$FontSize = 9,
        [string]$TextColor = '#1E1E1E',
        [string]$LineColorOverride = '',
        [string]$FillColorOverride = ''
    )
    $ns = 'http://schemas.microsoft.com/office/visio/2012/main'
    $rect = Convert-CanonicalRectToVisio $Layout $X $Y $Width $Height
    $shape = $XmlDocument.CreateElement('Shape', $ns)
    $shape.SetAttribute('ID', [string]$Id)
    $shape.SetAttribute('NameU', $Name)
    $shape.SetAttribute('Type', 'Shape')
    $shape.SetAttribute('LineStyle', '0')
    $shape.SetAttribute('FillStyle', '0')
    $shape.SetAttribute('TextStyle', '0')
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'PinX' -Value ([Convert]::ToString($rect.PinX, [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'PinY' -Value ([Convert]::ToString($rect.PinY, [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'Width' -Value ([Convert]::ToString($rect.Width, [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'Height' -Value ([Convert]::ToString($rect.Height, [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'LocPinX' -Value ([Convert]::ToString(($rect.Width / 2), [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'LocPinY' -Value ([Convert]::ToString(($rect.Height / 2), [Globalization.CultureInfo]::InvariantCulture)) -Unit 'IN'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'Angle' -Value '0' -Unit 'RAD'
    switch ($Kind) {
        'Process' { $fill='#F8A652'; $line='#C8782D' }
        'Decision' { $fill='#EE2323'; $line='#8C0000' }
        'Lane' { $fill='#FAFAFA'; $line='#265D91' }
        'Header' { $fill='#EDE9F4'; $line='#265D91' }
        'Note' { $fill='#EBEBEB'; $line='#6E6E6E' }
        'Annotation' { $fill='#FFFFFF'; $line='#375573' }
        default { $fill='#FFFFFF'; $line='#FFFFFF' }
    }
    if (-not [string]::IsNullOrWhiteSpace($LineColorOverride)) { $line = $LineColorOverride }
    if (-not [string]::IsNullOrWhiteSpace($FillColorOverride)) { $fill = $FillColorOverride }
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'FillForegnd' -Value $fill
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'FillPattern' -Value $(if($Kind -in @('Text','Annotation')){'0'}else{'1'})
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'LineColor' -Value $line
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'LineWeight' -Value '0.01527777777777778'
    Add-VsdxCell -XmlDocument $XmlDocument -Parent $shape -Name 'LinePattern' -Value $(if($Kind -in @('Note','Annotation')){'2'}else{'1'})
    if ($Kind -eq 'Decision') { Add-VsdxGeometry -XmlDocument $XmlDocument -ShapeElement $shape -Diamond }
    else { Add-VsdxGeometry -XmlDocument $XmlDocument -ShapeElement $shape }
    if (-not [string]::IsNullOrEmpty($Text)) {
        $textElement = $XmlDocument.CreateElement('Text', $ns)
        $textElement.InnerText = $Text -replace '\\n', [Environment]::NewLine
        [void]$shape.AppendChild($textElement)
    }
    Add-VsdxTextSection -XmlDocument $XmlDocument -ShapeElement $shape -FontSize $FontSize -TextColor $TextColor
    return $shape
}

function New-VsdxPageXml {
    param(
        [Parameter(Mandatory)]$Layout,
        [ValidateSet('SKELETON')][string]$ExportMode = 'SKELETON'
    )
    if ($ExportMode -ne 'SKELETON') { throw "不支持的 VSDX 导出模式：$ExportMode" }
    $ns = 'http://schemas.microsoft.com/office/visio/2012/main'
    $xml = New-Object System.Xml.XmlDocument
    $declaration = $xml.CreateXmlDeclaration('1.0', 'utf-8', $null)
    [void]$xml.AppendChild($declaration)
    $root = $xml.CreateElement('PageContents', $ns)
    $root.SetAttribute('xmlns:r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $root.SetAttribute('xml:space', 'preserve')
    [void]$xml.AppendChild($root)
    $shapesElement = $xml.CreateElement('Shapes', $ns)
    [void]$root.AppendChild($shapesElement)
    $id = 1
    foreach ($lane in $Layout.Swimlanes) {
        [void]$shapesElement.AppendChild((New-VsdxShapeElement -XmlDocument $xml -Layout $Layout -Id $id -Name "$($lane.Id)-lane" -X $lane.X -Y $lane.Y -Width $lane.Width -Height $lane.Height -Kind 'Lane')); $id++
        [void]$shapesElement.AppendChild((New-VsdxShapeElement -XmlDocument $xml -Layout $Layout -Id $id -Name "$($lane.Id)-header" -X $lane.X -Y $lane.Y -Width $lane.Width -Height $lane.HeaderHeight -Text $lane.Text -Kind 'Header' -FontSize 22)); $id++
    }
    foreach ($node in $Layout.Nodes | Where-Object Type -ne 'Note') {
        [void]$shapesElement.AppendChild((New-VsdxShapeElement -XmlDocument $xml -Layout $Layout -Id $id -Name $node.Id -X $node.X -Y $node.Y -Width $node.Width -Height $node.Height -Text $node.Text -Kind $node.Type -FontSize $node.Font)); $id++
    }
    foreach ($node in $Layout.Nodes | Where-Object Type -eq 'Note') {
        [void]$shapesElement.AppendChild((New-VsdxShapeElement -XmlDocument $xml -Layout $Layout -Id $id -Name $node.Id -X $node.X -Y $node.Y -Width $node.Width -Height $node.Height -Text $node.Text -Kind 'Note' -FontSize $node.Font)); $id++
    }
    foreach ($annotation in $Layout.Annotations) {
        [void]$shapesElement.AppendChild((New-VsdxShapeElement -XmlDocument $xml -Layout $Layout -Id $id -Name $annotation.Id -X $annotation.X -Y $annotation.Y -Width $annotation.Width -Height $annotation.Height -Text $annotation.Text -Kind 'Annotation' -FontSize $annotation.Font -TextColor $annotation.TextColor -LineColorOverride $annotation.LineColor -FillColorOverride $annotation.FillColor)); $id++
    }
    return $xml.OuterXml
}

function Update-VsdxPagesXml {
    param(
        [Parameter(Mandatory)][string]$PagesXml,
        [Parameter(Mandatory)][string]$PageName,
        [Parameter(Mandatory)]$Layout
    )
    $xml = [xml]$PagesXml
    $manager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $manager.AddNamespace('v', 'http://schemas.microsoft.com/office/visio/2012/main')
    $page = $xml.SelectSingleNode('//v:Page', $manager)
    $page.SetAttribute('NameU', $PageName)
    $page.SetAttribute('Name', $PageName)
    $page.SetAttribute('ViewScale', '1')
    $page.SetAttribute('ViewCenterX', '12')
    $page.SetAttribute('ViewCenterY', '15')
    $pageSpecs = @(
        @('PageWidth', [Convert]::ToString($Layout.Page.VisioWidthIn, [Globalization.CultureInfo]::InvariantCulture)),
        @('PageHeight', [Convert]::ToString($Layout.Page.VisioHeightIn, [Globalization.CultureInfo]::InvariantCulture))
    )
    foreach ($spec in $pageSpecs) {
        $cell = $xml.SelectSingleNode("//v:PageSheet/v:Cell[@N='$($spec[0])']", $manager)
        $cell.SetAttribute('V', $spec[1])
        $cell.SetAttribute('U', 'IN')
    }
    $marginSpecs = @(
        @('PageScale', '1'),
        @('DrawingScale', '1'),
        @('ShdwOffsetX', '0.125'),
        @('ShdwOffsetY', '-0.125'),
        @('PageLeftMargin', [Convert]::ToString($Layout.Page.MarginLeftIn, [Globalization.CultureInfo]::InvariantCulture)),
        @('PageRightMargin', [Convert]::ToString($Layout.Page.MarginRightIn, [Globalization.CultureInfo]::InvariantCulture)),
        @('PageTopMargin', [Convert]::ToString($Layout.Page.MarginTopIn, [Globalization.CultureInfo]::InvariantCulture)),
        @('PageBottomMargin', [Convert]::ToString($Layout.Page.MarginBottomIn, [Globalization.CultureInfo]::InvariantCulture))
    )
    foreach ($spec in $marginSpecs) {
        $cell = $xml.SelectSingleNode("//v:PageSheet/v:Cell[@N='$($spec[0])']", $manager)
        if ($cell) { $cell.SetAttribute('V', $spec[1]); $cell.SetAttribute('U', 'IN') }
    }
    foreach ($instruction in @($xml.SelectNodes('//processing-instruction()'))) {
        [void]$instruction.ParentNode.RemoveChild($instruction)
    }
    return $xml.OuterXml
}

function Update-VsdxWindowsXml {
    param(
        [Parameter(Mandatory)][string]$WindowsXml
    )
    $xml = [xml]$WindowsXml
    $manager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $manager.AddNamespace('v', 'http://schemas.microsoft.com/office/visio/2012/main')
    $drawingWindow = $xml.SelectSingleNode('//v:Window[@WindowType="Drawing"]', $manager)
    if (-not $drawingWindow) { throw 'VSDX 模板缺少 Drawing Window。' }
    foreach ($name in @('ShowPageBreaks', 'ShowGuides', 'ShowConnectionPoints', 'ShowGrid')) {
        $cell = $drawingWindow.SelectSingleNode("./v:$name", $manager)
        if ($cell) { $cell.InnerText = '0' }
    }
    return $xml.OuterXml
}

function Get-CanonicalLayout {
    $page = [pscustomobject]@{
        SourceWidth = 1200.0
        SourceHeight = 1500.0
        VisioWidthIn = 24.0
        VisioHeightIn = 30.0
        MarginTopIn = 0.25
        MarginBottomIn = 0.25
        MarginLeftIn = 0.25
        MarginRightIn = 0.25
    }
    $styles = [pscustomobject]@{
        OrangeFill = '#F8A652'
        OrangeLine = '#C8782D'
        RedFill = '#EE2323'
        RedLine = '#8C0000'
        Blue = '#0070C0'
        Feedback = '#D25823'
        Gray = '#6E6E6E'
        LaneFill = '#FAFAFA'
        HeaderFill = '#EDE9F4'
        Border = '#265D91'
    }
    $swimlanes = @(
        [pscustomobject]@{ Id='dev'; Text='开发'; X=40.0; Y=100.0; Width=550.0; Height=1300.0; HeaderHeight=68.0 },
        [pscustomobject]@{ Id='test'; Text='测试'; X=610.0; Y=100.0; Width=550.0; Height=1300.0; HeaderHeight=68.0 }
    )
    $nodes = @(
        [pscustomobject]@{ Id='dev-source'; Lane='dev'; Type='Process'; Text='获取当前版本源码'; X=195.0; Y=200.0; Width=240.0; Height=54.0; Font=16.0 },
        [pscustomobject]@{ Id='dev-whitebox'; Lane='dev'; Type='Process'; Text='白盒分析实现'; X=195.0; Y=310.0; Width=240.0; Height=54.0; Font=16.0 },
        [pscustomobject]@{ Id='dev-baseline'; Lane='dev'; Type='Process'; Text='维护设计基线\n实现与预期'; X=195.0; Y=420.0; Width=240.0; Height=54.0; Font=14.0 },
        [pscustomobject]@{ Id='dev-handoff'; Lane='dev'; Type='Process'; Text='开发 Skill 生成\n测试交接包'; X=195.0; Y=530.0; Width=240.0; Height=54.0; Font=14.0 },
        [pscustomobject]@{ Id='dev-feedback'; Lane='dev'; Type='Process'; Text='接收测试反馈'; X=195.0; Y=780.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='dev-analyze'; Lane='dev'; Type='Process'; Text='分析问题归因'; X=195.0; Y=890.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='dev-fix'; Lane='dev'; Type='Process'; Text='修复产品 / 更新基线'; X=195.0; Y=1000.0; Width=240.0; Height=54.0; Font=14.0 },
        [pscustomobject]@{ Id='dev-redeliver'; Lane='dev'; Type='Process'; Text='重新交付测试'; X=195.0; Y=1110.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-handoff'; Lane='test'; Type='Process'; Text='接收测试交接包'; X=765.0; Y=530.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-coverage'; Lane='test'; Type='Process'; Text='建立覆盖矩阵'; X=765.0; Y=640.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-cases'; Lane='test'; Type='Process'; Text='设计测试用例'; X=765.0; Y=750.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-run'; Lane='test'; Type='Process'; Text='执行界面 / 接口测试'; X=765.0; Y=860.0; Width=240.0; Height=54.0; Font=14.0 },
        [pscustomobject]@{ Id='test-evidence'; Lane='test'; Type='Process'; Text='收集测试证据'; X=765.0; Y=970.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-decision'; Lane='test'; Type='Decision'; Text='覆盖达标？'; X=765.0; Y=1080.0; Width=180.0; Height=70.0; Font=16.0 },
        [pscustomobject]@{ Id='test-feedback'; Lane='test'; Type='Process'; Text='反馈开发'; X=765.0; Y=1190.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-pass'; Lane='test'; Type='Process'; Text='本轮回归通过'; X=765.0; Y=1300.0; Width=240.0; Height=54.0; Font=15.0 },
        [pscustomobject]@{ Id='test-next'; Lane='test'; Type='Note'; Text='等待下一版本 / 新需求'; X=645.0; Y=1360.0; Width=240.0; Height=44.0; Font=13.0 }
    )
    $annotations = @(
        [pscustomobject]@{ Id='annotation-dev-duty'; Type='Annotation'; Text='开发职责：理解实现 · 定义基线 · 交付交接 · 修复更新'; X=92.5; Y=1163.75; Width=445.0; Height=52.5; Font=7.0; SvgFont=13.0; TextColor='#37556F'; LineColor='#37556F'; FillColor='#FFFFFF'; Dashed=$true; Bold=$false },
        [pscustomobject]@{ Id='annotation-test-duty'; Type='Annotation'; Text='测试职责：独立设计 · 验证运行 · 保留证据 · 反馈结果'; X=662.5; Y=1420.0; Width=445.0; Height=40.0; Font=7.0; SvgFont=13.0; TextColor='#37694A'; LineColor='#37694A'; FillColor='#FFFFFF'; Dashed=$true; Bold=$false },
        [pscustomobject]@{ Id='annotation-principle'; Type='Annotation'; Text='原则：开发维护设计基线；测试依据基线独立验证，不擅自修改预期结果。'; X=87.5; Y=1470.0; Width=1025.0; Height=16.0; Font=6.4; SvgFont=12.0; TextColor='#414141'; LineColor='#414141'; FillColor='#FFFFFF'; Dashed=$true; Bold=$true }
    )
    $edges = @(
        [pscustomobject]@{ Id='edge-dev-source-whitebox'; Kind='Vertical'; From='dev-source'; To='dev-whitebox'; Points=@(@(315.0,254.0),@(315.0,310.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-dev-whitebox-baseline'; Kind='Vertical'; From='dev-whitebox'; To='dev-baseline'; Points=@(@(315.0,364.0),@(315.0,420.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-dev-baseline-handoff'; Kind='Vertical'; From='dev-baseline'; To='dev-handoff'; Points=@(@(315.0,474.0),@(315.0,530.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-dev-feedback-analyze'; Kind='Vertical'; From='dev-feedback'; To='dev-analyze'; Points=@(@(315.0,834.0),@(315.0,890.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-dev-analyze-fix'; Kind='Vertical'; From='dev-analyze'; To='dev-fix'; Points=@(@(315.0,944.0),@(315.0,1000.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-dev-fix-redeliver'; Kind='Vertical'; From='dev-fix'; To='dev-redeliver'; Points=@(@(315.0,1054.0),@(315.0,1110.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-handoff-test'; Kind='CrossLane'; From='dev-handoff'; To='test-handoff'; Points=@(@(435.0,557.0),@(610.0,557.0)); Color=$styles.Blue; Dashed=$false; Label='开发 → 测试：测试交接包' },
        [pscustomobject]@{ Id='edge-test-handoff-coverage'; Kind='Vertical'; From='test-handoff'; To='test-coverage'; Points=@(@(885.0,584.0),@(885.0,640.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-test-coverage-cases'; Kind='Vertical'; From='test-coverage'; To='test-cases'; Points=@(@(885.0,694.0),@(885.0,750.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-test-cases-run'; Kind='Vertical'; From='test-cases'; To='test-run'; Points=@(@(885.0,804.0),@(885.0,860.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-test-run-evidence'; Kind='Vertical'; From='test-run'; To='test-evidence'; Points=@(@(885.0,914.0),@(885.0,970.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-test-evidence-decision'; Kind='Vertical'; From='test-evidence'; To='test-decision'; Points=@(@(885.0,1024.0),@(885.0,1080.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-decision-feedback'; Kind='Vertical'; From='test-decision'; To='test-feedback'; Points=@(@(885.0,1150.0),@(885.0,1190.0)); Color=$styles.Blue; Dashed=$false; Label='是' },
        [pscustomobject]@{ Id='edge-feedback-pass'; Kind='Vertical'; From='test-feedback'; To='test-pass'; Points=@(@(885.0,1244.0),@(885.0,1300.0)); Color=$styles.Blue; Dashed=$false },
        [pscustomobject]@{ Id='edge-decision-rerun'; Kind='Feedback'; From='test-decision'; To='test-run'; Points=@(@(675.0,1115.0),@(625.0,1115.0),@(625.0,887.0),@(645.0,887.0)); Color=$styles.Feedback; Dashed=$true; Label='否：补充测试用例' },
        [pscustomobject]@{ Id='edge-test-feedback-dev'; Kind='Feedback'; From='test-feedback'; To='dev-feedback'; Points=@(@(645.0,1217.0),@(520.0,1217.0),@(520.0,807.0),@(435.0,807.0)); Color=$styles.Feedback; Dashed=$false; Label='测试 → 开发：反馈结果' },
        [pscustomobject]@{ Id='edge-version-loop'; Kind='VersionLoop'; From='test-pass'; To='dev-source'; Points=@(@(1005.0,1327.0),@(1080.0,1327.0),@(1080.0,227.0),@(435.0,227.0)); Color=$styles.Gray; Dashed=$true; Label='新版本 / 新需求 → 获取当前版本源码' }
    )
    return [pscustomobject]@{ Page=$page; Styles=$styles; Swimlanes=$swimlanes; Nodes=$nodes; Annotations=$annotations; Edges=$edges }
}

function Escape-SvgText {
    param([Parameter(Mandatory)][string]$Text)
    return $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

function New-PreviewSvg {
    $model = Get-CanonicalLayout
    $styles = $model.Styles
    $parts = [Collections.Generic.List[string]]::new()
    [void]$parts.Add(('<svg xmlns="http://www.w3.org/2000/svg" width="{0}" height="{1}" viewBox="0 0 {0} {1}">' -f $model.Page.SourceWidth, $model.Page.SourceHeight))
    [void]$parts.Add('<rect width="1200" height="1500" fill="#ffffff"/>')
    [void]$parts.Add("<style>text{font-family:Microsoft YaHei,SimSun,sans-serif;dominant-baseline:middle;text-anchor:middle}.title{font-size:30px;font-weight:700;fill:#1f3751}.subtitle{font-size:14px;fill:#5a5a5a}.lane{fill:$($styles.LaneFill);stroke:$($styles.Border);stroke-width:2}.header{fill:$($styles.HeaderFill);stroke:$($styles.Border);stroke-width:2}.node{fill:$($styles.OrangeFill);stroke:$($styles.OrangeLine);stroke-width:1.5}.decision{fill:$($styles.RedFill);stroke:$($styles.RedLine);stroke-width:1.5}.note{font-size:13px;fill:#37556f}.arrow{stroke:$($styles.Blue);stroke-width:3;fill:none;marker-end:url(#blueArrow)}.feedback{stroke:$($styles.Feedback);stroke-width:3;fill:none;marker-end:url(#redArrow)}.gray{stroke:$($styles.Gray);stroke-width:2;stroke-dasharray:8 6;fill:none;marker-end:url(#grayArrow)}.label{font-size:13px;font-weight:700;fill:#005896}.feedbackLabel{font-size:13px;font-weight:700;fill:#b43a19}</style>")
    [void]$parts.Add('<defs><marker id="blueArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#0070c0"/></marker><marker id="redArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#d25823"/></marker><marker id="grayArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#6e6e6e"/></marker></defs>')
    [void]$parts.Add('<text class="title" x="600" y="38">开发与测试闭环协作流程图</text>')
    [void]$parts.Add('<text class="subtitle" x="600" y="70">职责清晰、交付明确、反馈闭环、回归验证</text>')
    foreach ($lane in $model.Swimlanes) {
        [void]$parts.Add(('<rect class="lane" x="{0}" y="{1}" width="{2}" height="{3}"/><rect class="header" x="{0}" y="{1}" width="{2}" height="{4}"/><text x="{5}" y="{6}" font-size="22px" font-weight="700">{7}</text>' -f $lane.X, $lane.Y, $lane.Width, $lane.Height, $lane.HeaderHeight, ($lane.X + $lane.Width / 2), ($lane.Y + $lane.HeaderHeight / 2), (Escape-SvgText $lane.Text)))
    }
    $node = {
        param([double]$X, [double]$Y, [double]$W, [double]$H, [string]$Text, [string]$Class = 'node', [double]$Font = 16)
        $safe = Escape-SvgText $Text
        $textY = $Y + $H / 2
        $lines = $safe -split '\\n'
        if ($Class -eq 'decision' -and $lines.Count -eq 1) {
            $cx = $X + $W / 2
            $cy = $Y + $H / 2
            return ('<polygon class="decision" points="{0},{1} {2},{3} {0},{4} {5},{3}"/><text x="{0}" y="{3}" font-size="{6}px">{7}</text>' -f $cx, $Y, ($X + $W), $cy, ($Y + $H), $X, $Font, $safe)
        }
        if ($lines.Count -eq 1) { return ('<rect class="{0}" x="{1}" y="{2}" width="{3}" height="{4}" rx="2"/><text x="{5}" y="{6}" font-size="{7}px">{8}</text>' -f $Class, $X, $Y, $W, $H, ($X + $W / 2), $textY, $Font, $safe) }
        $line1 = $lines[0]; $line2 = $lines[1]
        return ('<rect class="{0}" x="{1}" y="{2}" width="{3}" height="{4}" rx="2"/><text x="{5}" y="{6}" font-size="{7}px">{8}</text><text x="{5}" y="{9}" font-size="{7}px">{10}</text>' -f $Class, $X, $Y, $W, $H, ($X + $W / 2), ($Y + $H / 2 - 10), $Font, $line1, ($Y + $H / 2 + 11), $line2)
    }
    foreach ($n in $model.Nodes) { $class = if($n.Type -eq 'Decision'){'decision'} elseif($n.Type -eq 'Note'){'note'}else{'node'}; [void]$parts.Add((&$node $n.X $n.Y $n.Width $n.Height $n.Text $class $n.Font)) }
    foreach ($edge in $model.Edges) {
        $sourcePoints = @($edge.Points)
        $pathPoints = @()
        for ($i = 0; $i -lt $sourcePoints.Count; $i++) {
            $point = @($sourcePoints[$i])
            $pathPoints += ('{0},{1}' -f $point[0], $point[1])
        }
        $pathData = 'M' + ($pathPoints -join ' L')
        $class = if($edge.Kind -eq 'Feedback'){'feedback'} elseif($edge.Kind -eq 'VersionLoop'){'gray'}else{'arrow'}
        if($edge.Dashed -and $class -eq 'feedback'){ $pathData = $pathData }
        [void]$parts.Add(('<path class="{0}" d="{1}"/>' -f $class, $pathData))
        $edgeLabel = $edge.PSObject.Properties['Label']
        if($null -ne $edgeLabel -and -not [string]::IsNullOrEmpty([string]$edgeLabel.Value)){
            switch($edge.Id){
                'edge-handoff-test' { [void]$parts.Add('<text class="label" x="520" y="510">开发 → 测试：测试交接包</text>') }
                'edge-test-feedback-dev' { [void]$parts.Add('<text class="feedbackLabel" x="470" y="790">测试 → 开发：反馈结果</text>') }
                'edge-decision-rerun' { [void]$parts.Add('<text class="feedbackLabel" x="632" y="1100">否：补充测试用例</text>') }
                'edge-decision-feedback' { [void]$parts.Add('<text class="label" x="1000" y="1120">是</text>') }
                'edge-version-loop' { [void]$parts.Add('<text x="600" y="1418" font-size="13px" fill="#6e6e6e">新版本 / 新需求 → 获取当前版本源码</text>') }
            }
        }
    }
    foreach ($annotation in $model.Annotations) {
        $centerX = $annotation.X + $annotation.Width / 2
        $centerY = $annotation.Y + $annotation.Height / 2
        $weight = if ($annotation.Bold) { '700' } else { '400' }
        [void]$parts.Add(('<text class="note" x="{0}" y="{1}" font-size="{2}px" font-weight="{3}" fill="{4}">{5}</text>' -f $centerX, $centerY, $annotation.SvgFont, $weight, $annotation.TextColor, (Escape-SvgText $annotation.Text)))
    }
    [void]$parts.Add('</svg>')
    return -join $parts
}

try {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
    $vsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.vsdx'
    $pdfPath = Join-Path $OutputDirectory '开发测试闭环流程图.pdf'
    $pngPath = Join-Path $OutputDirectory '开发测试闭环流程图.png'
    $tempVsdxPath = Join-Path $OutputDirectory '开发测试闭环流程图.__new.vsdx'
    $tempPdfPath = Join-Path $OutputDirectory '开发测试闭环流程图.__new.pdf'
    $tempPngPath = Join-Path $OutputDirectory '开发测试闭环流程图.__new.png'
    $tempRenderPath = Join-Path $OutputDirectory '开发测试闭环流程图.__render.vsd'
    $tempSvgPath = Join-Path $OutputDirectory '开发测试闭环流程图.__preview.svg'
    $debugLogPath = Join-Path $OutputDirectory '开发测试闭环流程图.__debug.log'
    if (Test-Path -LiteralPath $debugLogPath) { Remove-Item -LiteralPath $debugLogPath -Force }
    Write-DebugStep '开始生成'
    foreach ($path in @($tempVsdxPath, $tempPdfPath, $tempPngPath, $tempRenderPath, $tempSvgPath)) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    }
    $templatePath = Join-Path ${env:ProgramFiles} 'Microsoft Office\root\Office16\Visio Content\2052\BASFLO_M.VSTX'
    if (-not (Test-Path -LiteralPath $templatePath)) { throw "Visio 流程图模板不存在：$templatePath" }

    $visio = New-Object -ComObject Visio.InvisibleApp
    $visioVersion = $visio.Version
    $visioBuild = $visio.Build
    Write-DebugStep 'Visio.InvisibleApp 已创建'
    $visio.AlertResponse = 7
    $document = $visio.Documents.Add('')
    Write-DebugStep '已创建 Visio 空白绘图用于 PDF/PNG 渲染'
    $page = $document.Pages.Item(1)
    $page.Name = '开发测试闭环（参考格式）'
    $layout = Get-CanonicalLayout
    $pageSheet = $page.PageSheet
    Set-CellFormula $pageSheet 'PageWidth' "$($layout.Page.VisioWidthIn) in"
    Set-CellFormula $pageSheet 'PageHeight' "$($layout.Page.VisioHeightIn) in"
    Set-CellFormula $pageSheet 'PageLeftMargin' "$($layout.Page.MarginLeftIn) in"
    Set-CellFormula $pageSheet 'PageRightMargin' "$($layout.Page.MarginRightIn) in"
    Set-CellFormula $pageSheet 'PageTopMargin' "$($layout.Page.MarginTopIn) in"
    Set-CellFormula $pageSheet 'PageBottomMargin' "$($layout.Page.MarginBottomIn) in"
    Set-CellFormula $pageSheet 'PageScale' '1 in'
    Set-CellFormula $pageSheet 'DrawingScale' '1 in'

    $stencil = $true
    Write-DebugStep '使用 Visio 内置可编辑图形绘制'

    $backgroundRect = Convert-CanonicalRectToVisio $layout 0 0 $layout.Page.SourceWidth $layout.Page.SourceHeight
    $background = New-Shape $page $stencil 'Rectangle' $backgroundRect.PinX $backgroundRect.PinY $backgroundRect.Width $backgroundRect.Height '' 'RGB(255,255,255)' 'RGB(255,255,255)' 8
    Set-CellFormula $background 'LinePattern' '0'
    $background.SendToBack()
    New-Text $page 12 29.25 20.5 0.55 '开发与测试闭环协作流程图' 16 'RGB(31,55,81)' $true | Out-Null
    New-Text $page 12 28.6 20.5 0.35 '职责清晰、交付明确、反馈闭环、回归验证' 8 'RGB(90,90,90)' | Out-Null
    foreach ($lane in $layout.Swimlanes) {
        $laneRect = Convert-CanonicalRectToVisio $layout $lane.X $lane.Y $lane.Width $lane.Height
        New-Shape $page $stencil 'Rectangle' $laneRect.PinX $laneRect.PinY $laneRect.Width $laneRect.Height '' 'RGB(250,250,250)' 'RGB(38,93,145)' 8 | Out-Null
        $headerRect = Convert-CanonicalRectToVisio $layout $lane.X $lane.Y $lane.Width $lane.HeaderHeight
        New-Shape $page $stencil 'Rectangle' $headerRect.PinX $headerRect.PinY $headerRect.Width $headerRect.Height $lane.Text 'RGB(237,233,244)' 'RGB(38,93,145)' 11 'RGB(35,35,35)' $true | Out-Null
    }
    foreach ($edge in $layout.Edges) {
        Write-DebugStep "开始绘制连线：$($edge.Id)，点数=$($edge.Points.Count)"
        $points = @(Convert-CanonicalEdgePointsToVisio $layout $edge)
        $flatValues = New-Object 'System.Collections.Generic.List[double]'
        foreach ($point in $points) { [void]$flatValues.Add([double]$point.X); [void]$flatValues.Add([double]$point.Y) }
        $flat = $flatValues.ToArray()
        if ($edge.Points.Count -eq 2) { New-Arrow $page $flat[0] $flat[1] $flat[2] $flat[3] $(if($edge.Kind -eq 'Feedback'){'RGB(210,88,35)'}elseif($edge.Kind -eq 'VersionLoop'){'RGB(110,110,110)'}else{'RGB(0,112,192)'}) 1.2 $edge.Dashed | Out-Null }
        else { New-PolylineArrow $page $flat $(if($edge.Kind -eq 'Feedback'){'RGB(210,88,35)'}else{'RGB(110,110,110)'}) 1.2 $edge.Dashed | Out-Null }
        Write-DebugStep "完成绘制连线：$($edge.Id)"
    }
    foreach ($node in $layout.Nodes) {
        $rect = Convert-CanonicalRectToVisio $layout $node.X $node.Y $node.Width $node.Height
        if ($node.Type -eq 'Note') { New-Shape $page $stencil 'Rectangle' $rect.PinX $rect.PinY $rect.Width $rect.Height $node.Text 'RGB(235,235,235)' 'RGB(110,110,110)' $node.Font 'RGB(70,70,70)' $false $true | Out-Null }
        elseif ($node.Type -eq 'Decision') { New-Shape $page $stencil 'Diamond' $rect.PinX $rect.PinY $rect.Width $rect.Height $node.Text 'RGB(238,35,35)' 'RGB(140,0,0)' $node.Font 'RGB(0,0,0)' $true | Out-Null }
        else { New-Shape $page $stencil 'Rectangle' $rect.PinX $rect.PinY $rect.Width $rect.Height $node.Text 'RGB(248,166,82)' 'RGB(200,120,45)' $node.Font | Out-Null }
    }
    New-Text $page 10.4 1.64 5.0 0.42 '开发 → 测试：测试交接包' 7.2 'RGB(0,88,150)' $true | Out-Null
    New-Text $page 9.4 14.2 4.8 0.42 '测试 → 开发：反馈结果' 7.2 'RGB(180,58,25)' $true | Out-Null
    New-Text $page 12.64 7.8 2.8 0.45 '否：补充测试用例' 6.8 'RGB(170,80,25)' $false $true | Out-Null
    New-Text $page 20.0 7.6 1.2 0.38 '是' 6.8 'RGB(0,88,150)' $true | Out-Null
    New-Text $page 12.0 1.64 7.3 0.42 '新版本 / 新需求 → 获取当前版本源码' 6.8 'RGB(110,110,110)' | Out-Null
    foreach ($annotation in $layout.Annotations) {
        $annotationRect = Convert-CanonicalRectToVisio $layout $annotation.X $annotation.Y $annotation.Width $annotation.Height
        $annotationColor = 'RGB(65,65,65)'
        if ($annotation.Id -eq 'annotation-dev-duty') { $annotationColor = 'RGB(55,85,115)' }
        elseif ($annotation.Id -eq 'annotation-test-duty') { $annotationColor = 'RGB(55,105,70)' }
        New-Text $page $annotationRect.PinX $annotationRect.PinY $annotationRect.Width $annotationRect.Height $annotation.Text $annotation.Font $annotationColor $annotation.Bold $annotation.Dashed | Out-Null
    }

    $pageXml = New-VsdxPageXml $layout $VSDX_EXPORT_MODE
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $baseArchive = [IO.Compression.ZipFile]::OpenRead($templatePath)
    try {
        $basePagesXml = Read-ZipEntryText $baseArchive 'visio/pages/pages.xml'
        $baseWindowsXml = Read-ZipEntryText $baseArchive 'visio/windows.xml'
    }
    finally { $baseArchive.Dispose() }
    $pagesXml = Update-VsdxPagesXml $basePagesXml '开发测试闭环（参考格式）' $layout
    $windowsXml = Update-VsdxWindowsXml $baseWindowsXml
    Write-DebugStep '图形已绘制，已生成 VSDX 页面 XML'
    $document.ExportAsFixedFormat(1, $tempPdfPath, 0, 0, 0, 0, 0, 0)
    Write-DebugStep 'PDF 临时文件已导出'
    [IO.File]::WriteAllText($tempSvgPath, (New-PreviewSvg), (New-Object Text.UTF8Encoding($false)))
    $edgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if (-not (Test-Path -LiteralPath $edgePath)) { throw "Edge 渲染器不存在：$edgePath" }
    $svgUri = ([Uri]$tempSvgPath).AbsoluteUri
    $edgeArgs = @('--headless', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,1500', "--screenshot=$tempPngPath", $svgUri)
    $edgeProcess = Start-Process -FilePath $edgePath -ArgumentList $edgeArgs -PassThru -Wait -WindowStyle Hidden
    if ($edgeProcess.ExitCode -ne 0) { throw "Edge SVG 转 PNG 失败：ExitCode=$($edgeProcess.ExitCode)" }
    Write-DebugStep 'SVG 预览已由 Edge 渲染为 PNG'
    $document.SaveAs($tempRenderPath)
    Write-DebugStep 'Visio 渲染源已保存'
    $document.Close()
    Release-ComObject $document
    $document = $null
    Write-DebugStep '生成文档已关闭，开始写入 VSDX ZIP/XML 包'
    Convert-VstxToVsdx $templatePath $tempVsdxPath @{ 'visio/pages/page1.xml' = $pageXml; 'visio/pages/pages.xml' = $pagesXml; 'visio/windows.xml' = $windowsXml }
    Write-DebugStep '已从合法 VSTX 模板创建原生 VSDX 包'

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($tempVsdxPath)
    try {
        $pageXml = Read-ZipEntryText $archive 'visio/pages/page1.xml'
        $documentXml = Read-ZipEntryText $archive 'visio/document.xml'
        $windowsXml = Read-ZipEntryText $archive 'visio/windows.xml'
    }
    finally { $archive.Dispose() }
    $shapeCount = ([regex]::Matches($pageXml, '<Shape\b')).Count
    $allText = $pageXml + "`n" + $documentXml
    $required = @('开发', '测试', '白盒分析实现', '开发 Skill 生成', '测试交接包', '接收测试交接包', '建立覆盖矩阵', '设计测试用例', '执行界面 / 接口测试', '收集测试证据', '覆盖达标', '反馈开发', '本轮回归通过')
    $missing = @($required | Where-Object { $allText -notlike "*$_*" })
    if ($missing.Count -gt 0) { throw ('关键 Shape 文本缺失：' + ($missing -join ', ')) }
    if ($shapeCount -ne 24) { throw "SKELETON Shape 数量异常：$shapeCount，预期 24" }
    if ($pageXml -match '<Connects\b|OneD="1"|NameU="Background"') { throw 'SKELETON VSDX 不得包含 Connector、OneD 或 Background Shape。' }
    if ($windowsXml -match '<ShowPageBreaks>1</ShowPageBreaks>|<ShowGuides>1</ShowGuides>|<ShowConnectionPoints>1</ShowConnectionPoints>|<ShowGrid>1</ShowGrid>') { throw 'SKELETON VSDX 不得启用分页线、参考线、连接点或网格视图。' }
    Write-DebugStep "临时 VSDX 结构校验通过，Shape=$shapeCount"
    if (-not (Test-Path -LiteralPath $tempVsdxPath) -or (Get-Item -LiteralPath $tempVsdxPath).Length -le 0) { throw 'VSDX 临时文件无效。' }
    if (-not (Test-Path -LiteralPath $tempPdfPath) -or (Get-Item -LiteralPath $tempPdfPath).Length -le 0) { throw 'PDF 临时文件无效。' }
    if (-not (Test-Path -LiteralPath $tempPngPath) -or (Get-Item -LiteralPath $tempPngPath).Length -le 0) { throw 'PNG 临时文件无效。' }

    foreach ($pair in @(
        @($tempVsdxPath, $vsdxPath),
        @($tempPdfPath, $pdfPath),
        @($tempPngPath, $pngPath)
    )) {
        if (Test-Path -LiteralPath $pair[1]) { Remove-Item -LiteralPath $pair[1] -Force }
        Move-Item -LiteralPath $pair[0] -Destination $pair[1] -Force
    }
    Write-DebugStep '临时文件已替换为正式输出'

    $archive = [IO.Compression.ZipFile]::OpenRead($vsdxPath)
    try { $finalPageXml = Read-ZipEntryText $archive 'visio/pages/page1.xml' }
    finally { $archive.Dispose() }
    $finalShapeCount = ([regex]::Matches($finalPageXml, '<Shape\b')).Count
    if ($finalShapeCount -ne 24) { throw "最终 SKELETON VSDX Shape 数量异常：$finalShapeCount" }

    Write-Output 'VISIO_AUTOMATION=AVAILABLE'
    Write-Output "VISIO_VERSION=$visioVersion BUILD=$visioBuild"
    Write-Output "VSDX_PATH=$vsdxPath"
    Write-Output "VSDX_SIZE=$((Get-Item -LiteralPath $vsdxPath).Length)"
    Write-Output "PDF_PATH=$pdfPath"
    Write-Output "PNG_PATH=$pngPath"
    Write-Output "VSDX_EXPORT_MODE=$VSDX_EXPORT_MODE"
    Write-Output 'PAGE_COUNT=1'
    Write-Output "SHAPE_COUNT=$finalShapeCount"
    Write-Output 'VSDX_CONNECTORS=SKIPPED'
    Write-Output 'VSDX_GUIDES=SKIPPED'
    Write-Output 'VSDX_HELPER_SHAPES=SKIPPED'
    Write-Output 'SWIMLANES=开发、测试'
    Write-Output 'VSDX_REOPEN=STRUCTURE_PASS_HEADLESS_VISIO_REOPEN_NOT_RUN'
    Write-Output 'VSDX_NATIVE_EDITABLE_SHAPES=PASS'
}
catch {
    try { Write-DebugStep ('失败：' + $_.Exception.ToString()) } catch { }
    Write-Error $_
    exit 1
}
finally {
    if ($verifyDocument) { try { $verifyDocument.Close() } catch { } }
    if ($document) { try { $document.Close() } catch { } }
    if ($stencil) { try { $stencil.Close() } catch { } }
    if ($visio) { try { $visio.Quit() } catch { } }
    if ($verifyVisio) { try { $verifyVisio.Quit() } catch { } }
    Release-ComObject $verifyDocument
    Release-ComObject $document
    Release-ComObject $stencil
    Release-ComObject $visio
    Release-ComObject $verifyVisio
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
