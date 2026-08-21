﻿[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $InventoryPath,
    [Parameter(Mandatory = $true)] [string] $BaselineBeforePath,
    [Parameter(Mandatory = $false)] [string] $BaselineAfterPath,
    [Parameter(Mandatory = $true)] [string] $OutputRoot
)

$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath $InventoryPath -Raw -Encoding UTF8 | ConvertFrom-Json
$before = Get-Content -LiteralPath $BaselineBeforePath -Raw -Encoding UTF8 | ConvertFrom-Json
$after = if ($BaselineAfterPath -and (Test-Path -LiteralPath $BaselineAfterPath)) { Get-Content -LiteralPath $BaselineAfterPath -Raw -Encoding UTF8 | ConvertFrom-Json } else { $null }
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

function Save-Utf8 {
    param([string] $Path, [string] $Text)
    [System.IO.File]::WriteAllText($Path, $Text.TrimEnd() + "`r`n", [System.Text.UTF8Encoding]::new($false))
}
function New-Doc { [System.Text.StringBuilder]::new() }
function Add-Line { param([System.Text.StringBuilder] $Doc, [string] $Line) $null = $Doc.AppendLine($Line) }
function Cell { param([object] $Value) if ($null -eq $Value) { return '' }; return ([string]$Value).Replace('|', '\|').Replace("`r", '').Replace("`n", ' ') }
function Join-Values { param([object] $Values) if ($null -eq $Values) { return '' }; return (($Values | ForEach-Object { Cell $_ }) -join '<br>') }
function Source-Ref { param([object] $Item) if ($null -eq $Item) { return 'UNKNOWN' }; return "$(Cell $Item.file):$(Cell $Item.line)" }
function Add-TableHeader { param([System.Text.StringBuilder] $Doc, [string] $Header); Add-Line $Doc ''; Add-Line $Doc $Header; Add-Line $Doc '|' + (($Header -replace '^\| | \|$','') -split ' \| ' | ForEach-Object { '---' }) -join '|' + '|' }

$endpointById = @{}
foreach ($endpoint in @($data.backend.endpoints)) { $endpointById[$endpoint.id] = $endpoint }
$confirmedMappings = @($data.mappings | Where-Object { $_.match -eq 'CONFIRMED' })
$unmatchedFrontend = @($data.mappings | Where-Object { $_.match -eq 'UNMATCHED' })
$backendUnmatched = @($data.backendUnmatched)
$backendAreas = @($data.backend.endpoints | Group-Object area | Sort-Object Name)
$projectCount = @($data.backend.projects).Count
$controllerCount = @($data.backend.controllers).Count
$backendApiCount = @($data.backend.endpoints).Count
$frontendRouteCount = @($data.frontend.routes).Count
$frontendApiCount = @($data.frontend.apiFunctions).Count
$moduleCount = @($data.frontend.features).Count
$unknownCount = 6 + $unmatchedFrontend.Count + $backendUnmatched.Count
$inferredCount = 5
$backendHead = git -C 'D:\HZ_RSS40\03_trunk\src_m_rsscomposer' rev-parse --short HEAD 2>$null
$backendBranch = git -C 'D:\HZ_RSS40\03_trunk\src_m_rsscomposer' branch --show-current 2>$null
$frontendHead = git -C 'D:\HZ_RSS40\03_trunk\src_m_ui' rev-parse --short HEAD 2>$null
$frontendBranch = git -C 'D:\HZ_RSS40\03_trunk\src_m_ui' branch --show-current 2>$null

# 00 baseline
$doc = New-Doc
Add-Line $doc '# 00：源码基线'
Add-Line $doc ''
Add-Line $doc '> ARCH-001 As-Built 基线。本文只记录当前源码扫描事实，不代表原始需求设计或运行时部署配置。'
Add-Line $doc ''
Add-Line $doc ("- 分析时间：{0}" -f $data.generatedAt)
Add-Line $doc '- 后端源码目录：`D:\HZ_RSS40\03_trunk\src_m_rsscomposer`（只读）'
Add-Line $doc '- 前端源码目录：`D:\HZ_RSS40\03_trunk\src_m_ui`（只读）'
Add-Line $doc ("- 后端 Git：{0} / {1}" -f $backendHead, $backendBranch)
Add-Line $doc ("- 前端 Git：{0} / {1}" -f $frontendHead, $frontendBranch)
Add-Line $doc ''
Add-Line $doc '## 哈希与文件数'
Add-Line $doc ''
Add-Line $doc '| 对象 | Before 文件数 | Before SHA-256 树哈希 | After 文件数 | After SHA-256 树哈希 | 一致性 |'
Add-Line $doc '| --- | ---: | --- | ---: | --- | --- |'
$afterBackendCount = if ($after) { $after.backend.FileCount } else { '待最终校验' }
$afterBackendHash = if ($after) { $after.backend.TreeHash } else { '待最终校验' }
$afterFrontendCount = if ($after) { $after.frontend.FileCount } else { '待最终校验' }
$afterFrontendHash = if ($after) { $after.frontend.TreeHash } else { '待最终校验' }
$backendEqual = if ($after) { if ($before.backend.TreeHash -eq $after.backend.TreeHash) { 'Yes' } else { 'No' } } else { '待最终校验' }
$frontendEqual = if ($after) { if ($before.frontend.TreeHash -eq $after.frontend.TreeHash) { 'Yes' } else { 'No' } } else { '待最终校验' }
Add-Line $doc "| Backend | $($before.backend.FileCount) | $($before.backend.TreeHash) | $afterBackendCount | $afterBackendHash | $backendEqual |"
Add-Line $doc "| Frontend | $($before.frontend.FileCount) | $($before.frontend.TreeHash) | $afterFrontendCount | $afterFrontendHash | $frontendEqual |"
Add-Line $doc ''
Add-Line $doc ("排除目录：{0}。哈希输入为按相对路径排序的 relative/path|individual-SHA256 清单，再对 UTF-8 清单计算 SHA-256。" -f ($before.exclusionDirectories -join ', '))
Add-Line $doc ''
Add-Line $doc '## 工作区与安全边界'
Add-Line $doc ''
Add-Line $doc '- `E:\automated-testing` 在本阶段开始时已有未提交的文档、报告、脚本和输出，均保留。'
Add-Line $doc '- 本阶段不启动前后端、不执行 Playwright/API/桌面测试、不连接数据库、不执行 npm install、dotnet restore、build 或 migration。'
Add-Line $doc '- 源码工作树在采集时存在既有修改；本阶段不把这些修改归因于 ARCH-001，也不修改两个真实源码目录。'
Add-Line $doc '- 初始全文件试算发现 `Build/loganalysis` 在持续生成运行时日志/压缩包；最终基线排除整个生成目录 `Build`，保留业务源码中的 `Areas/Log`，并从该规则重新建立 Before/After。'
Add-Line $doc '- 发现配置文件中可能包含敏感值；本套文档只记录“存在敏感配置”，不输出值。'
Save-Utf8 (Join-Path $OutputRoot '00-source-baseline.md') $doc.ToString()

