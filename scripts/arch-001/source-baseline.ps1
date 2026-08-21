[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $BackendRoot,
    [Parameter(Mandatory = $true)] [string] $FrontendRoot,
    [Parameter(Mandatory = $false)] [string] $OutputPath
)

$ErrorActionPreference = 'Stop'
$ExcludedDirectoryNames = @('bin', 'obj', 'node_modules', 'dist', 'coverage', '.vs', '.idea', '.vscode', 'cache', 'tmp', 'temp', 'Build')

function Get-SourceFiles {
    param([string] $Root)

    Get-ChildItem -LiteralPath $Root -Recurse -File -Force |
        Where-Object {
            $relative = $_.FullName.Substring($Root.Length + 1)
            $parts = $relative -split '\\'
            -not ($parts | Where-Object { $ExcludedDirectoryNames -contains $_ })
        } |
        Sort-Object FullName
}

function Get-TreeBaseline {
    param([string] $Root)

    $files = @(Get-SourceFiles -Root $Root)
    $lines = [System.Collections.Generic.List[string]]::new()
    $sha = [System.Security.Cryptography.SHA256]::Create()
    foreach ($file in $files) {
        $fileHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $relative = $file.FullName.Substring($Root.Length + 1).Replace('\', '/')
        $null = $lines.Add("$relative|$fileHash")
    }

    $payload = [System.Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
    $treeHash = ([BitConverter]::ToString($sha.ComputeHash($payload))).Replace('-', '').ToLowerInvariant()
    $sha.Dispose()
    [pscustomobject]@{
        Root = $Root
        FileCount = $files.Count
        TreeHash = $treeHash
        Exclusions = $ExcludedDirectoryNames
    }
}

$result = [ordered]@{
    generatedAt = [DateTimeOffset]::Now.ToString('o')
    exclusionDirectories = $ExcludedDirectoryNames
    backend = Get-TreeBaseline -Root $BackendRoot
    frontend = Get-TreeBaseline -Root $FrontendRoot
}

$json = $result | ConvertTo-Json -Depth 8
if ($OutputPath) {
    $parent = Split-Path -Parent $OutputPath
    if ($parent) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    [System.IO.File]::WriteAllText($OutputPath, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}
$json
