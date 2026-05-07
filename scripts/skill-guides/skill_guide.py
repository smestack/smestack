#!/usr/bin/env python3
"""
skill_guide.py — Genereer een visuele skill-installatie-guide vanuit JSON.

Usage:
    python3 skill_guide.py path/to/skill.json
    python3 skill_guide.py path/to/skill.json -o ../out.html

Vereist alleen Python 3.9+ uit de standaard-library. Geen pip install nodig.

Idee: één JSON per skill beschrijft de hele guide. Het script bakt daar een
zelfstandig HTML-bestand uit, met alle plaatjes als base64 ingesloten en alle
CSS inline. Plak het resultaat 1-op-1 in je website of gebruik 'm los.

Schema in het kort (zie skills/moneybird-payment-reminders/skill.json voor een
volledig voorbeeld):

{
  "lang": "nl",
  "title_tag": "<title>-tekst voor in de browser",
  "hero": {
    "estimated_time_label": "Klaar in ongeveer 5 minuten",
    "title": "...",
    "subtitle": "..."
  },
  "sections": [
    { "type": "section", "heading": "...", "paragraphs": ["..."],
      "card_items": ["..."], "callout": {...} },
    { "type": "flow", "nodes": [{"title": "...", "subtitle": "..."}, ...] },
    { "type": "step",  "number": 1, "title": "...", "paragraphs": ["..."],
      "ordered_list": ["..."], "screenshot": {...}, "callout": {...} },
    { "type": "faq", "heading": "...", "items": [{"q":"...","a":"..."}, ...] }
  ],
  "footer": "..."
}

Inline-syntax binnen tekst-velden (paragraphs/items/callout-body/...):
  **vet**            -> <strong>vet</strong>
  *cursief*          -> <em>cursief</em>
  `Pill`             -> <span class="mb-pill">Pill</span>   (UI-knop-stijl)
  Nieuwe regel       -> <br>
HTML-tags worden geescaped (veiligheid). Hierboven zijn de enige uitzonderingen.
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import mimetypes
import re
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Stylesheet — één plek om de huisstijl aan te passen.
# ---------------------------------------------------------------------------
STYLESHEET = r"""
.mb-guide-root {
  --mb-bg: #fafaf7;
  --mb-card: #ffffff;
  --mb-ink: #1a1a1a;
  --mb-ink-soft: #4a4a4a;
  --mb-muted: #777;
  --mb-line: #e7e4dc;
  --mb-accent: #2563eb;
  --mb-accent-soft: #dbeafe;
  --mb-warm: #f59e0b;
  --mb-warm-soft: #fef3c7;
  --mb-good: #16a34a;
  --mb-good-soft: #dcfce7;
  --mb-radius: 14px;
  --mb-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.05);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--mb-ink);
  background: var(--mb-bg);
  line-height: 1.65;
  font-size: 17px;
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 20px 80px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.mb-guide-root *,
.mb-guide-root *::before,
.mb-guide-root *::after { box-sizing: border-box; }

.mb-guide-root .mb-hero {
  background: linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%);
  border: 1px solid var(--mb-line);
  border-radius: var(--mb-radius);
  padding: 32px 28px;
  margin-bottom: 28px;
}
.mb-guide-root .mb-hero h1 { font-size: 28px; line-height: 1.25; margin: 0 0 10px; letter-spacing: -0.01em; }
.mb-guide-root .mb-hero p  { margin: 0; color: var(--mb-ink-soft); font-size: 17px; }
.mb-guide-root .mb-time {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--mb-card); border: 1px solid var(--mb-line);
  padding: 4px 12px; border-radius: 999px;
  font-size: 13px; font-weight: 600; color: var(--mb-ink-soft);
  margin-bottom: 14px;
}
.mb-guide-root .mb-time::before { content: "\23F1"; }

.mb-guide-root h2 { font-size: 22px; margin: 40px 0 14px; letter-spacing: -0.01em; }
.mb-guide-root h3 { font-size: 18px; margin: 22px 0 8px; }
.mb-guide-root p  { margin: 0 0 14px; color: var(--mb-ink-soft); }
.mb-guide-root strong { color: var(--mb-ink); font-weight: 600; }

.mb-guide-root .mb-card {
  background: var(--mb-card); border: 1px solid var(--mb-line);
  border-radius: var(--mb-radius); padding: 22px 24px; margin: 16px 0;
}
.mb-guide-root .mb-card ul { margin: 8px 0 0; padding-left: 22px; }
.mb-guide-root .mb-card li { margin-bottom: 6px; color: var(--mb-ink-soft); }