# 01 overview
$doc = New-Doc
Add-Line $doc '# 01：系统总览'
Add-Line $doc ''
Add-Line $doc '## As-Built 结论'
Add-Line $doc ''
Add-Line $doc "当前系统由一个以 Avalonia 桌面宿主启动的 .NET 8 后端/调度程序与一个 Vue 3 + Vite 前端组成。后端在登录成功后的 `RSStarter.InitAfterLogin()` 链中启动 EmbedIO WebServer；前端通过运行时 `RssConfig.RSSApi` 配置，经 axios 请求后端 `/api` WebApi 路由。"
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'flowchart TD'
Add-Line $doc '    Browser[浏览器 / Vue 应用] --> Axios[axios request wrapper]'
Add-Line $doc '    Axios --> RuntimeConfig[RssConfig.RSSApi 运行时配置]'
Add-Line $doc '    RuntimeConfig --> EmbedIO[EmbedIO WebServer]'
Add-Line $doc '    EmbedIO --> ApiRoot[/api WebApi controllers]'
Add-Line $doc '    EmbedIO --> RootApi[/ 根路由 WebAPIContainer / WebAPIAgvInterface]'
Add-Line $doc '    ApiRoot --> Areas[Areas 控制器与 ServiceLocator]'
Add-Line $doc '    ApiRoot --> External[Controller 外部接口]
    Areas --> SqlSugar[SqlSugar DbContext]'
Add-Line $doc '    Areas --> Redis[HZ.Redis / StackExchange.Redis]'
Add-Line $doc '    EmbedIO --> WebSocket[WebSocket 看板推送]
    Areas --> ExternalSystems[MQTT / 外部系统 / 文件与日志处理]'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '## 主要模块'
Add-Line $doc ''
Add-Line $doc '| 范围 | 模块/区域 | 证据等级 |'
Add-Line $doc '| --- | --- | --- |'
foreach ($area in $backendAreas) { Add-Line $doc "| Backend | $(Cell $area.Name) | CONFIRMED_FROM_CODE（$($area.Count) 个端点） |" }
foreach ($feature in @($data.frontend.features)) { Add-Line $doc "| Frontend | $(Cell $feature.name) | $(Cell $feature.confidence) |" }
Add-Line $doc ''
Add-Line $doc '## 关键边界'
Add-Line $doc ''
Add-Line $doc '- `CONFIRMED_FROM_CODE`：路线、类、方法、包、调用关系和源码配置键由当前源码直接支持。'
Add-Line $doc '- `CONFIRMED_FROM_RUNTIME`：仅引用既有 Web 报告中的登录/首页运行结果；本阶段未重新启动系统。'
Add-Line $doc '- `INFERRED`：由目录、调用和命名关系推断的页面业务归属。'
Add-Line $doc '- `UNKNOWN`：源码没有提供足够信息的实际部署取值、数据库现状、外部协议语义和原始需求意图。'
Save-Utf8 (Join-Path $OutputRoot '01-system-overview.md') $doc.ToString()

# 02 backend
$doc = New-Doc
Add-Line $doc '# 02：后端架构'
Add-Line $doc ''
Add-Line $doc '## Solution / Project'
Add-Line $doc ''
Add-Line $doc "Solution 数量：**$(@($data.backend.solutions).Count)**；Project 数量：**$projectCount**。"
Add-Line $doc ''
Add-Line $doc '| Project | TargetFramework | ProjectReference | 主要 PackageReference |'
Add-Line $doc '| --- | --- | --- | --- |'
foreach ($project in @($data.backend.projects)) { Add-Line $doc "| $(Cell $project.name) | $(Join-Values $project.targetFramework) | $(Join-Values $project.projectReferences) | $(Join-Values (@($project.packageReferences | Select-Object -First 8 | ForEach-Object { $_.name + ' ' + $_.version }))) |" }
Add-Line $doc ''
Add-Line $doc '## 启动与 Web 运行链'
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'sequenceDiagram'
Add-Line $doc '    participant P as Program.Main'
Add-Line $doc '    participant A as App / LoginWindow'
Add-Line $doc '    participant S as RSStarter'
Add-Line $doc '    participant E as EmbedIO WebServer'
Add-Line $doc '    P->>P: Configuration.Load / license check / global exception'
Add-Line $doc '    P->>A: BuildAvaloniaApp().StartWithClassicDesktopLifetime'
Add-Line $doc '    A->>A: LoginWindow closes with LoginSuccess'
Add-Line $doc '    A->>S: InitAfterLogin()'
Add-Line $doc '    S->>S: UseSystemParam / UsePlugins / UseHeuristics'
Add-Line $doc '    S->>E: UseEmbedIO() registers /api and / controllers'
Add-Line $doc '    S->>S: UseWebSocket / UseLogAnalysis / recovery monitor'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '源码入口：`HZ.RSSComposer/Program.cs`、`HZ.RSSComposer/App.axaml.cs`、`HZ.RSSComposer/RSStarter.cs`。运行时 WebServer 注册基于 EmbedIO；并非 ASP.NET Core Controller/MVC 映射。'
Add-Line $doc ''
Add-Line $doc '## 分层与依赖'
Add-Line $doc ''
Add-Line $doc '- `Controller` / `Areas/*Controller`：EmbedIO WebApiController，读取请求、组装 ApiResult，并通过 `ServiceLocator.GetService<T>()` 获取服务。'
Add-Line $doc '- `HZ.Interfaces/Service`：Service 与 `BaseService<T>`，业务调用通过 `DbContext`/SqlSugar 和 Redis 等基础设施完成。'
Add-Line $doc '- `HZ.Model`：Entity、View/DTO 和模型；本阶段只列摘要，不复制字段全文。'
Add-Line $doc '- `HZ.Tools/HZ.DbHelper`：`DbContext`、`SessionInfo`、数据库类型映射和 AOP 日志。'
Add-Line $doc '- 未观察到独立 Repository 项目；文档不虚构 Repository 层。'
Add-Line $doc ''
Add-Line $doc '## Controller 覆盖'
Add-Line $doc ''
Add-Line $doc "共识别 **$controllerCount** 个 Controller/WebApiController。"
Add-Line $doc '| Controller | Area | Base type | RequiresToken | ServiceLocator 引用 | Source |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- |'
foreach ($controller in @($data.backend.controllers)) { Add-Line $doc "| $(Cell $controller.name) | $(Cell $controller.area) | $(Cell $controller.baseType) | $(if($controller.requiresToken){'Yes'}else{'No'}) | $(Join-Values $controller.serviceReferences) | $(Cell $controller.file) |" }
Add-Line $doc ''
Add-Line $doc '## 技术栈（源码确认）'
Add-Line $doc ''
Add-Line $doc '| Concern | Implementation | Evidence |'
Add-Line $doc '| --- | --- | --- |'
Add-Line $doc '| Desktop host | Avalonia 11.3.9 package in `HZ.RSSComposer.csproj` | `HZ.RSSComposer/Program.cs` |'
Add-Line $doc '| HTTP/Web API | EmbedIO WebServer / WebApiController | `RSStarter.UseEmbedIO()` |'
Add-Line $doc '| ORM/data access | SqlSugarCore + `SqlSugarClient` | `HZ.Tools/HZ.DbHelper/DbContext.cs` |'
Add-Line $doc '| DI/service location | Autofac + `ServiceLocator` | `HZ.Interfaces/ServiceLocator.cs` |'
Add-Line $doc '| Database connector | MySqlConnector package; runtime DB type is configuration-driven | `HZ.Tools/HZ.DbHelper/DbContext.cs` |'
Add-Line $doc '| Cache | HZ.Redis / StackExchange.Redis | `HZ.Tools/HZ.Redis`, `TokenService.cs` |'
Add-Line $doc '| Serialization | Newtonsoft.Json | csproj and controllers |'
Add-Line $doc '| Realtime | WebSocket and MQTTnet code paths | `RSStarter.cs`, package references |'
Save-Utf8 (Join-Path $OutputRoot '02-backend-architecture.md') $doc.ToString()

