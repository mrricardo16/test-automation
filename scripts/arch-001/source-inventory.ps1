[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $BackendRoot,
    [Parameter(Mandatory = $true)] [string] $FrontendRoot,
    [Parameter(Mandatory = $true)] [string] $OutputPath
)

$ErrorActionPreference = 'Stop'
$ExcludedDirectoryNames = @('bin', 'obj', 'node_modules', 'dist', 'coverage', '.vs', '.idea', '.vscode', 'cache', 'tmp', 'temp', 'Build')
$TextExtensions = @('.cs', '.csproj', '.sln', '.json', '.ts', '.tsx', '.js', '.jsx', '.vue', '.scss', '.css', '.html', '.md')

function Get-FilteredFiles {
    param([string] $Root)
    Get-ChildItem -LiteralPath $Root -Recurse -File -Force |
        Where-Object {
            $relative = $_.FullName.Substring($Root.Length + 1)
            $parts = $relative -split '\\'
            $_.Extension.ToLowerInvariant() -in $TextExtensions -and
                -not ($parts | Where-Object { $ExcludedDirectoryNames -contains $_ })
        } |
        Sort-Object FullName
}

function Get-RelativePath {
    param([string] $Root, [string] $Path)
    $Path.Substring($Root.Length + 1).Replace('\', '/')
}

function Read-SourceText {
    param([string] $Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $strict = [System.Text.UTF8Encoding]::new($false, $true)
    try {
        [pscustomobject]@{ Text = $strict.GetString($bytes); Utf8 = $true }
    } catch {
        [pscustomobject]@{ Text = [System.Text.Encoding]::Default.GetString($bytes); Utf8 = $false }
    }
}

function Get-FirstRegexValue {
    param([string] $Text, [string] $Pattern)
    $m = [regex]::Match($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    if ($m.Success) { return $m.Groups[1].Value }
    return $null
}

function Get-ProjectInventory {
    param([string] $Root, [System.IO.FileInfo[]] $Files)
    $projects = [System.Collections.Generic.List[object]]::new()
    foreach ($file in @($Files | Where-Object { $_.Extension -eq '.csproj' })) {
        $raw = Read-SourceText -Path $file.FullName
        $text = $raw.Text
        $packages = @([regex]::Matches($text, '<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?', 'IgnoreCase') | ForEach-Object {
            [ordered]@{ name = $_.Groups[1].Value; version = $_.Groups[2].Value }
        })
        $references = @([regex]::Matches($text, '<ProjectReference\s+Include="([^"]+)"', 'IgnoreCase') | ForEach-Object {
            $_.Groups[1].Value.Replace('\', '/')
        })
        $targets = @([regex]::Matches($text, '<TargetFrameworks?>\s*([^<]+)\s*</TargetFrameworks?>', 'IgnoreCase') | ForEach-Object { $_.Groups[1].Value.Trim() })
        $projects.Add([ordered]@{
            name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            file = Get-RelativePath $Root $file.FullName
            targetFramework = $targets
            packageReferences = $packages
            projectReferences = $references
        })
    }
    return @($projects)
}

function Get-ControllerAndEndpointInventory {
    param([string] $Root, [System.IO.FileInfo[]] $Files)
    $controllers = [System.Collections.Generic.List[object]]::new()
    $endpoints = [System.Collections.Generic.List[object]]::new()
    $routeFiles = @($Files | Where-Object { $_.Extension -eq '.cs' -and ($_.FullName -match '\\Areas\\|\\Controller\\|WebAPI|WebBaseController') })
    foreach ($file in $routeFiles) {
        $raw = Read-SourceText -Path $file.FullName
        $text = $raw.Text
        $classMatch = [regex]::Match($text, '\b(?:public|internal|private|protected)?\s*(?:partial\s+)?class\s+(\w+)\s*:\s*([^\r\n{]+)', 'IgnoreCase')
        $className = if ($classMatch.Success) { $classMatch.Groups[1].Value } else { [System.IO.Path]::GetFileNameWithoutExtension($file.Name) }
        $baseType = if ($classMatch.Success) { $classMatch.Groups[2].Value.Trim() } else { '' }
        $isController = $className -match 'Controller$' -or $baseType -match 'WebApiController'
        if (-not $isController) { continue }
        $relative = Get-RelativePath $Root $file.FullName
        $area = if ($relative -match '^HZ\.RSSComposer/Areas/([^/]+)/') { $Matches[1] } elseif ($relative -match '^HZ\.RSSComposer/Controller/') { 'External/Controller' } else { 'Infrastructure' }
        $requiresToken = $text -match '\[\s*RequiresToken\s*\]'
        $serviceRefs = @([regex]::Matches($text, 'ServiceLocator\.GetService\s*<\s*([A-Za-z0-9_]+)\s*>', 'IgnoreCase') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
        $controller = [ordered]@{ name = $className; file = $relative; area = $area; baseType = $baseType; requiresToken = $requiresToken; serviceReferences = $serviceRefs }
        $controllers.Add($controller)

        $lines = $text -split "`r?`n"
        $pending = $null
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            $routeMatch = [regex]::Match($line, '(?:EmbedIO\.Routing\.)?Route\s*\(\s*HttpVerbs\.(\w+)\s*,\s*"([^"]+)"', 'IgnoreCase')
            if ($routeMatch.Success) {
                $pending = [ordered]@{ method = $routeMatch.Groups[1].Value.ToUpperInvariant(); route = $routeMatch.Groups[2].Value; line = $i + 1 }
                continue
            }
            if ($null -ne $pending -and (($i + 1) - $pending.line) -le 12) {
                $methodMatch = [regex]::Match($line, '\b(?:public|internal|private|protected)\s+(?:static\s+)?(?:async\s+)?[A-Za-z0-9_<>,.?\[\]]+\s+(\w+)\s*\(', 'IgnoreCase')
                if ($methodMatch.Success) {
                    $methodName = $methodMatch.Groups[1].Value
                    $endpointId = ('API-' + (($pending.route -replace '[^A-Za-z0-9]+', '-').Trim('-') -replace '-+', '-')).ToUpperInvariant()
                    $endpoints.Add([ordered]@{
                        id = $endpointId
                        controller = $className
                        area = $area
                        method = $pending.method
                        route = $pending.route
                        methodName = $methodName
                        file = $relative
                        line = $pending.line
                        requiresToken = $requiresToken
                        serviceReferences = $serviceRefs
                        confidence = 'CONFIRMED_FROM_CODE'
                    })
                    $pending = $null
                }
            }
        }
    }
    [pscustomobject]@{ Controllers = @($controllers); Endpoints = @($endpoints) }
}

function Get-FrontendApiInventory {
    param([string] $Root, [System.IO.FileInfo[]] $Files)
    $apis = [System.Collections.Generic.List[object]]::new()
    $apiFiles = @($Files | Where-Object { $_.FullName -match '\\src\\(?:api|modules\\draw\\api)\\' -and $_.Extension -in @('.ts', '.js', '.tsx', '.jsx') })
    foreach ($file in $apiFiles) {
        $raw = Read-SourceText -Path $file.FullName
        $text = $raw.Text
        $constants = @{}
        foreach ($m in [regex]::Matches($text, 'const\s+(\w+BASE_URL)\s*=\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', 'IgnoreCase')) { $constants[$m.Groups[1].Value] = $m.Groups[2].Value }
        $lines = $text -split "`r?`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i].TrimStart().StartsWith('//')) { continue }
            if ($lines[$i] -notmatch '\burl\s*:') { continue }
            $urlMatch = [regex]::Match($lines[$i], 'url\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]|url\s*:\s*`([^`]+)`', 'IgnoreCase')
            if (-not $urlMatch.Success) { continue }
            $url = if ($urlMatch.Groups[1].Success) { $urlMatch.Groups[1].Value } else { $urlMatch.Groups[2].Value }
            foreach ($key in $constants.Keys) { $url = $url.Replace('${' + $key + '}', $constants[$key]) }
            $method = ''
            for ($j = $i; $j -lt [Math]::Min($i + 5, $lines.Count); $j++) {
                $methodMatch = [regex]::Match($lines[$j], 'method\s*:\s*[\x22\x27](\w+)[\x22\x27]', 'IgnoreCase')
                if ($methodMatch.Success) { $method = $methodMatch.Groups[1].Value.ToUpperInvariant(); break }
            }
            $functionName = ''
            for ($j = $i; $j -ge [Math]::Max(0, $i - 18); $j--) {
                $functionMatch = [regex]::Match($lines[$j], '^\s*(?:export\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{?', 'IgnoreCase')
                if ($functionMatch.Success -and $functionMatch.Groups[1].Value -notin @('if', 'for', 'while', 'switch')) { $functionName = $functionMatch.Groups[1].Value; break }
            }
            if (-not $functionName) {
                for ($j = $i; $j -ge [Math]::Max(0, $i - 18); $j--) {
                    $propertyMatch = [regex]::Match($lines[$j], '^\s*(\w+)\s*\([^)]*\)\s*\{?', 'IgnoreCase')
                    if ($propertyMatch.Success) { $functionName = $propertyMatch.Groups[1].Value; break }
                }
            }
            $relative = Get-RelativePath $Root $file.FullName
            $apiIdSeed = (($functionName + '-' + $relative + '-' + $url) -replace '[^A-Za-z0-9]+', '-').Trim('-') -replace '-+', '-'
            $apis.Add([ordered]@{
                id = ('FE-' + $apiIdSeed).ToUpperInvariant()
                function = if ($functionName) { $functionName } else { 'UNKNOWN_FUNCTION' }
                method = if ($method) { $method } else { 'UNKNOWN_METHOD' }
                url = $url
                file = $relative
                line = $i + 1
                confidence = 'CONFIRMED_FROM_CODE'
            })
        }
    }
    return @($apis)
}

function Get-FrontendRouteInventory {
    param([string] $Root, [System.IO.FileInfo[]] $Files)
    $routes = [System.Collections.Generic.List[object]]::new()
    $routeFiles = @($Files | Where-Object { $_.FullName -match '\\src\\router\\' -and $_.Extension -in @('.ts', '.js') })
    foreach ($file in $routeFiles) {
        $lines = (Read-SourceText -Path $file.FullName).Text -split "`r?`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $pathMatch = [regex]::Match($lines[$i], '^\s*path\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', 'IgnoreCase')
            if (-not $pathMatch.Success) { continue }
            $path = $pathMatch.Groups[1].Value
            $component = ''
            $name = ''
            $hidden = ''
            for ($j = $i; $j -lt [Math]::Min($i + 18, $lines.Count); $j++) {
                $componentMatch = [regex]::Match($lines[$j], 'import\s*\(\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]\s*\)', 'IgnoreCase')
                if ($componentMatch.Success -and -not $component) { $component = $componentMatch.Groups[1].Value }
                $nameMatch = [regex]::Match($lines[$j], '^\s*name\s*:\s*[\x22\x27]([^\x22\x27]+)[\x22\x27]', 'IgnoreCase')
                if ($nameMatch.Success) { $name = $nameMatch.Groups[1].Value }
                if ($lines[$j] -match 'hidden\s*:\s*true') { $hidden = 'true' }
                if ($j -gt $i -and $lines[$j] -match '^\s*},?\s*$') { break }
            }
            $relative = Get-RelativePath $Root $file.FullName
            $routes.Add([ordered]@{
                id = ('ROUTE-' + (($path -replace '[^A-Za-z0-9]+', '-').Trim('-') -replace '-+', '-')).ToUpperInvariant()
                path = $path
                name = $name
                component = $component
                hidden = if ($hidden) { $true } else { $false }
                source = $relative
                line = $i + 1
                kind = 'STATIC'
                confidence = 'CONFIRMED_FROM_CODE'
            })
        }
    }
    $permission = @($Files | Where-Object { $_.Name -eq 'permission.ts' -and $_.FullName -match '\\src\\plugins\\' })
    foreach ($file in $permission) {
        $relative = Get-RelativePath $Root $file.FullName
        $routes.Add([ordered]@{ id = 'ROUTE-DYNAMIC-MENU'; path = 'BACKEND_MENU_DEFINED'; name = 'dynamic menu routes'; component = 'resolveViewComponent'; hidden = $false; source = $relative; line = 18; kind = 'DYNAMIC'; confidence = 'CONFIRMED_FROM_CODE' })
    }
    return @($routes.ToArray())
}

function Get-FrontendFeatureInventory {
    param([string] $Root, [System.IO.FileInfo[]] $Files)
    $viewsRoot = Join-Path $Root 'src\views'
    $items = [System.Collections.Generic.List[object]]::new()
    if (Test-Path -LiteralPath $viewsRoot) {
        foreach ($dir in @(Get-ChildItem -LiteralPath $viewsRoot -Directory -Force | Sort-Object Name)) {
            $items.Add([ordered]@{ id = ('MOD-' + ($dir.Name -replace '[^A-Za-z0-9]+', '-').ToUpperInvariant()); name = $dir.Name; source = ('src/views/' + $dir.Name); fileCount = @(Get-ChildItem -LiteralPath $dir.FullName -Recurse -File -Force | Where-Object { $_.Extension -in @('.vue','.ts','.js') }).Count; confidence = 'CONFIRMED_FROM_CODE' })
        }
    }
    return @($items)
}

function Get-FrontendPackage {
    param([string] $Root)
    $path = Join-Path $Root 'package.json'
    $json = Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json
    $deps = [ordered]@{}
    foreach ($property in @('dependencies', 'devDependencies')) {
        if ($null -ne $json.$property) {
            foreach ($item in $json.$property.PSObject.Properties) { $deps[$item.Name] = $item.Value }
        }
    }
    [ordered]@{ name = $json.name; version = $json.version; type = $json.type; scripts = $json.scripts; dependencies = $deps }
}

$backendFiles = @(Get-FilteredFiles -Root $BackendRoot)
$frontendFiles = @(Get-FilteredFiles -Root $FrontendRoot)
$backendRouteData = Get-ControllerAndEndpointInventory -Root $BackendRoot -Files $backendFiles
$frontendApis = @(Get-FrontendApiInventory -Root $FrontendRoot -Files $frontendFiles)
$frontendRoutes = @(Get-FrontendRouteInventory -Root $FrontendRoot -Files $frontendFiles)
$frontendFeatures = @(Get-FrontendFeatureInventory -Root $FrontendRoot -Files $frontendFiles)
$projects = @(Get-ProjectInventory -Root $BackendRoot -Files $backendFiles)
$backendServices = @($backendFiles | Where-Object { $_.Extension -eq '.cs' -and $_.Name -match 'Service\.cs$' -and $_.FullName -notmatch '\\IService\\' } | ForEach-Object {
    $text = (Read-SourceText -Path $_.FullName).Text
    $class = Get-FirstRegexValue -Text $text -Pattern '\bclass\s+(\w+Service)\b'
    [ordered]@{ name = if ($class) { $class } else { $_.BaseName }; file = Get-RelativePath $BackendRoot $_.FullName; confidence = 'CONFIRMED_FROM_CODE' }
})
$backendModels = @($backendFiles | Where-Object { $_.Extension -eq '.cs' -and $_.FullName -match '\\HZ\.Model\\' -and $_.Name -match '\.cs$' } | ForEach-Object {
    [ordered]@{ name = $_.BaseName; file = Get-RelativePath $BackendRoot $_.FullName; kind = if ($_.FullName -match '\\Entity\\') { 'Entity' } elseif ($_.FullName -match '\\View\\') { 'View/DTO' } else { 'Model' }; confidence = 'CONFIRMED_FROM_CODE' }
})
$allSourceFiles = @($backendFiles) + @($frontendFiles)
$sensitiveFiles = @()
foreach ($sourceFile in $allSourceFiles) {
    $isSensitiveName = $sourceFile.Name -match 'appsettings|config|\.env|secret|credential|password'
    $isFrontendConfig = $sourceFile.FullName -match '\\public\\config\.js$'
    if ($isSensitiveName -or $isFrontendConfig) {
        $sourceRelative = if ($sourceFile.FullName.StartsWith($BackendRoot)) { Get-RelativePath $BackendRoot $sourceFile.FullName } else { Get-RelativePath $FrontendRoot $sourceFile.FullName }
        $sensitiveFiles += [ordered]@{ source = $sourceRelative; note = 'Sensitive configuration may exist; values are intentionally omitted.' }
    }
}

$normalizedBackend = @{}
foreach ($endpoint in $backendRouteData.Endpoints) { $endpointKey = $endpoint.method + ' ' + $endpoint.route.ToLowerInvariant(); $normalizedBackend[$endpointKey] = $endpoint }
$mappings = [System.Collections.Generic.List[object]]::new()
foreach ($api in $frontendApis) {
    $key = $api.method + ' ' + $api.url.ToLowerInvariant()
    $match = $null
    if ($normalizedBackend.ContainsKey($key)) { $match = $normalizedBackend[$key] }
    if (-not $match) {
        $apiPath = ($api.url -replace '^\$?\{?\w+BASE_URL\}?', '')
        $match = @($backendRouteData.Endpoints | Where-Object { $_.method -eq $api.method -and $_.route.ToLowerInvariant() -eq $apiPath.ToLowerInvariant() }) | Select-Object -First 1
    }
    $mappings.Add([ordered]@{
        frontendApiId = $api.id
        frontendFunction = $api.function
        frontendMethod = $api.method
        frontendUrl = $api.url
        backendApiId = if ($match) { $match.id } else { $null }
        backendController = if ($match) { $match.controller } else { $null }
        backendRoute = if ($match) { $match.route } else { $null }
        match = if ($match) { 'CONFIRMED' } else { 'UNMATCHED' }
        confidence = if ($match) { 'CONFIRMED_FROM_CODE' } else { 'UNKNOWN' }
    })
}
$backendMatchedKeys = @($mappings | Where-Object { $_.backendApiId } | ForEach-Object { $_.backendApiId } | Sort-Object -Unique)
$backendUnmatched = @($backendRouteData.Endpoints | Where-Object { $backendMatchedKeys -notcontains $_.id })

$result = [ordered]@{
    schema = 'ARCH-001/1'
    generatedAt = [DateTimeOffset]::Now.ToString('o')
    scope = [ordered]@{ backendRoot = $BackendRoot; frontendRoot = $FrontendRoot; exclusions = $ExcludedDirectoryNames; runtimeExecuted = $false; databaseAccessed = $false }
    backend = [ordered]@{
        solutions = @($backendFiles | Where-Object { $_.Extension -eq '.sln' } | ForEach-Object { [ordered]@{ name = $_.Name; file = Get-RelativePath $BackendRoot $_.FullName } })
        projects = $projects
        controllers = $backendRouteData.Controllers
        endpoints = $backendRouteData.Endpoints
        services = $backendServices
        models = $backendModels
        signals = [ordered]@{ framework = 'EmbedIO WebApi + Avalonia desktop host'; targetFrameworks = 'Extracted from project files'; orm = 'SqlSugarCore'; databaseProviderPackage = 'MySqlConnector'; di = 'Autofac + ServiceLocator'; cache = 'StackExchange.Redis / HZ.Redis'; realtime = 'MQTTnet and WebSocket code paths'; logging = 'Diagnosis / custom logging references'; serialization = 'Newtonsoft.Json' }
    }
    frontend = [ordered]@{
        package = Get-FrontendPackage -Root $FrontendRoot
        routes = $frontendRoutes
        features = $frontendFeatures
        apiFunctions = $frontendApis
        signals = [ordered]@{ framework = 'Vue'; frameworkVersion = '^3.5.13'; build = 'Vite ^6.3.2'; router = 'vue-router ^4.5.0'; state = 'Pinia ^2.3.1 and vuex ^4.1.0 declared'; http = 'axios ^0.24.0'; ui = 'Element Plus ^2.9.3'; visualization = 'ECharts; Three.js; LogicFlow; STOMP/MQTT/WebSocket code paths' }
    }
    mappings = @($mappings)
    backendUnmatched = $backendUnmatched
    sensitiveFiles = $sensitiveFiles
}

$parent = Split-Path -Parent $OutputPath
if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
$json = $result | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($OutputPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
$json
