#!/usr/bin/env python3
"""Finish acronym drop in fieldwise-locker."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2].parent / "fieldwise-locker"

REPLACEMENTS = [
    (r"@doppler-group/twinfile-character/pcm/browser", "@doppler-group/twinfile-character/persona/browser"),
    (r"@doppler-group/twinfile-character/pcm", "@doppler-group/twinfile-character/persona"),
    (r"@doppler-group/twinfile-character/jsm", "@doppler-group/twinfile-context"),
    (r"@doppler-group/twinfile-story/sam/browser", "@doppler-group/twinfile-story/narrative/browser"),
    (r"@doppler-group/twinfile-story/sam", "@doppler-group/twinfile-story/narrative"),
    (r"\bpcmFromJSON\b", "characterFromJSON"),
    (r"\bpcmToJSON\b", "characterToJSON"),
    (r"\bsamFromJSON\b", "storyFromJSON"),
    (r"\bsamToJSON\b", "storyToJSON"),
    (r"\bjsmFromJSON\b", "situationsFromJSON"),
    (r"\bjsmToJSON\b", "situationsToJSON"),
    (r"\bMountPcmBodyV1\b", "MountCharacterBodyV1"),
    (r"\bMountSamBodyV1\b", "MountStoryBodyV1"),
    (r"\bMountJsmBodyV1\b", "MountSituationsBodyV1"),
    (r"\bpcmIds\b", "characterIds"),
    (r"\bpcmId\b", "characterId"),
    (r"\bsamEpisodeIds\b", "episodeIds"),
    (r"\bsamEpisodeId\b", "episodeId"),
    (r"\bfocalPcm\b", "focalCharacter"),
    (r"\bpcms\b", "characters"),
    (r"\bsams\b", "stories"),
    (r"\bpcm\b", "character"),
    (r"\bsam\b", "story"),
    (r"\bjsm\b", "situations"),
    (r'"jsm"\s*:', '"situations":'),
    (r"'jsm'\s*:", "'situations':"),
    (r"\bsamWireFocalPcmPersonaArg\b", "storyWireFocalCharacterPersonaArg"),
    (r"\bpersonaPcmFromSamEpisodeMount\b", "personaCharacterFromStoryEpisodeMount"),
    (r"resolve-story-create-from-sam", "resolve-story-create-from-narrative"),
    (r"/pcm/", "/persona/"),
    (r"/sam/", "/narrative/"),
    (r"/jsm/", "/situations/"),
    (r"product/story/locker/pcm", "product/story/locker/character"),
]

SKIP = re.compile(r"(sample-|narrativeple-)")


def walk() -> None:
    for path in ROOT.rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".md", ".json", ".yml"}:
            continue
        if "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        orig = text
        for pat, repl in REPLACEMENTS:
            text = re.sub(pat, repl, text)
        if text != orig:
            path.write_text(text, encoding="utf-8")


def rename_files() -> None:
    renames = {
        "resolve-story-create-from-sam.ts": "resolve-story-create-from-narrative.ts",
    }
    for path in list(ROOT.rglob("*")):
        new = renames.get(path.name)
        if new and path.is_file():
            dest = path.with_name(new)
            if not dest.exists():
                path.rename(dest)


def main() -> None:
    if not ROOT.exists():
        print("fieldwise-locker not found")
        return
    rename_files()
    walk()
    print("migrate-fieldwise-locker: done")


if __name__ == "__main__":
    main()