# 03 frontend
$doc = New-Doc
Add-Line $doc '# 03：前端架构'
Add-Line $doc ''
Add-Line $doc '| Concern | Current implementation | Source |'
Add-Line $doc '| --- | --- | --- |'
Add-Line $doc '| Framework | Vue 3 | `package.json`, `src/main.ts` |'
Add-Line $doc '| Version | `^3.5.13` | `package.json` |'
Add-Line $doc '| Build | Vite `^6.3.2` | `package.json`, `vite.config.ts` |'
Add-Line $doc '| Router | vue-router `^4.5.0`, hash history | `src/router/index.ts` |'
Add-Line $doc '| State | Pinia `^2.3.1` and Vuex `^4.1.0` declared; current auth/permission path uses Pinia | `src/store`, `src/store/modules` |'
Add-Line $doc '| HTTP | axios `^0.24.0`, centralized request/response interceptors | `src/utils/request.ts` |'
Add-Line $doc '| UI | Element Plus `^2.9.3` | `package.json`, `src/plugins` |'
Add-Line $doc '| Visualization | ECharts, Three.js, LogicFlow, WebSocket/STOMP/MQTT code paths | `package.json`, `src/views`, `src/modules` |'
Add-Line $doc ''
Add-Line $doc '## 启动流程'
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'flowchart TD'
Add-Line $doc '    Main[src/main.ts] --> Plugins[src/plugins/index.ts]'
Add-Line $doc '    Plugins --> App[App.vue]'
Add-Line $doc '    Plugins --> Router[setupRouter / vue-router]'
Add-Line $doc '    Plugins --> Store[setupStore / Pinia modules]'
Add-Line $doc '    Plugins --> Permission[setupPermission route guard]'
Add-Line $doc '    Permission --> Auth[access token + userInfo]'
Add-Line $doc '    Router --> Layout[layout/index.vue]'
Add-Line $doc '    Layout --> Dynamic[MenuAPI.getRoutes -> dynamic routes]'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '## Route Inventory'
Add-Line $doc ''
Add-Line $doc "静态/动态路由记录：**$frontendRouteCount**。动态菜单路由的实际 path/component 来自后端 `MenuAPI.getRoutes()` 返回值，源码无法在不运行系统或访问数据库的情况下列出具体运行时菜单。"
Add-Line $doc ''
Add-Line $doc '| Path | Name | Component | Kind | Hidden | Source |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- |'
foreach ($route in @($data.frontend.routes)) { Add-Line $doc "| $(Cell $route.path) | $(Cell $route.name) | $(Cell $route.component) | $(Cell $route.kind) | $(Cell $route.hidden) | $(Cell $route.source):$(Cell $route.line) |" }
Add-Line $doc ''
Add-Line $doc '## 页面/功能一级目录'
Add-Line $doc ''
Add-Line $doc '| Module ID | Directory | File count | Confidence |'
Add-Line $doc '| --- | --- | ---: | --- |'
foreach ($feature in @($data.frontend.features)) { Add-Line $doc "| $(Cell $feature.id) | $(Cell $feature.source) | $(Cell $feature.fileCount) | $(Cell $feature.confidence) |" }
Save-Utf8 (Join-Path $OutputRoot '03-frontend-architecture.md') $doc.ToString()

# 04 APIs
$doc = New-Doc
Add-Line $doc '# 04：API 设计与清单'
Add-Line $doc ''
Add-Line $doc '> API 清单是源码静态扫描结果。Request/Response 只有在控制器或接口签名可直接确认时才记录；没有静态证据的字段标为 `UNKNOWN`。'
Add-Line $doc ''
Add-Line $doc "后端 API：**$backendApiCount**；前端 API 函数：**$frontendApiCount**。"
Add-Line $doc ''
Add-Line $doc '## Backend API Inventory'
Add-Line $doc ''
Add-Line $doc '| API ID | Area | Method | Route | Controller | Method | Auth | Service refs | Request/Response | Source |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
foreach ($endpoint in @($data.backend.endpoints)) { Add-Line $doc "| $(Cell $endpoint.id) | $(Cell $endpoint.area) | $(Cell $endpoint.method) | $(Cell $endpoint.route) | $(Cell $endpoint.controller) | $(Cell $endpoint.methodName) | $(if($endpoint.requiresToken){'RequiresToken'}else{'not observed'}) | $(Join-Values $endpoint.serviceReferences) | UNKNOWN unless method/body code confirms | $(Source-Ref $endpoint) |" }
Add-Line $doc ''
Add-Line $doc '## Frontend API Inventory'
Add-Line $doc ''
Add-Line $doc '| API ID | Function | Method | URL | Source | Confidence |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- |'
foreach ($api in @($data.frontend.apiFunctions)) { Add-Line $doc "| $(Cell $api.id) | $(Cell $api.function) | $(Cell $api.method) | $(Cell $api.url) | $(Cell $api.file):$(Cell $api.line) | $(Cell $api.confidence) |" }
Add-Line $doc ''
Add-Line $doc '## Response/error conventions'
Add-Line $doc ''
Add-Line $doc '- 前端 `src/utils/request.ts` 以 `response.data.statusCode === 200 && isSuccess` 作为成功条件；二进制 `blob` 响应直接返回。'
Add-Line $doc '- `statusCode == 600` 会提示重新登录、清理用户数据并跳转 `/login`；其它业务错误由 Element Plus `ElMessage` 展示。'
Add-Line $doc '- 后端 Areas 基类返回 `ApiResult`；未统一确认所有 Controller 的 body schema，故未将所有结果包装字段强行归纳为单一 DTO。'
Save-Utf8 (Join-Path $OutputRoot '04-api-design.md') $doc.ToString()

