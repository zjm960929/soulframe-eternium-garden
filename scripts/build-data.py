#!/usr/bin/env python3
"""Build assets/data/game.js from the official localization table.

The weapon pools, prices and meeting weights mirror the Soulframe Wiki's
client-reverse-engineered modules (Module:ZenithShop, Module:Data/Vendors,
Module:MeetingRotationV2, Module:Data/Weather). Only names are localized here;
the calculation itself lives in assets/js/core.js.

Usage:
    python scripts/build-data.py [--tsv PATH] [--out PATH]
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT.parent
DEFAULT_TSV = WORKSPACE / "out" / "skill-cache" / "ee-localization" / "Soulframe_zh_en.tsv"

# Store order matters: the game shuffles these exact lists. Adding a weapon
# means inserting it at the same position the in-game shop uses.
ZENITH = {
    "caster": [
        "Seathorn", "Basker's Wrest", "Odiac", "Silistavf", "Gystalt", "The Erstroot",
    ],
    "ranged": [
        "Skílter", "Maestro", "Blitzel", "Avex",
    ],
    "melee": [
        "Goody's Edge", "Marrow's Bane", "Cenotaph", "Vetch", "Bog & Myrtle",
        "Igne Mora", "Dewelion", "The Royal Tines", "Loksprik", "Lyke-Wake",
        "Tessard", "Stultin", "Nurash", "Ilverac", "Falx", "Grimana", "Espadarte",
        "Nettle", "Virdigris", "Witan", "Grinn", "Rostrum", "Navalha", "Unsula",
        "Dhrullai", "Nazilk-Urytes-III", "Rivt-II", "Sollos-I", "Clivers",
        "Oryn-Umbr", "Duhk Halic", "Needleseye", "Rook", "Gathannan", "Creance",
        "Purity", "Farilwyd", "Wreath", "Fulkrom", "Veilk", "Orst-III",
        "Vrusht-IX", "Vasp-IV",
    ],
}

# Module:Data/Vendors -> Wares of Zenith -> Weapon rows, in Arcs.
PRICES = {
    "Avex": 240, "Basker's Wrest": 220, "Blitzel": 220, "Bog & Myrtle": 215,
    "Cenotaph": 250, "Clivers": 235, "Creance": 100, "Dewelion": 245,
    "Dhrullai": 145, "Duhk Halic": 220, "Espadarte": 245, "Falx": 220,
    "Farilwyd": 220, "Fulkrom": 240, "Gathannan": 230, "Goody's Edge": 145,
    "Grimana": 100, "Grinn": 165, "Gystalt": 220, "Igne Mora": 220,
    "Ilverac": 220, "Loksprik": 230, "Lyke-Wake": 215, "Maestro": 240,
    "Marrow's Bane": 250, "Navalha": 220, "Needleseye": 230, "Nettle": 125,
    "Nurash": 245, "Odiac": 220, "Orst-III": 220, "Oryn-Umbr": 135,
    "Purity": 240, "Rivt-II": 145, "Rook": 215, "Rostrum": 230, "Seathorn": 220,
    "Silistavf": 220, "Skílter": 120, "Sollos-I": 115, "Stultin": 235,
    "Tessard": 240, "The Erstroot": 220, "The Royal Tines": 215, "Unsula": 155,
    "Vasp-IV": 150, "Veilk": 150, "Vetch": 120, "Virdigris": 115,
    "Vrusht-IX": 230, "Witan": 175, "Wreath": 230,
}

# Character display names. Each zh value comes from a direct official entry:
#   Garren Rood   /SF/Language/Characters/GarrenRood
#   Bromius       /SF/Language/Pacts/BromiusName
#   Orengall      /SF/Language/Characters/Orengall
#   Dale Seer     /SF/Language/Characters/DaleSeer
#   Zenith        /SF/Language/Characters/Zenith
#   Tuvalkane     /SF/Language/Crafting/FoundryTitle
#   Verminia      /SF/Language/Characters/Verminia ("女巫维米尼娅")
#   Orlick        /SF/Language/Menu/Mailbox_SoulframeSender
# Verminia's display name is the personal-name part of that official string.
CHARACTERS = [
    ("Garren Rood", "加伦·鲁德"),
    ("Bromius", "布隆弥"),
    ("Orengall", "奥伦加"),
    ("Dale Seer", "先知戴尔"),
    ("Zenith", "泽尼斯"),
    ("Tuvalkane", "图瓦卡恩"),
    ("Verminia", "维米尼娅"),
    ("Orlick", "奥利克"),
]

MEETING_WEIGHTS = {
    "Garren Rood": 1.0,
    "Bromius": 1.0,
    "Orengall": 1.0,
    "Dale Seer": 0.40000001,
    "Zenith": 0.80000001,
    "Tuvalkane": 1.0,
    "Verminia": 1.0,
    "Orlick": 1.0,
}

PHASES = [
    {"id": "dawn", "en": "Dawn", "zh": "黎明",
     "messageEn": "Saphene Glows", "messageZh": "萨菲茵闪耀",
     "deityEn": "Saphene", "deityZh": "萨菲茵"},
    {"id": "noon", "en": "Noon", "zh": "正午",
     "messageEn": "Mora Rises", "messageZh": "莫拉升起",
     "deityEn": "Mora", "deityZh": "莫拉"},
    {"id": "nightfall", "en": "Nightfall", "zh": "夜幕",
     "messageEn": "Iridis Awakens", "messageZh": "伊瑞迪斯苏醒",
     "deityEn": "Iridis", "deityZh": "伊瑞迪斯"},
]

TIERS = {
    "clear": {"en": "Fair", "zh": "晴好"},
    "light": {"en": "Unsettled", "zh": "多变"},
    "moderate": {"en": "Blustery", "zh": "狂风"},
    "heavy": {"en": "Stormy", "zh": "风暴"},
}

WEATHER_TYPES = {
    "clear.0": {
        "en": "Clear Skies", "zh": "晴空", "tier": "clear", "icon": "sun", "effects": [],
    },
    "light.0": {
        "en": "Fresh Breeze", "zh": "清风", "tier": "light", "icon": "wind", "effects": [],
    },
    "light.1": {
        "en": "Thin Cloud", "zh": "薄云", "tier": "light", "icon": "cloud-sun", "effects": [],
    },
    "moderate.0": {
        "en": "Gale", "zh": "大风", "tier": "moderate", "icon": "wind", "effects": [],
    },
    "moderate.1": {
        "en": "Gathering Grey", "zh": "积云", "tier": "moderate", "icon": "cloudy",
        "effects": [],
    },
    "moderate.2": {
        "en": "Passing Showers", "zh": "阵雨", "tier": "moderate", "icon": "cloud-sun-rain",
        "effects": [
            {"id": "post_rain", "when": "after"},
            {"id": "rainbow", "when": "after", "chance": 0.2},
        ],
    },
    "heavy.0": {
        "en": "Downpour", "zh": "暴雨", "tier": "heavy", "icon": "cloud-rain-wind",
        "effects": [{"id": "post_rain", "when": "after"}],
    },
    "heavy.1": {
        "en": "Thunderstorm", "zh": "雷暴", "tier": "heavy", "icon": "cloud-lightning",
        "effects": [
            {"id": "lightning", "when": "during"},
            {"id": "post_rain", "when": "after"},
        ],
    },
}

WEATHER_EFFECTS = {
    "lightning": {"en": "Lightning Storm", "zh": "雷暴"},
    "post_rain": {"en": "After the Rain", "zh": "雨后"},
    "rainbow": {"en": "Rainbow", "zh": "彩虹"},
}


def read_tsv(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise SystemExit(f"Localization table not found: {path}")
    csv.field_size_limit(10_000_000)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t", quoting=csv.QUOTE_NONE))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tsv", type=Path, default=DEFAULT_TSV)
    parser.add_argument("--out", type=Path, default=PROJECT / "assets" / "data" / "game.js")
    args = parser.parse_args()

    rows = read_tsv(args.tsv)

    # English weapon name -> official zh, restricted to Soulframe entries.
    weapon_names: dict[str, str] = {}
    for row in rows:
        key = row.get("key") or ""
        if not key.startswith("/SF/") or not key.endswith("WeaponName"):
            continue
        en = (row.get("en") or "").strip()
        zh = (row.get("zh") or "").strip()
        if en and zh and en not in weapon_names:
            weapon_names[en] = zh

    missing: list[str] = []
    weapons: dict[str, dict[str, object]] = {}
    for slot in ("caster", "ranged", "melee"):
        for name in ZENITH[slot]:
            zh = weapon_names.get(name)
            if not zh:
                missing.append(name)
            weapons[name] = {
                "zh": zh or None,
                "price": PRICES.get(name),
                "slot": slot,
            }

    # Sanity checks: every pool entry should be priced and listed exactly once.
    # Nazilk-Urytes-III is in the game's pool but has no row in the wiki's
    # Wares of Zenith price table yet; the UI shows "—" for it rather than
    # inventing a price.
    unpriced = {"Nazilk-Urytes-III"}
    priced = set(PRICES)
    pooled = set(weapons)
    if priced != pooled - unpriced:
        raise SystemExit(
            "Price/pool mismatch: missing prices=%s, extra prices=%s"
            % (sorted(pooled - priced - unpriced), sorted(priced - pooled))
        )

    data = {
        "_meta": {
            "source": "Soulframe wiki.avakot.org client-reverse-engineered modules",
            "localization": "ee-localization Soulframe_zh_en.tsv",
            "generated": "scripts/build-data.py",
        },
        "zenith": ZENITH,
        "weapons": weapons,
        "characters": {en: {"zh": zh} for en, zh in CHARACTERS},
        "meeting": {
            "order": [en for en, _ in CHARACTERS],
            "weights": MEETING_WEIGHTS,
            "anchor": "2026-07-23",
        },
        "phases": PHASES,
        "weather": {
            "tiers": TIERS,
            "types": WEATHER_TYPES,
            "effects": WEATHER_EFFECTS,
        },
    }

    text = (
        "/* Generated by scripts/build-data.py -- do not edit by hand.\n"
        " * Names: official Soulframe zh-CN localization (ee-localization).\n"
        " * Pools, prices and weights: Soulframe Wiki client-reverse-engineered modules.\n"
        " */\n"
        "(function (root) {\n"
        "  'use strict';\n"
        "  var DATA = "
        + json.dumps(data, ensure_ascii=False, indent=2)
        + ";\n"
        "  if (typeof module === 'object' && module.exports) module.exports = DATA;\n"
        "  else root.SFData = DATA;\n"
        "}(typeof globalThis !== 'undefined' ? globalThis : this));\n"
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text, encoding="utf-8")

    print(f"wrote {args.out}")
    print(f"weapons: {len(weapons)} (priced: {len(priced)})")
    if missing:
        print("missing localization: " + ", ".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
