#!/usr/bin/env python3
"""
Собирает единый HTML-файл из index.html + styles.css + script.js.
Результат можно открыть двойным кликом или перетащить в браузер.

Использование:
    python3 build.py
"""

import re
from pathlib import Path

DIR = Path(__file__).resolve().parent
OUTPUT = DIR / "invitation.html"


def main() -> None:
    html = (DIR / "index.html").read_text(encoding="utf-8")
    css = (DIR / "styles.css").read_text(encoding="utf-8")
    js = (DIR / "runner.js").read_text(encoding="utf-8") + "\n" + (DIR / "script.js").read_text(encoding="utf-8")

    html = re.sub(
        r'<link rel="stylesheet" href="styles\.css">\s*',
        f"<style>\n{css}\n</style>\n",
        html,
        count=1,
    )

    html = re.sub(
        r'<script src="runner\.js"></script>\s*<script src="script\.js"></script>\s*',
        f"<script>\n{js}\n</script>\n",
        html,
        count=1,
    )

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"✓ Собрано: {OUTPUT}")
    print("  Откройте invitation.html в браузере (двойной клик или перетащите файл).")


if __name__ == "__main__":
    main()