.mb-guide-root .mb-callout {
  border-radius: var(--mb-radius); padding: 16px 18px; margin: 16px 0;
  display: flex; gap: 12px; align-items: flex-start; border: 1px solid transparent;
}
.mb-guide-root .mb-callout .mb-icon {
  flex: 0 0 28px; width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: 15px; font-weight: 700; color: white;
}
.mb-guide-root .mb-callout p { margin: 0; }
.mb-guide-root .mb-callout p + p { margin-top: 6px; }
.mb-guide-root .mb-callout strong { display: block; margin-bottom: 4px; color: var(--mb-ink); }

.mb-guide-root .mb-callout--info { background: var(--mb-accent-soft); border-color: #bfdbfe; }
.mb-guide-root .mb-callout--info .mb-icon { background: var(--mb-accent); }
.mb-guide-root .mb-callout--warn { background: var(--mb-warm-soft); border-color: #fde68a; }
.mb-guide-root .mb-callout--warn .mb-icon { background: var(--mb-warm); }
.mb-guide-root .mb-callout--good { background: var(--mb-good-soft); border-color: #bbf7d0; }
.mb-guide-root .mb-callout--good .mb-icon { background: var(--mb-good); }

.mb-guide-root .mb-step {
  background: var(--mb-card); border: 1px solid var(--mb-line);
  border-radius: var(--mb-radius); padding: 24px 24px 28px;
  margin: 22px 0; box-shadow: var(--mb-shadow);
}
.mb-guide-root .mb-step-head { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.mb-guide-root .mb-step-num {
  flex: 0 0 44px; width: 44px; height: 44px; border-radius: 50%;
  background: var(--mb-accent); color: white;
  display: grid; place-items: center;
  font-weight: 700; font-size: 19px; letter-spacing: -0.02em;
}
.mb-guide-root .mb-step-title { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; }
.mb-guide-root .mb-step-body p { margin-bottom: 12px; }
.mb-guide-root .mb-step-body ol { margin: 8px 0 14px; padding-left: 22px; }
.mb-guide-root .mb-step-body ol li { margin-bottom: 6px; color: var(--mb-ink-soft); }

.mb-guide-root .mb-shot {
  margin: 14px 0 4px; border: 1px solid var(--mb-line);
  border-radius: 10px; overflow: hidden; background: #f3f4f6;
}
.mb-guide-root .mb-shot img { display: block; width: 100%; height: auto; }
.mb-guide-root .mb-shot-caption {
  font-size: 13px; color: var(--mb-muted);
  padding: 8px 12px; background: #fafaf7; border-top: 1px solid var(--mb-line);
}

.mb-guide-root .mb-pill {
  display: inline-block; padding: 1px 8px;
  background: var(--mb-card); border: 1px solid var(--mb-line);
  border-radius: 6px; font-size: 0.92em; font-weight: 600; color: var(--mb-ink);
}

.mb-guide-root .mb-flow { display: flex; flex-wrap: wrap; gap: 12px; align-items: stretch; margin: 18px 0 6px; }
.mb-guide-root .mb-flow-node {
  flex: 1 1 0; min-width: 140px;
  background: white; border: 1px solid var(--mb-line);
  border-radius: 12px; padding: 14px 16px; text-align: center;
  font-weight: 600; font-size: 14px;
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
}
.mb-guide-root .mb-flow-node small { display: block; font-weight: 500; color: var(--mb-muted); font-size: 12px; }
.mb-guide-root .mb-flow-arrow { align-self: center; font-size: 22px; color: var(--mb-muted); font-weight: 700; line-height: 1; }

.mb-guide-root details {
  background: white; border: 1px solid var(--mb-line);
  border-radius: 12px; padding: 14px 18px; margin-bottom: 10px;
}
.mb-guide-root details + details { margin-top: 10px; }
.mb-guide-root summary { font-weight: 600; cursor: pointer; color: var(--mb-ink); list-style: none; }
.mb-guide-root summary::-webkit-details-marker { display: none; }
.mb-guide-root summary::after { content: "+"; float: right; color: var(--mb-muted); font-weight: 400; transition: transform .15s; }
.mb-guide-root details[open] summary::after { content: "\2212"; }
.mb-guide-root details p { margin: 10px 0 0; }

.mb-guide-root .mb-foot {
  margin-top: 36px; padding-top: 20px; border-top: 1px solid var(--mb-line);
  font-size: 13px; color: var(--mb-muted);
}

@media (max-width: 540px) {
  .mb-guide-root { padding: 20px 14px 60px; font-size: 16px; }
  .mb-guide-root .mb-hero { padding: 24px 20px; }
  .mb-guide-root .mb-hero h1 { font-size: 24px; }
  .mb-guide-root .mb-step { padding: 20px 18px; }
  .mb-guide-root .mb-step-num { width: 38px; height: 38px; font-size: 17px; flex-basis: 38px; }
  .mb-guide-root .mb-step-title { font-size: 18px; }
  .mb-guide-root h2 { font-size: 20px; }
  .mb-guide-root .mb-flow-arrow { transform: rotate(90deg); }
}
"""

# ---------------------------------------------------------------------------
# Inline-tekstverwerking
# ---------------------------------------------------------------------------
_BOLD_RE   = re.compile(r"\*\*([^*]+?)\*\*")
_ITALIC_RE = re.compile(r"(?<!\*)\*([^*\s][^*]*?)\*(?!\*)")
_PILL_RE   = re.compile(r"`([^`]+?)`")


def render_inline(text: str) -> str:
    """Escape HTML, then expand a tiny markdown-like syntax."""
    safe = html.escape(text, quote=False)
    safe = _BOLD_RE.sub(r"<strong>\1</strong>", safe)
    safe = _ITALIC_RE.sub(r"<em>\1</em>", safe)
    safe = _PILL_RE.sub(r'<span class="mb-pill">\1</span>', safe)
    safe = safe.replace("\n", "<br>")
    return safe


# ---------------------------------------------------------------------------
# Validatie-helpers
# ---------------------------------------------------------------------------
class GuideError(Exception):
    pass


def require(obj: dict, key: str, where: str) -> Any:
    if key not in obj:
        raise GuideError(f"{where}: ontbrekend veld '{key}'")
    return obj[key]


def opt(obj: dict, key: str, default: Any = None) -> Any:
    return obj.get(key, default)


# ---------------------------------------------------------------------------
# Image embedding
# ---------------------------------------------------------------------------
def embed_image(src: str, base_dir: Path) -> str:
    """Resolve an image path relative to the JSON file and return a data URI."""
    if src.startswith("data:"):
        return src
    path = (base_dir / src).resolve()
    if not path.exists():
        raise GuideError(f"Schermafbeelding niet gevonden: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


# ---------------------------------------------------------------------------
# Component renderers
# ---------------------------------------------------------------------------
ICONS = {"info": "i", "warn": "!", "good": "&#10003;"}


def render_callout(callout: dict, where: str) -> str:
    kind = require(callout, "type", where)
    if kind not in ICONS:
        raise GuideError(f"{where}: callout type moet info/warn/good zijn (kreeg '{kind}').")
    title = opt(callout, "title")
    body = require(callout, "body", where)
    body_html = render_inline(body)
    inner = ""
    if title:
        inner += f"<strong>{html.escape(title)}</strong>"
    inner += f"<p>{body_html}</p>" if title else f"<p>{body_html}</p>"
    return (
        f'<div class="mb-callout mb-callout--{kind}">'
        f'<div class="mb-icon">{ICONS[kind]}</div>'
        f"<div>{inner}</div></div>"
    )


def render_screenshot(shot: dict, base_dir: Path, where: str) -> str:
    src = require(shot, "src", where)
    alt = opt(shot, "alt", "")
    caption = opt(shot, "caption")
    data_uri = embed_image(src, base_dir)
    out = f'<div class="mb-shot"><img src="{data_uri}" alt="{html.escape(alt)}">'
    if caption:
        out += f'<div class="mb-shot-caption">{render_inline(caption)}</div>'
    out += "</div>"
    return out


def render_hero(hero: dict) -> str:
    title = render_inline(require(hero, "title", "hero"))
    subtitle = render_inline(require(hero, "subtitle", "hero"))
    time_label = opt(hero, "estimated_time_label")
    pieces = ['<div class="mb-hero">']
    if time_label:
        pieces.append(f'<span class="mb-time">{html.escape(time_label)}</span>')
    pieces.append(f"<h1>{title}</h1><p>{subtitle}</p></div>")
    return "".join(pieces)


def render_section(section: dict, base_dir: Path) -> str:
    where = "section"
    parts: list[str] = []
    heading = opt(section, "heading")
    if heading:
        parts.append(f"<h2>{render_inline(heading)}</h2>")
    for para in opt(section, "paragraphs", []) or []:
        parts.append(f"<p>{render_inline(para)}</p>")
    if "callout" in section and section["callout"]:
        parts.append(render_callout(section["callout"], where + ".callout"))
    if "card_items" in section and section["card_items"]:
        items = "".join(f"<li>{render_inline(item)}</li>" for item in section["card_items"])
        parts.append(f'<div class="mb-card"><ul>{items}</ul></div>')
    return "".join(parts)


def render_flow(section: dict) -> str:
    nodes = require(section, "nodes", "flow")
    if not nodes:
        return ""
    pieces: list[str] = ['<div class="mb-flow">']
    for i, node in enumerate(nodes):
        title = render_inline(require(node, "title", f"flow.nodes[{i}]"))
        subtitle = opt(node, "subtitle")
        sub_html = f"<small>{render_inline(subtitle)}</small>" if subtitle else ""
        pieces.append(f'<div class="mb-flow-node">{title}{sub_html}</div>')
        if i < len(nodes) - 1:
            pieces.append('<div class="mb-flow-arrow">&rarr;</div>')
    pieces.append("</div>")
    return "".join(pieces)


def render_step(section: dict, base_dir: Path) -> str:
    number = require(section, "number", "step")
    title = render_inline(require(section, "title", "step"))
    parts: list[str] = [
        '<div class="mb-step">',
        f'<div class="mb-step-head"><div class="mb-step-num">{html.escape(str(number))}</div>'
        f'<div class="mb-step-title">{title}</div></div>',
        '<div class="mb-step-body">',
    ]
    for para in opt(section, "paragraphs", []) or []:
        parts.append(f"<p>{render_inline(para)}</p>")
    if "ordered_list" in section and section["ordered_list"]:
        items = "".join(f"<li>{render_inline(it)}</li>" for it in section["ordered_list"])
        parts.append(f"<ol>{items}</ol>")
    if "screenshot" in section and section["screenshot"]:
        parts.append(render_screenshot(section["screenshot"], base_dir, f"step {number} screenshot"))
    if "callout" in section and section["callout"]:
        parts.append(render_callout(section["callout"], f"step {number} callout"))
    parts.append("</div></div>")
    return "".join(parts)


def render_faq(section: dict) -> str:
    heading = opt(section, "heading", "Veelgestelde vragen")
    items = require(section, "items", "faq")
    pieces: list[str] = [f"<h2>{render_inline(heading)}</h2>"]
    for i, item in enumerate(items):
        q = require(item, "q", f"faq.items[{i}]")
        a = require(item, "a", f"faq.items[{i}]")
        pieces.append(
            f"<details><summary>{render_inline(q)}</summary>"
            f"<p>{render_inline(a)}</p></details>"
        )
    return "".join(pieces)


SECTION_RENDERERS = {
    "section": render_section,
    "flow": lambda sec, _bd: render_flow(sec),
    "step": render_step,
    "faq": lambda sec, _bd: render_faq(sec),
}


# ---------------------------------------------------------------------------
# Main render
# ---------------------------------------------------------------------------
def render_guide(data: dict, base_dir: Path) -> str:
    lang = opt(data, "lang", "nl")
    title_tag = opt(data, "title_tag", require(data["hero"], "title", "hero"))

    body_parts: list[str] = ['<div class="mb-guide-root">']
    body_parts.append(render_hero(require(data, "hero", "root")))

    for i, section in enumerate(opt(data, "sections", []) or []):
        kind = require(section, "type", f"sections[{i}]")
        if kind not in SECTION_RENDERERS:
            raise GuideError(
                f"sections[{i}].type onbekend: '{kind}'. "
                f"Mag zijn: {', '.join(sorted(SECTION_RENDERERS))}."
            )
        body_parts.append(SECTION_RENDERERS[kind](section, base_dir))

    footer = opt(data, "footer")
    if footer:
        body_parts.append(f'<div class="mb-foot">{render_inline(footer)}</div>')
    body_parts.append("</div>")

    return (
        f'<!DOCTYPE html>\n<html lang="{html.escape(lang)}"><head>'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        f"<title>{html.escape(title_tag)}</title>"
        f"<style>{STYLESHEET}</style></head><body>"
        + "".join(body_parts)
        + "</body></html>"
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("input", help="pad naar skill.json")
    parser.add_argument(
        "-o", "--output",
        help="pad naar output HTML. Standaard: ../<slug>.html naast skill_guide.py",
    )
    args = parser.parse_args(argv)

    in_path = Path(args.input).resolve()
    if not in_path.exists():
        print(f"Fout: bestand niet gevonden: {in_path}", file=sys.stderr)
        return 1

    try:
        data = json.loads(in_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Fout: ongeldige JSON in {in_path}: {e}", file=sys.stderr)
        return 1

    base_dir = in_path.parent
    try:
        html_out = render_guide(data, base_dir)
    except GuideError as e:
        print(f"Fout in skill-bestand: {e}", file=sys.stderr)
        return 1

    if args.output:
        out_path = Path(args.output).resolve()
    else:
        slug = opt(data, "slug") or in_path.stem
        out_path = Path(__file__).resolve().parent.parent / f"{slug}.html"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html_out, encoding="utf-8")
    print(f"Geschreven: {out_path}  ({out_path.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
