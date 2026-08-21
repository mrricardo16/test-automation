from __future__ import annotations

import html
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOCX = ROOT / "projects" / "test-workflow" / "outputs" / "web-doc" / "RSS调度系统操作手册.docx"
TEMP = DOCX.with_suffix(".toc-patched.docx")


TOC_LINES = [
    "文档信息",
    "1. 文档说明",
    "2. 系统登录",
    "  LOGIN-01 打开登录页面",
    "  LOGIN-02 输入登录信息",
    "  LOGIN-03 单击登录",
    "  LOGIN-04 确认首页",
    "3. 系统管理",
    "  3.1 进入系统管理",
    "  3.2 用户管理",
    "  3.3 角色管理",
    "  3.4 菜单管理",
    "  3.5 字典管理",
    "  3.6 外部系统配置",
    "4. 常见操作说明与范围",
]


def main() -> None:
    with zipfile.ZipFile(DOCX, "r") as source, zipfile.ZipFile(TEMP, "w", zipfile.ZIP_DEFLATED) as target:
        replaced = False
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename == "word/document.xml":
                xml = data.decode("utf-8")
                old = "<w:t>(TOC will populate after updating fields)</w:t>"
                static = "<w:t>" + html.escape(TOC_LINES[0]) + "</w:t>" + "".join(f"<w:br/><w:t>{html.escape(line)}</w:t>" for line in TOC_LINES[1:])
                if old in xml:
                    xml = xml.replace(old, static, 1)
                    replaced = True
                data = xml.encode("utf-8")
            target.writestr(item, data)
    if not replaced:
        TEMP.unlink(missing_ok=True)
        raise SystemExit("TOC placeholder not found")
    TEMP.replace(DOCX)
    print(f"patched={DOCX}")


if __name__ == "__main__":
    main()
