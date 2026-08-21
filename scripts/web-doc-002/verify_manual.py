from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANUAL_ROOT = ROOT / "projects" / "test-workflow" / "artifacts" / "web-doc" / "system-manual"
MANIFEST = MANUAL_ROOT / "manifest.json"
DOCX = ROOT / "projects" / "test-workflow" / "outputs" / "web-doc" / "RSS调度系统操作手册.docx"


def main() -> None:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert DOCX.exists() and DOCX.stat().st_size > 0, "DOCX missing or empty"
    steps = payload["steps"]
    all_images = {step["annotatedScreenshot"] for step in steps if step.get("annotatedScreenshot")}
    missing_images = [str(MANUAL_ROOT / image) for image in all_images if not (MANUAL_ROOT / image).exists()]
    assert not missing_images, "missing annotated screenshots: " + ", ".join(missing_images)

    with zipfile.ZipFile(DOCX) as package:
        names = set(package.namelist())
        assert "[Content_Types].xml" in names and "word/document.xml" in names, "invalid OpenXML package"
        media = sorted(name for name in names if name.startswith("word/media/"))
        document_xml = package.read("word/document.xml").decode("utf-8", "replace")
        text = re.sub(r"<[^>]+>", "", document_xml)
        for required in ("系统登录", "系统管理", "目录", "用户管理", "角色管理", "字典管理", "外部系统配置"):
            assert required in text, f"missing required text: {required}"
        forbidden_literals = ["123" + "456", "E:\\automated-testing", "D:\\HZ_RSS40"]
        forbidden_patterns = [r"Bearer\s+[A-Za-z0-9._~-]{12,}", r"(?i)(?:password|token|cookie|authorization)\s*[:=]\s*[^\s<]{6,}"]
        leaked = [value for value in forbidden_literals if value in document_xml]
        leaked.extend(pattern for pattern in forbidden_patterns if re.search(pattern, document_xml))
        assert not leaked, "forbidden value in DOCX XML: " + ", ".join(leaked)
        assert len(media) == len(all_images), f"media={len(media)} imagesInManifest={len(all_images)}"
        assert "TOC" in package.read("word/document.xml").decode("utf-8", "replace") or "内部导航" in text or "目录" in text

    status_counts = {}
    for step in steps:
        status_counts[step["executionStatus"]] = status_counts.get(step["executionStatus"], 0) + 1
    print(json.dumps({"docx": str(DOCX), "bytes": DOCX.stat().st_size, "embeddedImages": len(all_images), "statusCounts": status_counts, "requiredText": "PASS", "securityScan": "PASS"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
