#!/usr/bin/env python3
"""Remove duplicate pre-rename files and finish identifier migration."""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
import importlib.util

_script = Path(__file__).parent / "migrate-drop-acronyms.py"
_spec = importlib.util.spec_from_file_location("migrate_drop_acronyms", _script)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader
_spec.loader.exec_module(_mod)

FILE_RENAMES = _mod.FILE_RENAMES
DIRS = _mod.DIRS
iter_files = _mod.iter_files

EXTRA = [
    (r"\bknownPcmIds\b", "knownCharacterIds"),
    (r"\bpcmById\b", "characterById"),
    (r"\bnormalizePcmAudiencePlane\b", "normalizeCharacterAudiencePlane"),
    (r"\bCompileSAMResult\b", "CompileStoryResult"),
    (r"\bLoadSAMResult\b", "LoadStoryResult"),
    (r"\bValidateSAMStoryArcResult\b", "ValidateStoryStoryArcResult"),
    (r"\bProjectStoryDimensionsFromSamInput\b", "ProjectStoryDimensionsFromStoryInput"),
    (r"\bmergeSamStoryDimensionsWithHost\b", "mergeStoryDimensionsWithHost"),
    (r"\bprojectStoryDimensionsFromSam\b", "projectStoryDimensionsFromStory"),
    (r"\bresolvePcmSubdir\b", "resolveCharacterSubdir"),
    (r"\bresolvePcmStrategyTopicRoot\b", "resolveCharacterStrategyTopicRoot"),
    (r"\bPCM_STRATEGY_TOPIC_MAP\b", "CHARACTER_STRATEGY_TOPIC_MAP"),
    (r"\bpartitionPcmSignalTopic\b", "partitionCharacterSignalTopic"),
    (r"\bpartitionPcmMentalModelTopic\b", "partitionCharacterMentalModelTopic"),
    (r"\bpartitionPcmJourneyTopic\b", "partitionCharacterJourneyTopic"),
    (r"\bloadPcmSegmentFacetFiles\b", "loadCharacterSegmentFacetFiles"),
    (r"\bparsePcmSegmentFacets\b", "parseCharacterSegmentFacets"),
    (r"\bpcmWithVariants\b", "characterWithVariants"),
    (r"__PCMSTR_0__", "'twinfile-character-'"),
    (r"join\(root, 'pcm\.yml'\)", "join(root, 'character.yml')"),
    (r'\b"pcm\.yml"\b', '"character.yml"'),
    (r"\bpcmYml\b", "characterYml"),
    (r"\bsam\.binding\b", "story.binding"),
    (r"`sam\.binding", "`story.binding"),
    (r"\binput\.sam\b", "input.story"),
    (r"\breturn \{ ok: true, sam:", "return { ok: true, story:"),
    (r"from '\./types/sam-character-context", "from './types/story-character-context"),
    (r"sam-character-context\.js", "story-character-context.js"),
    (r"from '\./types/sam\.js'", "from './types/story-narrative.js'"),
    (r"from '\./types/sam-spec\.js'", "from './types/story-narrative-spec.js'"),
    (r"from '\./types/sam-refs\.js'", "from './types/story-refs.js'"),
    (r"from '\./types/sam-journey\.js'", "from './types/story-narrative-journey.js'"),
    (r"sam\.schema\.js", "story-narrative.schema.js"),
    (r"compile-sam\.js", "compile-story-narrative.js"),
    (r"load-sam\.js", "load-story.js"),
    (r"validate-sam\.js", "validate-story-narrative.js"),
    (r"sam-document\.js", "story-document.js"),
    (r"sam-package-meta\.js", "story-package-meta.js"),
    (r"validate-sam-scenes\.js", "validate-story-scenes.js"),
    (r"validate-sam-narrative-coherence\.js", "validate-story-narrative-coherence.js"),
    (r"validate-sam-story-arc\.js", "validate-story-story-arc.js"),
    (r"resolve-sam-episode-for-pcm\.js", "resolve-story-episode-for-character.js"),
    (r"assemble-believable-episode-from-pcm\.js", "assemble-believable-episode-from-character.js"),
    (r"pcm-sam-story-run\.js", "character-story-run.js"),
    (r"sam-story-instance-document\.js", "story-instance-document.js"),
    (r"resolve-sam-story-instance\.js", "resolve-story-narrative-instance.js"),
    (r"resolve-journey-for-sam\.js", "resolve-journey-for-story.js"),
    (r"build-sam-story-catalog-menu\.js", "build-story-catalog-menu.js"),
    (r"resolve-sam-episode\.js", "resolve-story-episode.js"),
    (r"compile-sams-for-catalog\.js", "compile-stories-for-catalog.js"),
    (r"project-story-dimensions-from-sam\.js", "project-story-dimensions-from-story.js"),
    (r"merge-sam-story-dimensions-with-host\.js", "merge-story-dimensions-with-host.js"),
    (r"load-pcm\.js", "load-character.js"),
    (r"save-pcm\.js", "save-character.js"),
    (r"validate-pcm\.js", "validate-character.js"),
    (r"pcm-document\.js", "character-document.js"),
    (r"pcm-catalog-display\.js", "character-catalog-display.js"),
    (r"pcm-segment-topics\.js", "character-segment-topics.js"),
    (r"pcm-package-meta\.js", "character-package-meta.js"),
    (r"normalize-pcm-input\.js", "normalize-character-input.js"),
    (r"load-pcm-story-topics\.js", "load-character-story-topics.js"),
    (r"profiles-from-pcm\.js", "profiles-from-character.js"),
    (r"pcm-audience\.js", "character-audience.js"),
    (r"types/pcm\.js", "types/character.js"),
    (r"types/pcm-spec\.js", "types/character-spec.js"),
    (r"types/pcm-segment-facets\.js", "types/character-segment-facets.js"),
    (r"types/pcm-character\.js", "types/character-persona.js"),
    (r"story/pcm-story-instance\.js", "story/character-story-instance.js"),
    (r"story/pcm-instance-variation\.js", "story/character-instance-variation.js"),
    (r"audience/pcm-audience-plane\.js", "audience/character-audience-plane.js"),
]

