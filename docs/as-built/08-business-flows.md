# 08：业务流程

## Login Flow

```mermaid
sequenceDiagram
    participant Browser as Login Page
    participant Store as user store
    participant Request as axios wrapper
    participant API as AccountController
    participant Session as TokenService / Redis
    Browser->>Store: handleLogin -> loginFormData
    Store->>Request: POST /Account/Login
    Request->>API: token header omitted or current token injected
    API->>Session: create/resolve user session (implementation path)
    API-->>Store: success + data.token
    Store->>Store: persist access/refresh token
    Store->>Request: GET /Account/Info
    Request->>API: token header
    API-->>Store: roles/perms/userInfo
    Browser->>Browser: router.replace("/")
    Browser->>Request: GET /Menu/GetMenuByPowerTree
    Request-->>Browser: dynamic menu routes
```

## System Management main flow

```mermaid
sequenceDiagram
    participant Page as System Management page
    participant Api as Frontend API module
    participant Server as EmbedIO /api
    participant Controller as Areas Controller
    participant Service as HZ.Interfaces Service
    participant Data as SqlSugar / Redis / external dependency
    Page->>Api: query or CRUD action
    Api->>Server: axios request with token header
    Server->>Controller: route dispatch
    Controller->>Controller: WebBaseController token pre-check when RequiresToken exists
    Controller->>Service: ServiceLocator.GetService<T>()
    Service->>Data: query/change data or external system
    Data-->>Service: result
    Service-->>Controller: ApiResult/model
    Controller-->>Api: JSON response
    Api-->>Page: success data or ElMessage error
```

## Other cross-system flows

- Map/Task/Car modules contain CRUD and dispatch-related routes; exact business semantics are documented only as source names and endpoint families where no explicit domain specification exists.
- `RSStarter.UseWebSocket()` starts a periodic push loop for dashboard vehicle-position data; this is a source-confirmed runtime path, not visually tested in ARCH-001.
- `UseEmbedIO()` also registers `/` routes for traffic/vehicle-facing `WebAPIContainer` and `WebAPIAgvInterface`; these are not assumed to be browser page APIs.
