#!/usr/bin/env python3
"""Hard-cut PCM/SAM/JSM identifiers in fieldwise-locker (no deprecated aliases)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2].parent / "fieldwise-locker"

# Order matters: longer / more specific first.
REPLACEMENTS = [
    (r"matchSamStoryCatalogIdsFromTextForFieldwise", "matchStoryCatalogIdsFromTextForFieldwise"),
    (r"matchSamStoryCatalogIdsFromText", "matchStoryCatalogIdsFromText"),
    (r"buildSamStoryCatalogMenu", "buildStoryCatalogMenu"),
    (r"SamStoryCatalogMenuV1", "StoryCatalogMenuV1"),
    (r"personaPcmFromSamEpisodeMount", "personaCharacterFromStoryEpisodeMount"),
    (r"personaMountIdFromSamMenuEpisode", "personaMountIdFromStoryMenuEpisode"),
    (r"samStoryPlanJourneyRowsFromMenuEpisodes", "storyPlanJourneyRowsFromMenuEpisodes"),
    (r"SamStoryPlanJourneyRowWire", "StoryPlanJourneyRowWire"),
    (r"samWireFocalPcmPersonaField", "storyWireFocalCharacterField"),
    (r"samWireFocalPcmPersonaArg", "storyWireFocalCharacterArg"),
    (r"samMenuEpisodeRefForTest", "storyMenuEpisodeRefForTest"),
    (r"SamMenuEpisodeWire", "StoryMenuEpisodeWire"),
    (r"resolveOrgSamEpisodeMounts", "resolveOrgStoryEpisodeMounts"),
    (r"ResolveOrgSamEpisodeMountsInput", "ResolveOrgStoryEpisodeMountsInput"),
    (r"ResolvedOrgSamEpisodeMounts", "ResolvedOrgStoryEpisodeMounts"),
    (r"resolveOrgSamEpisode\b", "resolveOrgStoryEpisode"),
    (r"ResolveOrgSamEpisodeInput", "ResolveOrgStoryEpisodeInput"),
    (r"ResolvedOrgSamEpisode\b", "ResolvedOrgStoryEpisode"),
    (r"compileOrgSamsForPublish", "compileOrgStoriesForPublish"),
    (r"compileSamStoryEpisodeBelievable", "compileStoryEpisodeBelievable"),
    (r"CompileSamStoryEpisodeBelievableInput", "CompileStoryEpisodeBelievableInput"),
    (r"CompileSamStoryEpisodeBelievableResult", "CompileStoryEpisodeBelievableResult"),
    (r"compileSamsForCatalog", "compileStoriesForCatalog"),
    (r"mountedPcmsFromLocker", "mountedCharactersFromLocker"),
    (r"orgPcmCatalogId", "orgCharacterCatalogId"),
    (r"orgPcmCatalogLabel", "orgCharacterCatalogLabel"),
    (r"orgPcmCatalogSegment", "orgCharacterCatalogSegment"),
    (r"pcmCatalogId", "characterCatalogId"),
    (r"pcmCatalogLabel", "characterCatalogLabel"),
    (r"pcmCatalogSegment", "characterCatalogSegment"),
    (r"orgAxmPcmPackIdFromPcmId", "orgAxmCharacterPackIdFromCharacterId"),
    (r"orgAxmSamPackIdFromSamId", "orgAxmStoryPackIdFromStoryId"),
    (r"orgAxmJsmPackIdFromJsmId", "orgAxmSituationsPackIdFromSituationsId"),
    (r"isOrgAxmPcmPackId", "isOrgAxmCharacterPackId"),
    (r"isOrgAxmSamPackId", "isOrgAxmStoryPackId"),
    (r"OrgAxmPcmPackBodyV1", "OrgAxmCharacterPackBodyV1"),
    (r"OrgAxmSamPackBodyV1", "OrgAxmStoryPackBodyV1"),
    (r"MOUNT_PCM_PACK_PREFIX", "MOUNT_CHARACTER_PACK_PREFIX"),
    (r"MOUNT_SAM_PACK_PREFIX", "MOUNT_STORY_PACK_PREFIX"),
    (r"MOUNT_JSM_PACK_PREFIX", "MOUNT_SITUATIONS_PACK_PREFIX"),
    (r"readOrgPcmForWho", "readOrgCharacterForWho"),
    (r"resolvePcmIdFromWho", "resolveCharacterIdFromWho"),
    (r"whoSpecifiesPcmInstance", "whoSpecifiesCharacterInstance"),
    (r"createPersonaStoryFromPcm", "createPersonaStoryFromCharacter"),
    (r"resolveProjectCharacterIdForOrgPcm", "resolveProjectCharacterIdForOrgCharacter"),
    (r"materializePcmStoryInstance", "materializeCharacterStoryInstance"),
    (r"refreshProjectStoryPcmWire", "refreshProjectStoryCharacterWire"),
    (r"refreshProjectStoryPcmOnLocker", "refreshProjectStoryCharacterOnLocker"),
    (r"readProjectStorySamId", "readProjectStoryNarrativeId"),
    (r"readProjectStorySamTemplate", "readProjectStoryNarrativeTemplate"),
    (r"readProjectStorySamTemplateSync", "readProjectStoryNarrativeTemplateSync"),
    (r"readProjectStorySamForRuntime", "readProjectStoryNarrativeForRuntime"),
    (r"samStoryMenuFromLocker", "storyCatalogMenuFromOrgLocker"),
    (r"touchpointGraphToSamWire", "touchpointGraphToStoryWire"),
    (r"OrgTouchpointSamWire", "OrgTouchpointStoryWire"),
    (r"SAMTouchpoint", "StoryTouchpoint"),
    (r"@doppler-group/twinfile-character/pcm", "@doppler-group/twinfile-character/persona"),
    (r"@doppler-group/twinfile-character/jsm", "@doppler-group/twinfile-character/situations"),
    (r"@doppler-group/twinfile-story/sam", "@doppler-group/twinfile-story/narrative"),
    (r"/mount-catalog/sam", "/mount-catalog/story"),
    (r"sam-persona-mount-wire", "story-persona-mount-wire"),
    (r"pcm-instance-contract", "character-instance-contract"),
    (r"pcm-character-scope", "character-scope"),
    (r"PcmMentalModels", "CharacterMentalModels"),
    (r"PcmThinkingStyles", "CharacterThinkingStyles"),
    (r"parse-pcm-story-instance-wire", "parse-character-story-instance-wire"),
    (r"pcm-instance-binding", "character-instance-binding"),
    (r"\bpcmById\b", "characterById"),
    (r"\bpersonaPcm\b", "focalCharacter"),
    (r"\bpcmIdFor", "characterIdFor"),
    (r"\bpcmId\b", "characterId"),
    (r"\bsamIds\b", "storyIds"),
    (r"\bsamId\b", "storyId"),
    (r"\bjsmIds\b", "situationsIds"),
    (r"\bjsmId\b", "situationsId"),
    (r"\bjsm\b", "situations"),
    (r'get\("samId"\)', 'get("storyId")'),
    (r'get\("sam"\)', 'get("story")'),
    (r'get\("pcm"\)', 'get("character")'),
]

SKIP_PATH_PARTS = {"node_modules", "dist", ".git"}

FILE_RENAMES = {
    "refresh-project-story-pcm-on-locker.ts": "refresh-project-story-character-on-locker.ts",
    "resolve-story-create-from-sam.ts": "resolve-story-create-from-narrative.ts",
    "resolve-sam-story-arc.ts": "resolve-story-arc.ts",
    "plan-story-episode-from-sam.ts": "plan-story-episode-from-narrative.ts",
    "map-sam-story-dimensions-to-create-body.ts": "map-story-dimensions-to-create-body.ts",
    "pcm-instance-contract.ts": "character-instance-contract.ts",
    "pcm-character-scope.ts": "character-scope.ts",
    "sam-persona-mount-wire.ts": "story-persona-mount-wire.ts",
    "refresh-project-story-pcm-wire.test.ts": "refresh-project-story-character-wire.test.ts",
    "refresh-project-story-pcm-on-locker.test.ts": "refresh-project-story-character-on-locker.test.ts",
}

DIR_RENAMES = [
    ("src/product/story/locker/pcm", "src/product/story/locker/character"),
    ("src/org/mount-catalog/sam", "src/org/mount-catalog/story"),
]


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(p in SKIP_PATH_PARTS for p in path.parts):
            continue
        if path.suffix in {".ts", ".tsx", ".md", ".json", ".yml", ".mjs"}:
            yield path


def main() -> None:
    for old, new in DIR_RENAMES:
        src = ROOT / old
        dst = ROOT / new
        if src.is_dir() and not dst.exists():
            src.rename(dst)
    for path in list(iter_files()):
        new_name = FILE_RENAMES.get(path.name)
        if new_name:
            dest = path.with_name(new_name)
            if not dest.exists():
                path.rename(dest)
    for path in iter_files():
        text = path.read_text(encoding="utf-8")
        orig = text
        for pat, repl in REPLACEMENTS:
            text = re.sub(pat, repl, text)
        if text != orig:
            path.write_text(text, encoding="utf-8")
    print("drop-pcm-sam-locker-hard: done")


if __name__ == "__main__":
    main()