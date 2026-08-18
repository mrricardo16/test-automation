# Future Web Candidates

These candidates were identified from the real login/router/dashboard source and were not executed in Phase WEB-REAL-001.

| Candidate | Status | Boundary |
| --- | --- | --- |
| Invalid login | Not executed | Requires a separate negative-login TestCase |
| Required-field validation | Not executed | Requires empty username/password cases |
| Logout | Not executed | Requires a separate session cleanup and route-guard TestCase |
| Route guard | Not executed | Requires authenticated and unauthenticated route cases |
| Permission test | Not executed | Requires role/permission data and expected dynamic routes |
| Dashboard API error handling | Not executed | The current phase only observed and reported the real Dashboard page error |