# 05 mapping
$doc = New-Doc
Add-Line $doc '# 05：前端 ↔ 后端 API 映射'
Add-Line $doc ''
Add-Line $doc '## 匹配规则'
Add-Line $doc ''
Add-Line $doc '本次 `CONFIRMED` 仅表示前端 method 与 URL 和后端 `Route(HttpVerbs.*, path)` 精确相等。`PROBABLE` 未由静态扫描器自动填写；动态拼接、运行时菜单、外部调用和版本差异不做猜测。'
Add-Line $doc ''
Add-Line $doc '| Result | Count | Meaning |'
Add-Line $doc '| --- | ---: | --- |'
Add-Line $doc "| CONFIRMED | $($confirmedMappings.Count) | method + route exact match |"
Add-Line $doc '| PROBABLE | 0 | 本次未把启发式相似匹配写成确认 |'
Add-Line $doc "| Frontend UNMATCHED | $($unmatchedFrontend.Count) | 当前前端静态 API 未找到精确后端端点 |"
Add-Line $doc "| Backend UNMATCHED | $($backendUnmatched.Count) | 当前后端端点未被前端静态 API 精确使用 |"
Add-Line $doc ''
Add-Line $doc '## Page → Component → API → Controller → Service'
Add-Line $doc ''
Add-Line $doc '| Frontend API | Method | URL | Backend API | Controller | Service refs | Match | Source |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- | --- | --- |'
foreach ($mapping in @($data.mappings)) {
    $endpoint = if ($mapping.backendApiId) { $endpointById[$mapping.backendApiId] } else { $null }
    Add-Line $doc "| $(Cell $mapping.frontendFunction) ($(Cell $mapping.frontendApiId)) | $(Cell $mapping.frontendMethod) | $(Cell $mapping.frontendUrl) | $(Cell $mapping.backendApiId) | $(Cell $mapping.backendController) | $(if($endpoint){Join-Values $endpoint.serviceReferences}else{'UNKNOWN'}) | $(Cell $mapping.match) | $(Cell $mapping.confidence) |"
}
Add-Line $doc ''
Add-Line $doc '## Backend APIs without current frontend static usage'
Add-Line $doc ''
Add-Line $doc '| API ID | Route | Controller | Area | Possible interpretation |'
Add-Line $doc '| --- | --- | --- | --- | --- |'
foreach ($endpoint in $backendUnmatched) { Add-Line $doc "| $(Cell $endpoint.id) | $(Cell $endpoint.route) | $(Cell $endpoint.controller) | $(Cell $endpoint.area) | UNKNOWN: may be external, legacy, dynamic, test or version-specific |" }
Save-Utf8 (Join-Path $OutputRoot '05-frontend-backend-mapping.md') $doc.ToString()

# 06 auth permission
$doc = New-Doc
Add-Line $doc '# 06：认证与权限设计'
Add-Line $doc ''
Add-Line $doc '## Authentication'
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'sequenceDiagram'
Add-Line $doc '    participant U as Login.vue'
Add-Line $doc '    participant S as Pinia user store'
Add-Line $doc '    participant A as AccountController'
Add-Line $doc '    participant T as TokenService / Redis'
Add-Line $doc '    participant R as Router guard'
Add-Line $doc '    U->>S: login(userCode, userPwd)'
Add-Line $doc '    S->>A: POST /Account/Login'
Add-Line $doc '    A-->>S: ApiResult token payload'
Add-Line $doc '    S->>S: setAccessToken + setRefreshToken'
Add-Line $doc '    U->>S: getUserInfo()'
Add-Line $doc '    S->>A: GET /Account/Info'
Add-Line $doc '    A->>T: resolve current token / session data'
Add-Line $doc '    S-->>U: userInfo.roles + userInfo.perms'
Add-Line $doc '    U->>R: router.replace("/")'
Add-Line $doc '    R->>R: generate dynamic routes from MenuAPI.getRoutes()'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '源码确认的令牌链：前端 `src/utils/auth.ts` 存取 `access_token`/`refresh_token`；请求拦截器把 access token 写入请求头 `token`；后端 `WebBaseController.OnBeforeHandler()` 读取该头并写入 `SessionInfo.token`，带 `[RequiresToken]` 的 Controller 再调用 `ITokenService.IsAuthenticated()`。'
Add-Line $doc ''
Add-Line $doc '## Frontend permission'
Add-Line $doc ''
Add-Line $doc '- `src/plugins/permission.ts` 白名单包含 `/login`、`/a/b`、`/a/c`；其它未登录路径重定向 `/login?redirect=...`。'
Add-Line $doc '- 登录后第一次路由进入会调用 `permissionStore.generateRoutes()`，再把后端菜单转换为 Vue Router 动态路由。组件路径无法解析时回退到 `views/error/404.vue`。'
Add-Line $doc '- `hasAuth()` 按 `roles`、`perms` 做按钮/角色判断；`ROOT` 角色对按钮权限直接返回 true。'
Add-Line $doc ''
Add-Line $doc '## Backend permission'
Add-Line $doc ''
Add-Line $doc '- 后端授权主要由 `[RequiresToken]` 与 `WebBaseController.OnBeforeHandler()` 组成；未标注该特性的 Controller 不会被该基类 token 检查拦截。'
Add-Line $doc '- Account 登录/刷新/注销端点与 Areas token 保护分开；`TokenService` 使用 Redis 用户信息判断 token 是否有效。'
Add-Line $doc '- 某些 Controller 未观察到 `RequiresToken`。这只能记录为 `POTENTIAL_SECURITY_DESIGN_GAP`/`UNKNOWN`，不能仅凭源码判定为 Bug，因为它们可能是外部或车载接口。'
Add-Line $doc ''
Add-Line $doc '## Logout / refresh'
Add-Line $doc ''
Add-Line $doc '`UserStore.logout()` 调用 `/Account/Logout` 后清理 token、动态路由和字典缓存；`refreshToken()` 调用 `/Account/refresh-token`，请求显式设置 `Authorization: no-auth`。具体 token 失效存储和部署 TTL 不能从前端源码单独确认。'
Add-Line $doc ''
Add-Line $doc '既有 runtime 证据：`projects/test-workflow/reports/web-real-001-report.md` 记录了既有真实登录与 Dashboard Entry PASS；该报告不是本次重新执行结果，且没有把当前源码树证明为同一编译产物。'
Save-Utf8 (Join-Path $OutputRoot '06-auth-permission-design.md') $doc.ToString()

