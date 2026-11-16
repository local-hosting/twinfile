#!/usr/bin/env python3
"""Safe acronym drop for catalog-host (imports, JSON keys, typed fields only)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2].parent / "catalog-host"

REPLACEMENTS = [
    (r"@local-hosting/twinfile-character/pcm/browser", "@local-hosting/twinfile-character/persona/browser"),
    (r"@local-hosting/twinfile-character/pcm", "@local-hosting/twinfile-character/persona"),
    (r"@local-hosting/twinfile-character/jsm", "@local-hosting/twinfile-character/situations"),
    (r"@local-hosting/twinfile-story/sam/browser", "@local-hosting/twinfile-story/narrative/browser"),
    (r"@local-hosting/twinfile-story/sam", "@local-hosting/twinfile-story/narrative"),
    (r"\bpcmFromJSON\b", "characterFromJSON"),
    (r"\bpcmToJSON\b", "characterToJSON"),
    (r"\bsamFromJSON\b", "storyFromJSON"),
    (r"\bsamToJSON\b", "storyToJSON"),
    (r"\bjsmFromJSON\b", "situationsFromJSON"),
    (r"\bjsmToJSON\b", "situationsToJSON"),
    (r"\bPCM\b", "Character"),
    (r"\bSAM\b", "Story"),
    (r"\bJSM\b", "Situations"),
    (r"\bMountPcmBodyV1\b", "MountCharacterBodyV1"),
    (r"\bMountSamBodyV1\b", "MountStoryBodyV1"),
    (r"\bMountJsmBodyV1\b", "MountSituationsBodyV1"),
    (r"\bpcmId\b", "characterId"),
    (r"\bpcmIds\b", "characterIds"),
    (r"\bsamEpisodeId\b", "episodeId"),
    (r"\bsamEpisodeIds\b", "episodeIds"),
    (r"\bfocalPcmId\b", "focalCharacterId"),
    (r"\bfocalPcm\b", "focalCharacter"),
    (r"\bpcms\b", "characters"),
    (r"\bsams\b", "stories"),
    (r"\bjsm\b", "situations"),
    (r'"(pcm)"\s*:', '"character":'),
    (r"'pcm'\s*:", "'character':"),
    (r'"(sam)"\s*:', '"story":'),
    (r"'sam'\s*:", "'story':"),
    (r'"(jsm)"\s*:', '"situations":'),
    (r"'jsm'\s*:", "'situations':"),
    (r"product/story/locker/pcm/", "product/story/locker/character/"),
    (r"resolve-story-pcm-", "resolve-story-character-"),
    (r"read-project-story-sam-", "read-project-story-narrative-"),
    (r"resolve-story-create-from-sam", "resolve-story-create-from-narrative"),
]

FILE_RENAMES = {
    "resolve-story-create-from-sam.ts": "resolve-story-create-from-narrative.ts",
    "resolve-story-pcm-refresh-wire.ts": "resolve-story-character-refresh-wire.ts",
    "read-project-story-sam-template.ts": "read-project-story-narrative-template.ts",
}

DIR_RENAMES = [
    ("src/product/story/locker/pcm", "src/product/story/locker/character"),
]


def iter_paths():
    for path in ROOT.rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".md", ".json", ".yml"}:
            if "node_modules" not in path.parts:
                yield path


def main() -> None:
    for old, new in DIR_RENAMES:
        src = ROOT / old
        dst = ROOT / new
        if src.is_dir() and not dst.exists():
            src.rename(dst)
    for path in list(iter_paths()):
        new_name = FILE_RENAMES.get(path.name)
        if new_name:
            dest = path.with_name(new_name)
            if not dest.exists():
                path.rename(dest)
    for path in iter_paths():
        text = path.read_text(encoding="utf-8")
        orig = text
        for pat, repl in REPLACEMENTS:
            text = re.sub(pat, repl, text)
        if text != orig:
            path.write_text(text, encoding="utf-8")
    print("migrate-catalog-host-safe: done")


if __name__ == "__main__":
    main()