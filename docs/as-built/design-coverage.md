# ARCH-001 设计覆盖统计

| Metric | Count | Coverage interpretation |
| --- | ---: | --- |
| Backend Projects | 12 | Current filtered source scan |
| Controllers | 33 | All controller candidates identified by scanner and listed in backend architecture |
| Backend APIs | 164 | All route attributes captured by scanner in current scope |
| Frontend Routes | 14 | Static routes plus one dynamic-menu design record; runtime menu paths remain UNKNOWN |
| Frontend API functions | 252 | API source files, comments excluded |
| Matched APIs | 136 | Exact method + route match |
| Unmatched Frontend APIs | 116 | No exact backend route; not a defect conclusion |
| Unmatched Backend APIs | 44 | No exact frontend static usage; not a defect conclusion |
| Business modules | 15 | Frontend view-level modules; module boundaries partly inferred |
| UNKNOWN items | 166 | Consolidated unknown categories plus unmatched records |
| INFERRED items | 5 | Explicit inferred design observations |

## Quality gates

- Backend Controller coverage：Yes（当前扫描范围内全部进入清单）。
- Backend API coverage：Yes（当前 route attribute 扫描范围内全部进入清单）。
- Frontend static route coverage：Yes；runtime dynamic menu values：UNKNOWN。
- Frontend API mapping status：Yes，每条有 `CONFIRMED` 或 `UNMATCHED`。
- Every UNKNOWN/INFERRED：Yes，集中记录于 `11-known-unknowns.md` 或对应章节。
- Runtime/visual acceptance：No，本阶段禁止执行。