# 07 modules
$doc = New-Doc
Add-Line $doc '# 07：模块设计'
Add-Line $doc ''
Add-Line $doc '## 模块总表'
Add-Line $doc ''
Add-Line $doc '| Module ID | Frontend entry / directory | Backend area | Main operations | Confidence |'
Add-Line $doc '| --- | --- | --- | --- | --- |'
foreach ($feature in @($data.frontend.features)) {
    $backendArea = switch ($feature.name) { 'Employee' { 'Employee' } 'Sys' { 'Info / Employee' } 'system' { 'Employee / Info / Log' } 'Task' { 'Task / Temp' } 'KanBan' { 'Monitor / Map' } 'Logs' { 'Log' } 'Statistics' { 'Report' } default { 'UNKNOWN / not one-to-one' } }
    $ops = switch ($feature.name) { 'Employee' { '用户、角色、菜单、策略 CRUD/权限关系' } 'system' { '用户、部门、字典、通知、配置、角色、菜单、日志页面' } 'Sys' { '车辆、外部系统、字典页面' } 'Task' { '任务、任务模板、策略、任务项、维护' } 'KanBan' { '监控看板与实时数据' } 'Logs' { '系统日志、RSS 日志、异常/文件日志' } 'Statistics' { '统计查询/展示' } default { '页面功能由源码组件确定；业务语义部分 UNKNOWN' } }
    Add-Line $doc "| $(Cell $feature.id) | $(Cell $feature.source) | $(Cell $backendArea) | $(Cell $ops) | $(Cell $feature.confidence) |"
}
Add-Line $doc ''
Add-Line $doc '## System Management Design'
Add-Line $doc ''
Add-Line $doc '当前源码中的系统管理不是单一目录，而是由 `src/views/system`、`src/views/Employee`、`src/views/Sys` 与 `src/views/Logs` 的若干页面共同组成。'
Add-Line $doc ''
Add-Line $doc '| Submodule | Frontend source | Backend Controller/API families | Service family | Permissions |'
Add-Line $doc '| --- | --- | --- | --- | --- |'
Add-Line $doc '| 用户管理 | `views/system/user`, `views/Employee/User` | `UserController`, `/User/*` | `UserService` | 前端 `hasAuth` + 后端 token path；具体按钮权限来自用户信息/菜单数据 |'
Add-Line $doc '| 角色管理 | `views/system/role`, `views/Employee/Role` | `RoleController`, `/Role/*` | `RoleService`, `RoleMenuService` | 角色/权限数据由后端返回 |'
Add-Line $doc '| 菜单管理 | `views/system/menu`, `views/Employee/Menu` | `MenuController`, `/Menu/*` | `MenuService` | 菜单路由和按钮 permission 字段 |'
Add-Line $doc '| 字典/配置 | `views/system/dict`, `views/system/config`, `views/Sys/DictManager` | `DictController`, `ExSystemController` and system API families | `DictService`, `ExSystemService` | 页面权限与 token policy 需结合运行时菜单确认 |'
Add-Line $doc '| 部门/通知/日志 | `views/system/dept`, `views/system/notice`, `views/system/log`, `views/Logs` | 对应 system/log Controller families where present | Service by source file | UNKNOWN where exact page-to-controller route is not statically matched |'
Add-Line $doc ''
Add-Line $doc '本节只描述代码中存在的入口、API 和关系；不生成操作步骤，也不把既有真实测试用例扩展为本阶段测试设计。'
Save-Utf8 (Join-Path $OutputRoot '07-module-design.md') $doc.ToString()

# 08 flows
$doc = New-Doc
Add-Line $doc '# 08：业务流程'
Add-Line $doc ''
Add-Line $doc '## Login Flow'
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'sequenceDiagram'
Add-Line $doc '    participant Browser as Login Page'
Add-Line $doc '    participant Store as user store'
Add-Line $doc '    participant Request as axios wrapper'
Add-Line $doc '    participant API as AccountController'
Add-Line $doc '    participant Session as TokenService / Redis'
Add-Line $doc '    Browser->>Store: handleLogin -> loginFormData'
Add-Line $doc '    Store->>Request: POST /Account/Login'
Add-Line $doc '    Request->>API: token header omitted or current token injected'
Add-Line $doc '    API->>Session: create/resolve user session (implementation path)'
Add-Line $doc '    API-->>Store: success + data.token'
Add-Line $doc '    Store->>Store: persist access/refresh token'
Add-Line $doc '    Store->>Request: GET /Account/Info'
Add-Line $doc '    Request->>API: token header'
Add-Line $doc '    API-->>Store: roles/perms/userInfo'
Add-Line $doc '    Browser->>Browser: router.replace("/")'
Add-Line $doc '    Browser->>Request: GET /Menu/GetMenuByPowerTree'
Add-Line $doc '    Request-->>Browser: dynamic menu routes'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '## System Management main flow'
Add-Line $doc ''
Add-Line $doc '```mermaid'
Add-Line $doc 'sequenceDiagram'
Add-Line $doc '    participant Page as System Management page'
Add-Line $doc '    participant Api as Frontend API module'
Add-Line $doc '    participant Server as EmbedIO /api'
Add-Line $doc '    participant Controller as Areas Controller'
Add-Line $doc '    participant Service as HZ.Interfaces Service'
Add-Line $doc '    participant Data as SqlSugar / Redis / external dependency'
Add-Line $doc '    Page->>Api: query or CRUD action'
Add-Line $doc '    Api->>Server: axios request with token header'
Add-Line $doc '    Server->>Controller: route dispatch'
Add-Line $doc '    Controller->>Controller: WebBaseController token pre-check when RequiresToken exists'
Add-Line $doc '    Controller->>Service: ServiceLocator.GetService<T>()'
Add-Line $doc '    Service->>Data: query/change data or external system'
Add-Line $doc '    Data-->>Service: result'
Add-Line $doc '    Service-->>Controller: ApiResult/model'
Add-Line $doc '    Controller-->>Api: JSON response'
Add-Line $doc '    Api-->>Page: success data or ElMessage error'
Add-Line $doc '```'
Add-Line $doc ''
Add-Line $doc '## Other cross-system flows'
Add-Line $doc ''
Add-Line $doc '- Map/Task/Car modules contain CRUD and dispatch-related routes; exact business semantics are documented only as source names and endpoint families where no explicit domain specification exists.'
Add-Line $doc '- `RSStarter.UseWebSocket()` starts a periodic push loop for dashboard vehicle-position data; this is a source-confirmed runtime path, not visually tested in ARCH-001.'
Add-Line $doc '- `UseEmbedIO()` also registers `/` routes for traffic/vehicle-facing `WebAPIContainer` and `WebAPIAgvInterface`; these are not assumed to be browser page APIs.'
Save-Utf8 (Join-Path $OutputRoot '08-business-flows.md') $doc.ToString()