# Identifier pass — skip path-like tokens
IDENT_SKIP = re.compile(
    r"(character\.yml|pcm\.yml|characterSpec|storySpec|sample-|narrativeple-)"
)


def ident_pass(text: str) -> str:
    def repl_pcm(m: re.Match[str]) -> str:
        start = max(0, m.start() - 40)
        chunk = text[start : m.end() + 20]
        if IDENT_SKIP.search(chunk):
            return m.group(0)
        return "character"

    def repl_sam(m: re.Match[str]) -> str:
        start = max(0, m.start() - 40)
        chunk = text[start : m.end() + 20]
        if IDENT_SKIP.search(chunk):
            return m.group(0)
        return "story"

    text = re.sub(r"\bpcm\b", repl_pcm, text)
    text = re.sub(r"\bsam\b", repl_sam, text)
    return text


def delete_stale_duplicates(base: Path) -> None:
    for old_name, new_name in FILE_RENAMES.items():
        old_path = None
        new_path = None
        for path in iter_files(base):
            if path.name == old_name:
                old_path = path
            if path.name == new_name:
                new_path = path
        if old_path and new_path and old_path.exists():
            old_path.unlink()


def remove_legacy_test_dirs() -> None:
    char = ROOT / "catalog/character/test"
    for legacy in ("pcm", "jsm"):
        d = char / legacy
        if d.exists():
            for root, dirs, files in os.walk(d, topdown=False):
                for f in files:
                    Path(root, f).unlink()
                for sub in dirs:
                    Path(root, sub).rmdir()
            d.rmdir()


def delete_stale_type_files() -> None:
    """Drop pre-rename type modules when renamed sibling exists."""
    pairs = [
        ("pcm.ts", "character.ts"),
        ("pcm-spec.ts", "character-spec.ts"),
        ("pcm-segment-facets.ts", "character-segment-facets.ts"),
        ("pcm-character.ts", "character-persona.ts"),
        ("sam.ts", "story-narrative.ts"),
        ("sam-spec.ts", "story-narrative-spec.ts"),
        ("sam-refs.ts", "story-refs.ts"),
        ("sam-journey.ts", "story-narrative-journey.ts"),
        ("sam-character-context.ts", "story-character-context.ts"),
        ("pcm-story-instance.ts", "character-story-instance.ts"),
        ("pcm-instance-variation.ts", "character-instance-variation.ts"),
        ("pcm-audience-plane.ts", "character-audience-plane.ts"),
    ]
    for old, new in pairs:
        for base in (ROOT / "catalog/character", ROOT / "catalog/story"):
            for path in base.rglob(old):
                if path.name == old:
                    alt = path.with_name(new)
                    if alt.exists():
                        path.unlink()


def migrate(text: str) -> str:
    for pattern, repl in EXTRA:
        text = re.sub(pattern, repl, text)
    return text


def main() -> None:
    for d in (ROOT / "catalog/character", ROOT / "catalog/story"):
        delete_stale_duplicates(d)
    delete_stale_type_files()
    remove_legacy_test_dirs()
    targets = [ROOT / "catalog/character", ROOT / "catalog/story", ROOT.parent / "fieldwise-locker"]
    for base in targets:
        if not base.exists():
            continue
        for path in iter_files(base):
            if path.suffix not in {".ts", ".tsx", ".md", ".yml", ".yaml"}:
                continue
            original = path.read_text(encoding="utf-8")
            updated = migrate(original)
            if path.suffix in {".ts", ".tsx"}:
                updated = ident_pass(updated)
            if updated != original:
                path.write_text(updated, encoding="utf-8")
    print("migrate-drop-acronyms-cleanup: done")


if __name__ == "__main__":
    main()