from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "projects" / "test-workflow" / "artifacts" / "web-doc" / "system-manual" / "manifest.json"


def shot(path: str) -> str:
    return f"annotated/{path}"


def entry(chapter: str, feature: str, step_id: str, title: str, action: str, expected: str, screenshot: str | None, case_id: str, status: str = "PASS"):
    return {
        "chapter": chapter,
        "feature": feature,
        "stepId": step_id,
        "title": title,
        "action": action,
        "expectedResult": expected,
        "rawScreenshot": f"raw/{screenshot}" if screenshot else None,
        "annotatedScreenshot": shot(screenshot) if screenshot else None,
        "sourceTestCase": case_id,
        "executionStatus": status,
    }


def main() -> None:
    coverage = [
        {"feature": "系统登录", "testCase": "TC-WEB-LOGIN-001", "title": "真实登录进入首页", "status": "PASS", "coveredOperation": "打开登录页、输入登录信息、登录、进入首页", "existingScreenshot": "projects/test-workflow/artifacts/web-real-001/login-page.png; dashboard-after-login.png", "reusableForManual": True},
        {"feature": "进入系统管理", "testCase": "TC-SM-ENV-001", "title": "环境与登录", "status": "PASS", "coveredOperation": "进入系统管理并打开用户管理", "existingScreenshot": "TC-SM-ENV-001/result.png", "reusableForManual": True},
        {"feature": "用户管理", "testCase": "TC-SM-USER-001/002/003/004/005", "title": "查询、新增、编辑、删除、指定用户角色", "status": "PASS", "coveredOperation": "用户管理核心操作及角色关联", "existingScreenshot": "TC-SM-USER-001/002/003/004/005", "reusableForManual": True},
        {"feature": "角色管理", "testCase": "TC-SM-ROLE-001/002/003/004", "title": "新增、编辑、权限分配、删除角色", "status": "PASS", "coveredOperation": "角色生命周期和角色权限分配", "existingScreenshot": "TC-SM-ROLE-001/002/003/004", "reusableForManual": True},
        {"feature": "菜单管理", "testCase": "TC-SM-MENU-001/002/003/004/005", "title": "新增、编辑、查询、删除菜单", "status": "PASS", "coveredOperation": "菜单维护和删除后复核", "existingScreenshot": "TC-SM-MENU-001/002/003/004/005", "reusableForManual": True},
        {"feature": "字典管理", "testCase": "TC-SM-DICT-001/001-ITEM/002/003-RETRY", "title": "新增、修改、选择字典节点后查看", "status": "PASS", "coveredOperation": "字典类型、字典子项和查询复核", "existingScreenshot": "TC-SM-DICT-001/001-ITEM/002/003-RETRY", "reusableForManual": True},
        {"feature": "外部系统配置", "testCase": "TC-SM-EXSYS-001/002/003/004", "title": "新增、编辑、查询、删除外部系统配置", "status": "PASS", "coveredOperation": "外部系统配置维护", "existingScreenshot": "TC-SM-EXSYS-001/002/003/004", "reusableForManual": True},
        {"feature": "字典子项删除", "testCase": "TC-SM-DICT-004", "title": "删除字典子项", "status": "FAIL", "coveredOperation": "页面提示系统类型不可删除", "existingScreenshot": "TC-SM-DICT-004/result.png", "reusableForManual": False},
        {"feature": "部门管理、参数配置、日志管理", "testCase": "未找到合格 PASS", "title": "未纳入本阶段", "status": "SKIPPED", "coveredOperation": "源码存在但没有本阶段合格执行证据", "existingScreenshot": None, "reusableForManual": False},
    ]

    steps = [
        entry("系统登录", "打开登录页面", "LOGIN-01", "打开登录页面", "使用浏览器访问系统地址。", "显示“RSS调度系统”登录页面，并出现用户名、用户密码和“登 录”按钮。", "login/login-page.png", "TC-WEB-LOGIN-001"),
        entry("系统登录", "输入登录信息", "LOGIN-02", "输入登录信息", "在用户名和用户密码输入框中填写已分配的登录信息。", "输入框接受内容；密码以掩码形式显示。", "login/login-page.png", "TC-WEB-LOGIN-001"),
        entry("系统登录", "登录", "LOGIN-03", "单击登录", "单击“登 录”按钮。", "系统完成登录并进入首页。", "login/login-page.png", "TC-WEB-LOGIN-001"),
        entry("系统登录", "进入首页", "LOGIN-04", "确认首页", "查看登录后的首页内容。", "显示“调度总览”首页和系统导航。", "login/dashboard.png", "TC-WEB-LOGIN-001"),
        entry("系统管理", "进入系统管理", "SM-ENTRY-01", "打开系统管理", "在导航中展开“系统管理”，再选择需要维护的子菜单。", "系统管理子菜单展开，显示用户管理、角色管理、菜单管理、字典管理和外部系统配置。", "system-management/entry.png", "TC-SM-ENV-001"),
        entry("系统管理", "用户管理", "SM-USER-01", "查看用户列表", "进入“用户管理”，可按登录名或用户名输入条件并单击“搜索”。", "列表显示符合条件的用户和启用状态。", "system-management/user/list.png", "TC-SM-USER-001"),
        entry("系统管理", "用户管理", "SM-USER-02", "新增用户", "单击“新增”，填写登录名、用户名、密码、确认密码，确认“是否启用”后单击“确定”。", "用户保存成功并出现在用户列表中。", "system-management/user/add-dialog.png", "TC-SM-USER-002"),
        entry("系统管理", "用户管理", "SM-USER-03", "编辑用户", "勾选目标用户，单击“修改”，调整需要维护的字段后单击“确定”。", "用户信息保存成功，列表仍显示该用户。", "system-management/user/list.png", "TC-SM-USER-003"),
        entry("系统管理", "用户管理", "SM-USER-04", "删除用户", "勾选目标用户，单击“删除”，在确认提示中确认操作。", "用户从列表移除。执行前请确认目标对象。", "system-management/user/list.png", "TC-SM-USER-004"),
        entry("系统管理", "用户管理", "SM-USER-05", "指定用户角色", "勾选目标用户，单击“指定用户角色”，选择角色后保存。", "用户角色区域显示已关联的角色。", "system-management/user/role-assignment.png", "TC-SM-USER-005"),
        entry("系统管理", "角色管理", "SM-ROLE-01", "查看角色列表", "进入“角色管理”，可按角色编码或角色名称查询。", "列表显示角色编码、角色名称、角色描述和创建时间。", "system-management/role/list.png", "TC-SM-ROLE-001"),
        entry("系统管理", "角色管理", "SM-ROLE-02", "新增角色", "单击“新增”，填写角色编码、角色名称和角色描述后保存。", "角色保存成功并出现在角色列表中。", "system-management/role/list.png", "TC-SM-ROLE-001"),
        entry("系统管理", "角色管理", "SM-ROLE-03", "编辑角色", "勾选目标角色，单击“修改”，调整角色信息后保存。", "角色信息保存成功。", "system-management/role/list.png", "TC-SM-ROLE-002"),
        entry("系统管理", "角色管理", "SM-ROLE-04", "分配角色权限", "勾选目标角色，单击“角色权限分配”，按需要勾选权限并单击“确定”。", "权限对话框关闭，角色权限保存成功。", "system-management/role/permissions.png", "TC-SM-ROLE-003"),
        entry("系统管理", "角色管理", "SM-ROLE-05", "删除角色", "勾选目标角色，单击“删除”，在确认提示中确认操作。", "角色从列表移除。执行前请确认目标对象。", "system-management/role/list.png", "TC-SM-ROLE-004"),
        entry("系统管理", "菜单管理", "SM-MENU-01", "维护菜单", "进入“菜单管理”，使用“新增”“修改”“删除”按钮维护菜单树及菜单表单；保存时填写必要字段。", "菜单树和菜单表单显示当前维护对象，保存后出现成功提示。", "system-management/menu/list.png", "TC-SM-MENU-001"),
        entry("系统管理", "菜单管理", "SM-MENU-02", "查询菜单", "刷新页面或在菜单树中展开节点，定位目标菜单。", "菜单树显示目标节点，页面可继续进行编辑或删除。", "system-management/menu/list.png", "TC-SM-MENU-003"),
        entry("系统管理", "菜单管理", "SM-MENU-03", "删除菜单", "选中目标菜单，单击“删除”，在确认提示中确认操作。", "菜单节点移除；刷新后不再出现在菜单树和导航中。执行前请确认目标对象。", "system-management/menu/list.png", "TC-SM-MENU-004"),
        entry("系统管理", "字典管理", "SM-DICT-01", "新增字典类型", "进入“字典管理”，单击“新增”，填写字典名称、字典编码和排序后保存。", "字典类型出现在左侧字典树中。", "system-management/dict/item-list.png", "TC-SM-DICT-001"),
        entry("系统管理", "字典管理", "SM-DICT-02", "新增字典子项", "选中字典类型，单击“新增”，填写字典子项的必要信息后保存。", "右侧列表显示新增字典子项。", "system-management/dict/item-list.png", "TC-SM-DICT-001-ITEM"),
        entry("系统管理", "字典管理", "SM-DICT-03", "修改字典子项", "选中字典子项，单击“修改”，调整排序等信息后保存。", "字典子项仍存在，修改后的排序信息生效。", "system-management/dict/item-list.png", "TC-SM-DICT-002"),
        entry("系统管理", "字典管理", "SM-DICT-04", "查看字典子项", "刷新后先在左侧选择目标字典节点，再查看右侧列表。", "右侧显示该字典节点下的字典子项。", "system-management/dict/item-list.png", "TC-SM-DICT-003-RETRY"),
        entry("系统管理", "外部系统配置", "SM-EXSYS-01", "查看配置列表", "进入“外部系统配置”，可按系统编码或系统名称查询。", "列表显示符合条件的系统配置。", "system-management/exsystem/list.png", "TC-SM-EXSYS-003"),
        entry("系统管理", "外部系统配置", "SM-EXSYS-02", "新增配置", "单击“新增”，填写系统编码、系统名称、第三方 URL 和路由等必要字段后保存。", "配置保存成功并出现在列表中。", "system-management/exsystem/list.png", "TC-SM-EXSYS-001"),
        entry("系统管理", "外部系统配置", "SM-EXSYS-03", "编辑配置", "勾选目标配置，单击“修改”，调整地址或路由后保存。", "配置保留并显示修改后的内容。", "system-management/exsystem/list.png", "TC-SM-EXSYS-002"),
        entry("系统管理", "外部系统配置", "SM-EXSYS-04", "删除配置", "勾选目标配置，单击“删除”，在确认提示中确认操作。", "配置从列表移除。执行前请确认目标对象。", "system-management/exsystem/list.png", "TC-SM-EXSYS-004"),
    ]

    payload = {
        "documentTitle": "RSS调度系统操作手册",
        "documentVersion": "v1.0",
        "generatedDate": "2026年8月18日",
        "sourceRuntime": "当前真实 Web 测试环境",
        "coverage": coverage,
        "excludedFromManual": [
            {"feature": "字典子项删除", "reason": "已有真实页面结果为失败，页面提示“系统类型不可删除”，未写入正式操作步骤。"},
            {"feature": "部门管理、参数配置、日志管理等", "reason": "源码可见但本阶段没有合格的真实 PASS 测试证据，留待后续文档候选。"},
            {"feature": "登录失败、退出、密码重置、导入导出", "reason": "现有测试未覆盖或未形成可复用的合格操作证据。"},
        ],
        "steps": steps,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifest={OUTPUT}; steps={len(steps)}; coverage={len(coverage)}")


if __name__ == "__main__":
    main()