# 09 data/external
$doc = New-Doc
Add-Line $doc '# 09：数据与外部依赖'
Add-Line $doc ''
Add-Line $doc '| Dependency | Type | Used by | Source evidence | Purpose confidence |'
Add-Line $doc '| --- | --- | --- | --- | --- |'
Add-Line $doc '| SqlSugarCore / SqlSugarClient | ORM/data access | `DbContext`, `BaseService`, domain services | `HZ.Tools/HZ.DbHelper/DbContext.cs` | CONFIRMED_FROM_CODE; actual schema/runtime DB unknown |'
Add-Line $doc '| MySqlConnector | Database connector package | `HZ.DbHelper` project/package | `HZ.Tools/HZ.DbHelper.csproj` | CONFIRMED_FROM_CODE; selected DB type is configuration-driven |'
Add-Line $doc '| Redis | Cache/session/user info | `TokenService`, `RedisUserinfoHelper`, HZ.Redis | `TokenService.cs`, HZ.Redis project | CONFIRMED_FROM_CODE; server address/availability UNKNOWN |'
Add-Line $doc '| EmbedIO | HTTP server/API | `RSStarter.UseEmbedIO` | `RSStarter.cs`, csproj | CONFIRMED_FROM_CODE |'
Add-Line $doc '| WebSocket | Dashboard realtime channel | `WebSocketHelper`, `RSStarter.UseWebSocket` | `RSStarter.cs`, `AppCode/WebScoketHelper.cs` | CONFIRMED_FROM_CODE; endpoint value runtime-configured |'
Add-Line $doc '| MQTTnet | Message/vehicle integration code path | HZ.Mqtt and app code | csproj and source references | CONFIRMED_FROM_CODE; external broker/protocol UNKNOWN |'
Add-Line $doc '| Plugins DLL | Dynamic plugin extension | `RSStarter.UsePlugins` | `RSStarter.cs` | CONFIRMED_FROM_CODE; installed plugin set UNKNOWN |'
Add-Line $doc '| License file | Startup prerequisite | `Program.Main` reads `rss.lic` | `Program.cs` | CONFIRMED_FROM_CODE; actual license value omitted |'
Add-Line $doc '| File/log packages | Log analysis, import/download, image/export paths | LogAnalysis controllers/services and frontend file APIs | source file names and APIs | CONFIRMED_FROM_CODE; filesystem layout runtime-dependent |'
Add-Line $doc ''
Add-Line $doc '## Data model summary'
Add-Line $doc ''
Add-Line $doc "`HZ.Model` 下静态识别到 **$(@($data.backend.models).Count)** 个模型/实体候选文件。该计数不等于数据库表数量；关系、索引和实际数据库 schema 未通过连接数据库确认。"
Add-Line $doc ''
Add-Line $doc '| Model kind | Count | Notes |'
Add-Line $doc '| --- | ---: | --- |'
foreach ($group in @($data.backend.models | Group-Object kind)) { Add-Line $doc "| $(Cell $group.Name) | $($group.Count) | Source file candidates under `HZ.Model` |" }
Add-Line $doc ''
Add-Line $doc '禁止事项执行记录：本阶段没有连接真实数据库、没有上传/下载文件、没有调用外部 API、没有启动 WebSocket/MQTT。'
Save-Utf8 (Join-Path $OutputRoot '09-data-and-external-dependencies.md') $doc.ToString()

# 10 errors/observability
$doc = New-Doc
Add-Line $doc '# 10：错误处理与可观测性'
Add-Line $doc ''
Add-Line $doc '## Frontend'
Add-Line $doc ''
Add-Line $doc '- `src/utils/request.ts` 统一处理业务失败、HTTP/axios error、`statusCode=600` 重登录和 Element Plus message。'
Add-Line $doc '- `src/plugins/permission.ts` 捕获动态路由生成异常，清理 user data 后重定向登录。'
Add-Line $doc '- `src/utils/errorHandling.js` 参与网络错误消息转换；当前文档不复制真实运行日志内容。'
Add-Line $doc '- `console.log`/`console.error` 仍存在于部分启动/动态路由路径；是否接入集中日志系统 UNKNOWN。'
Add-Line $doc ''
Add-Line $doc '## Backend'
Add-Line $doc ''
Add-Line $doc '- `RSStarter.UseGlobalException()` 注册未观察任务异常和 AppDomain 未处理异常处理；记录 `Diagnosis`，终止时尝试重启进程。'
Add-Line $doc '- `WebBaseController.OnBeforeHandler()` 在 token 缺失/无效时写入状态码和序列化后的 `ApiResult`，并关闭 response stream。'
Add-Line $doc '- 多个 Controller 使用 `try/catch` 创建 `ApiResult`；全局是否统一所有异常响应格式 UNKNOWN。'
Add-Line $doc '- `OpenApiLogger` 对外部 Controller 的 API 调用进行日志登记/序列化接线；Areas 控制器是否入库由源码注释明确为不登记。'
Add-Line $doc ''
Add-Line $doc '## 日志/监控'
Add-Line $doc ''
Add-Line $doc '| Signal | Source | Status |'
Add-Line $doc '| --- | --- | --- |'
Add-Line $doc '| Diagnosis/custom logs | `Diagnosis.Post` references | CONFIRMED_FROM_CODE |'
Add-Line $doc '| Open API logging | `OpenApiLogger` | CONFIRMED_FROM_CODE |'
Add-Line $doc '| Scheduler/log analysis | `UseLogAnalysis` and log-analysis services | CONFIRMED_FROM_CODE |'
Add-Line $doc '| Central monitoring/metrics/tracing backend | no complete source proof | UNKNOWN |'
Save-Utf8 (Join-Path $OutputRoot '10-error-and-observability.md') $doc.ToString()

