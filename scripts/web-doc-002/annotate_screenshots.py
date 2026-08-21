from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
MANUAL = ROOT / "projects" / "test-workflow" / "artifacts" / "web-doc" / "system-manual"
RAW = MANUAL / "raw"
ANNOTATED = MANUAL / "annotated"


def font(size: int):
    candidates = [
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def annotate(source: Path, target: Path, marks: list[tuple[int, int, int, int, str]]):
    image = Image.open(source).convert("RGBA")
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    label_font = font(22)
    for x1, y1, x2, y2, label in marks:
        draw.rounded_rectangle((x1, y1, x2, y2), radius=8, outline=(220, 38, 38, 235), width=4, fill=(220, 38, 38, 24))
        cx, cy = x1 + 18, y1 + 18
        draw.ellipse((cx - 16, cy - 16, cx + 16, cy + 16), fill=(220, 38, 38, 235), outline=(255, 255, 255, 240), width=2)
        bbox = draw.textbbox((0, 0), label, font=label_font)
        draw.text((cx - (bbox[2] - bbox[0]) / 2, cy - (bbox[3] - bbox[1]) / 2 - 2), label, font=label_font, fill=(255, 255, 255, 255))
    result = Image.alpha_composite(image, overlay).convert("RGB")
    target.parent.mkdir(parents=True, exist_ok=True)
    result.save(target, format="PNG", optimize=True)


MARKS = {
    "login/login-page.png": [(760, 120, 1210, 600, "1"), (800, 255, 1160, 325, "2"), (800, 345, 1160, 415, "3"), (800, 495, 1160, 565, "4")],
    "login/dashboard.png": [(10, 610, 220, 700, "1")],
    "system-management/entry.png": [(10, 340, 220, 710, "1")],
    "system-management/user/list.png": [(240, 170, 330, 215, "1"), (240, 218, 1090, 320, "2")],
    "system-management/user/add-dialog.png": [(560, 220, 760, 410, "1"), (735, 510, 840, 555, "2")],
    "system-management/user/role-assignment.png": [(240, 175, 845, 310, "1")],
    "system-management/role/list.png": [(240, 170, 330, 215, "1"), (550, 170, 835, 215, "2"), (240, 218, 1090, 320, "3")],
    "system-management/role/permissions.png": [(720, 0, 1275, 720, "1"), (1165, 665, 1260, 715, "2")],
    "system-management/menu/list.png": [(240, 110, 535, 360, "1"), (575, 170, 830, 615, "2")],
    "system-management/dict/item-list.png": [(240, 155, 535, 275, "1"), (545, 165, 1265, 265, "2")],
    "system-management/exsystem/list.png": [(240, 110, 900, 160, "1"), (240, 220, 1265, 370, "2")],
}


def main() -> None:
    missing = []
    for relative, marks in MARKS.items():
        source = RAW / relative
        target = ANNOTATED / relative
        if not source.exists():
            missing.append(str(source))
            continue
        annotate(source, target, marks)
    if missing:
        raise SystemExit("Missing screenshots:\n" + "\n".join(missing))
    print(f"annotated={len(MARKS)}")


if __name__ == "__main__":
    main()