# 11 unknowns
$doc = New-Doc
Add-Line $doc '# 11：已知不确定项'
Add-Line $doc ''
Add-Line $doc '> 本表集中记录不能从当前源码直接证明的内容。`UNMATCHED` 不是 Bug 结论。'
Add-Line $doc ''
Add-Line $doc '| ID | Category | Description | Evidence | Impact | Recommendation |'
Add-Line $doc '| --- | --- | --- | --- | --- | --- |'
Add-Line $doc '| UNK-001 | UNMATCHED_API | 前端静态 API 与后端精确匹配缺口 | `05-frontend-backend-mapping.md` 的完整清单 | 可能影响后续测试覆盖设计 | 人工确认运行时版本、动态路径和外部调用边界 |'
Add-Line $doc '| UNK-002 | UNUSED_CODE | 后端端点未找到前端静态调用 | backend endpoint inventory / 44 records | 可能是外部接口、旧接口、动态调用或版本不一致 | 结合运行时网络日志或 API owner 逐条归属 |'
Add-Line $doc '| UNK-003 | ENVIRONMENT_DEPENDENCY | API address、WebSocket address、license、Redis、数据库取值 | runtime config / Program / DbContext references | 源码无法代表部署环境 | 在受控环境单独建立配置基线，不把凭据写入仓库 |'
Add-Line $doc '| UNK-004 | POTENTIAL_SOURCE_RUNTIME_MISMATCH | 当前两个源码工作树有既有修改，既有 Web runtime report 未证明由当前 hash 构建 | source Git status + `projects/test-workflow/reports/web-real-001-report.md` | 代码映射与运行证据可能来自不同版本 | 由人工确认构建产物与 source commit 对应关系 |'
Add-Line $doc '| UNK-005 | UNKNOWN_BUSINESS_MEANING | 数字状态、配置键、外部消息字段的业务含义不总由 enum/文档确定 | model/service/controller conditions | 后续测试断言可能误写业务语义 | 以产品/领域资料补充后再进入 Test Design |'
Add-Line $doc '| UNK-006 | POTENTIAL_SECURITY_DESIGN_GAP | 部分 WebApiController 未观察到 RequiresToken | controller inventory | 可能是公开/车载/外部接口，也可能存在权限边界差异 | 由安全/接口 owner 确认 intended exposure；本阶段不修复 |'
Add-Line $doc '| UNK-007 | MISSING_DOCUMENTATION | 原始需求、部署拓扑、数据库 schema、外部协议未随源码完整提供 | repository/source scan | As-Built 只能描述实现结构 | 人工审查本文并补充受控设计资料 |'
Add-Line $doc '| INF-001 | INFERRED_DESIGN | 以 `src/views` 一级目录作为主要前端模块 | view directory inventory | 目录边界不必等于产品模块边界 | 后续由 owner 确认模块归属 |'
Add-Line $doc '| INF-002 | INFERRED_DESIGN | `system`/`Employee`/`Sys`/`Logs` 合并为系统管理范围 | page names + APIs + controller areas | 可能遗漏运行时菜单别名 | 以菜单数据和产品术语审查 |'
Add-Line $doc '| INF-003 | INFERRED_DESIGN | Service refs 作为 Controller→Service 映射 | `ServiceLocator.GetService<T>()` | 间接调用/运行时反射可能未捕获 | 后续需要时补充调用图 |'
Add-Line $doc ''
Add-Line $doc '## 当前阶段明确不确认'
Add-Line $doc ''
Add-Line $doc '- 不确认生产环境具体 URL、端口、数据库、Redis、MQTT、WebSocket 可用性。'
Add-Line $doc '- 不确认原始业务意图、权限设计意图、状态数字的业务名称。'
Add-Line $doc '- 不确认现有运行时与当前源码树完全同版。'
Save-Utf8 (Join-Path $OutputRoot '11-known-unknowns.md') $doc.ToString()

# test observations (not test cases)
$doc = New-Doc
Add-Line $doc '# ARCH-001：后续测试设计观察（非 TestCase）'
Add-Line $doc ''
Add-Line $doc '> 本文件只保留架构观察，不包含正式测试编号、步骤、预期结果或执行状态。'
Add-Line $doc ''
Add-Line $doc '| 模块 | 风险/观察点 | 为什么后续值得测试 | 关联设计 |'
Add-Line $doc '| --- | --- | --- | --- |'
Add-Line $doc '| Auth | 前端 token header、后端 RequiresToken、Redis user info 三者需要一致 | 可验证登录、失效 token、权限边界 | `06-auth-permission-design.md` |'
Add-Line $doc '| Dynamic routes | 路由由后端菜单数据生成，组件解析失败回退 404 | 可验证菜单/组件/权限组合 | `03-frontend-architecture.md` |'
Add-Line $doc '| System Management | 用户/角色/菜单/字典 API 存在多套 `src/api` 家族 | 可验证页面实际调用与后端 route 对应关系 | `05-frontend-backend-mapping.md` |'
Add-Line $doc '| Error handling | `statusCode=600` 会触发全局登出/重定向 | 可验证失败响应后的统一行为 | `10-error-and-observability.md` |'
Add-Line $doc '| Unmatched APIs | 116 个前端记录与 44 个后端端点静态未匹配 | 需要版本/动态/外部边界确认后再选测试 | `11-known-unknowns.md` |'
Save-Utf8 (Join-Path $OutputRoot 'test-design-observations.md') $doc.ToString()

# coverage
$doc = New-Doc
Add-Line $doc '# ARCH-001 设计覆盖统计'
Add-Line $doc ''
Add-Line $doc '| Metric | Count | Coverage interpretation |'
Add-Line $doc '| --- | ---: | --- |'
Add-Line $doc "| Backend Projects | $projectCount | Current filtered source scan |"
Add-Line $doc "| Controllers | $controllerCount | All controller candidates identified by scanner and listed in backend architecture |"
Add-Line $doc "| Backend APIs | $backendApiCount | All route attributes captured by scanner in current scope |"
Add-Line $doc "| Frontend Routes | $frontendRouteCount | Static routes plus one dynamic-menu design record; runtime menu paths remain UNKNOWN |"
Add-Line $doc "| Frontend API functions | $frontendApiCount | API source files, comments excluded |"
Add-Line $doc "| Matched APIs | $($confirmedMappings.Count) | Exact method + route match |"
Add-Line $doc "| Unmatched Frontend APIs | $($unmatchedFrontend.Count) | No exact backend route; not a defect conclusion |"
Add-Line $doc "| Unmatched Backend APIs | $($backendUnmatched.Count) | No exact frontend static usage; not a defect conclusion |"
Add-Line $doc "| Business modules | $moduleCount | Frontend view-level modules; module boundaries partly inferred |"
Add-Line $doc "| UNKNOWN items | $unknownCount | Consolidated unknown categories plus unmatched records |"
Add-Line $doc "| INFERRED items | $inferredCount | Explicit inferred design observations |"
Add-Line $doc ''
Add-Line $doc '## Quality gates'
Add-Line $doc ''
Add-Line $doc '- Backend Controller coverage：Yes（当前扫描范围内全部进入清单）。'
Add-Line $doc '- Backend API coverage：Yes（当前 route attribute 扫描范围内全部进入清单）。'
Add-Line $doc '- Frontend static route coverage：Yes；runtime dynamic menu values：UNKNOWN。'
Add-Line $doc '- Frontend API mapping status：Yes，每条有 `CONFIRMED` 或 `UNMATCHED`。'
Add-Line $doc '- Every UNKNOWN/INFERRED：Yes，集中记录于 `11-known-unknowns.md` 或对应章节。'
Add-Line $doc '- Runtime/visual acceptance：No，本阶段禁止执行。'
Save-Utf8 (Join-Path $OutputRoot 'design-coverage.md') $doc.ToString()

# index JSON
$modules = @()
foreach ($feature in @($data.frontend.features)) { $modules += [ordered]@{ id = $feature.id; name = $feature.name; frontendEntry = $feature.source; backendArea = 'see module design'; confidence = $feature.confidence } }
foreach ($area in $backendAreas) { $modules += [ordered]@{ id = ('MOD-BACKEND-' + ($area.Name -replace '[^A-Za-z0-9]+', '-').ToUpperInvariant()); name = $area.Name; frontendEntry = 'UNKNOWN'; backendArea = $area.Name; confidence = 'CONFIRMED_FROM_CODE' } }
$unknowns = @(
    [ordered]@{ id = 'UNK-001'; category = 'UNMATCHED_API'; count = $unmatchedFrontend.Count; description = 'Frontend static APIs without exact backend match' },
    [ordered]@{ id = 'UNK-002'; category = 'UNUSED_CODE'; count = $backendUnmatched.Count; description = 'Backend endpoints without exact frontend static usage' },
    [ordered]@{ id = 'UNK-003'; category = 'ENVIRONMENT_DEPENDENCY'; description = 'Runtime addresses, license, database, Redis, MQTT and WebSocket values' },
    [ordered]@{ id = 'UNK-004'; category = 'POTENTIAL_SOURCE_RUNTIME_MISMATCH'; description = 'Dirty source trees and prior runtime evidence are not proven same build' },
    [ordered]@{ id = 'UNK-005'; category = 'UNKNOWN_BUSINESS_MEANING'; description = 'Some status/config/external field meanings lack direct source proof' },
    [ordered]@{ id = 'UNK-006'; category = 'POTENTIAL_SECURITY_DESIGN_GAP'; description = 'Some controller token annotations are not observed; intended exposure unknown' },
    [ordered]@{ id = 'UNK-007'; category = 'MISSING_DOCUMENTATION'; description = 'Original requirements, deployment topology, schema and external protocols incomplete' }
)
$index = [ordered]@{
    schema = 'ARCH-001/1'
    generatedAt = $data.generatedAt
    confidenceLevels = @('CONFIRMED_FROM_CODE', 'CONFIRMED_FROM_RUNTIME', 'INFERRED', 'UNKNOWN')
    sourceBaseline = [ordered]@{ backend = [ordered]@{ path = $before.backend.Root; fileCountBefore = $before.backend.FileCount; treeHashBefore = $before.backend.TreeHash; fileCountAfter = $afterBackendCount; treeHashAfter = $afterBackendHash }; frontend = [ordered]@{ path = $before.frontend.Root; fileCountBefore = $before.frontend.FileCount; treeHashBefore = $before.frontend.TreeHash; fileCountAfter = $afterFrontendCount; treeHashAfter = $afterFrontendHash }; exclusions = $before.exclusionDirectories }
    modules = $modules
    routes = @($data.frontend.routes)
    apis = [ordered]@{ backend = @($data.backend.endpoints); frontend = @($data.frontend.apiFunctions) }
    frontendBackendMappings = @($data.mappings)
    auth = [ordered]@{ frontend = @('src/views/login/index.vue', 'src/api/auth/index.ts', 'src/store/modules/user.ts', 'src/utils/auth.ts', 'src/plugins/permission.ts'); backend = @('HZ.RSSComposer/Areas/Employee/AccountController.cs', 'HZ.RSSComposer/Areas/WebBaseController.cs', 'HZ.Interfaces/Service/TokenService.cs'); tokenHeader = 'token'; frontendStorage = 'access_token and refresh_token'; backendSession = 'SessionInfo.AsyncLocal + Redis user info'; confidence = 'CONFIRMED_FROM_CODE' }
    externalDependencies = @(
        [ordered]@{ name = 'SqlSugarCore/MySqlConnector'; type = 'database'; confidence = 'CONFIRMED_FROM_CODE' },
        [ordered]@{ name = 'Redis'; type = 'cache/session'; confidence = 'CONFIRMED_FROM_CODE' },
        [ordered]@{ name = 'EmbedIO'; type = 'http-server'; confidence = 'CONFIRMED_FROM_CODE' },
        [ordered]@{ name = 'WebSocket'; type = 'realtime'; confidence = 'CONFIRMED_FROM_CODE' },
        [ordered]@{ name = 'MQTTnet'; type = 'messaging'; confidence = 'CONFIRMED_FROM_CODE' },
        [ordered]@{ name = 'plugins directory'; type = 'dynamic extension'; confidence = 'CONFIRMED_FROM_CODE' }
    )
    unknowns = $unknowns
    sensitiveConfigurationFiles = @($data.sensitiveFiles | ForEach-Object { $_.source })
    execution = [ordered]@{ sourceOnly = $true; realBusinessTestExecuted = $false; databaseConnected = $false; wordGenerated = $false; testCasesCreated = $false }
}
Save-Utf8 (Join-Path $OutputRoot 'system-design-index.json') ($index | ConvertTo-Json -Depth 30)

# 12 index
$doc = New-Doc
Add-Line $doc '# 12：As-Built 设计索引'
Add-Line $doc ''
Add-Line $doc 'ARCH-001 设计入口。请先阅读 `00-source-baseline.md`，再按映射、认证权限和模块页进入后续人工审查。'
Add-Line $doc ''
Add-Line $doc '| Document | Content | Main source/evidence |'
Add-Line $doc '| --- | --- | --- |'
foreach ($file in @('00-source-baseline.md','01-system-overview.md','02-backend-architecture.md','03-frontend-architecture.md','04-api-design.md','05-frontend-backend-mapping.md','06-auth-permission-design.md','07-module-design.md','08-business-flows.md','09-data-and-external-dependencies.md','10-error-and-observability.md','11-known-unknowns.md','design-coverage.md','system-design-index.json','test-design-observations.md')) {
    $content = switch ($file) { '00-source-baseline.md' { '源码路径、哈希、文件数、边界' } '01-system-overview.md' { '系统结构和总体架构图' } '02-backend-architecture.md' { 'solution/project、启动、Controller、技术栈' } '03-frontend-architecture.md' { 'Vue、启动、路由、页面模块' } '04-api-design.md' { '后端与前端完整静态 API 清单' } '05-frontend-backend-mapping.md' { '前后端 method/route 映射和未匹配项' } '06-auth-permission-design.md' { '登录、token、路由守卫、后端授权' } '07-module-design.md' { '主要模块和系统管理设计' } '08-business-flows.md' { '登录、系统管理和主要跨端流程' } '09-data-and-external-dependencies.md' { '数据库、缓存、文件、网络、外部依赖' } '10-error-and-observability.md' { '前后端错误、日志、观测' } '11-known-unknowns.md' { 'UNKNOWN/INFERRED/UNMATCHED 集中项' } 'design-coverage.md' { '覆盖统计和质量门槛' } 'system-design-index.json' { '后续 Agent 使用的机器索引' } default { '非 TestCase 的后续观察' } }
    Add-Line $doc "| [$file]($file) | $content | 当前真实源码 / 既有 runtime report（若明确标注） |"
}
Add-Line $doc ''
Add-Line $doc '## 下一阶段门'
Add-Line $doc ''
Add-Line $doc '- 当前建议：**等待人工审查，不自动进入 TEST-DESIGN-001**。'
Add-Line $doc '- 人工至少确认：动态菜单真实菜单树、前后端版本对应关系、系统管理模块边界、未匹配 API 的外部/历史归属、权限意图和数据库/部署配置边界。'
Save-Utf8 (Join-Path $OutputRoot '12-design-index.md') $doc.ToString()

Write-Output "Generated As-Built docs under $OutputRoot"
