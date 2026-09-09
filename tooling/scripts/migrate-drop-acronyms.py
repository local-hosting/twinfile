#!/usr/bin/env python3
"""Safer PCM/SAM/JSM migration — run from twinfile root."""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIRS = [
    ROOT / "catalog/character",
    ROOT / "catalog/story",
    ROOT / "packages",
    ROOT.parent / "catalog-host",
]

FILE_RENAMES = {
    "pcm.ts": "character.ts",
    "pcm-spec.ts": "character-spec.ts",
    "pcm-character.ts": "character-persona.ts",
    "pcm-segment-facets.ts": "character-segment-facets.ts",
    "pcm.schema.ts": "character.schema.ts",
    "pcm-character.schema.ts": "character-persona.schema.ts",
    "pcm-package-meta.ts": "character-package-meta.ts",
    "pcm-document.ts": "character-document.ts",
    "pcm-catalog-display.ts": "character-catalog-display.ts",
    "pcm-segment-topics.ts": "character-segment-topics.ts",
    "load-pcm.ts": "load-character.ts",
    "save-pcm.ts": "save-character.ts",
    "validate-pcm.ts": "validate-character.ts",
    "normalize-pcm-input.ts": "normalize-character-input.ts",
    "load-pcm-story-topics.ts": "load-character-story-topics.ts",
    "pcm-audience.ts": "character-audience.ts",
    "pcm-audience-plane.ts": "character-audience-plane.ts",
    "pcm-audience-plane.schema.ts": "character-audience-plane.schema.ts",
    "pcm-story-instance.ts": "character-story-instance.ts",
    "pcm-instance-variation.ts": "character-instance-variation.ts",
    "materialize-pcm-story-instance.ts": "materialize-character-story-instance.ts",
    "pcm-story-instance-document.ts": "character-story-instance-document.ts",
    "pcm-instance-rng.ts": "character-instance-rng.ts",
    "pcm-story-psychology.ts": "character-story-psychology.ts",
    "hydrate-pcm-signals-from-dimensions.ts": "hydrate-character-signals-from-dimensions.ts",
    "sample-pcm-demographic-bands.ts": "sample-character-demographic-bands.ts",
    "profiles-from-pcm.ts": "profiles-from-character.ts",
    "sam.ts": "story-narrative.ts",
    "sam-spec.ts": "story-narrative-spec.ts",
    "sam-refs.ts": "story-refs.ts",
    "sam-journey.ts": "story-narrative-journey.ts",
    "sam-character-context.ts": "story-character-context.ts",
    "sam.schema.ts": "story-narrative.schema.ts",
    "sam-document.ts": "story-document.ts",
    "sam-package-meta.ts": "story-package-meta.ts",
    "load-sam.ts": "load-story.ts",
    "validate-sam.ts": "validate-story-narrative.ts",
    "validate-sam-scenes.ts": "validate-story-scenes.ts",
    "validate-sam-associations.ts": "validate-story-associations.ts",
    "validate-sam-narrative-coherence.ts": "validate-story-narrative-coherence.ts",
    "validate-sam-touchpoint-places.ts": "validate-story-touchpoint-places.ts",
    "validate-sam-story-arc.ts": "validate-story-story-arc.ts",
    "compile-sam.ts": "compile-story-narrative.ts",
    "normalize-sam-input.ts": "normalize-story-input.ts",
    "normalize-sam-associations.ts": "normalize-story-associations.ts",
    "merge-sam-story-dimensions-with-host.ts": "merge-story-dimensions-with-host.ts",
    "project-story-dimensions-from-sam.ts": "project-story-dimensions-from-story.ts",
    "sam-story-instance-document.ts": "story-instance-document.ts",
    "pcm-sam-story-run.ts": "character-story-run.ts",
    "compile-sams-for-catalog.ts": "compile-stories-for-catalog.ts",
    "build-sam-story-catalog-menu.ts": "build-story-catalog-menu.ts",
    "resolve-sam-episode.ts": "resolve-story-episode.ts",
    "resolve-sam-episode-for-pcm.ts": "resolve-story-episode-for-character.ts",
    "resolve-sam-story-instance.ts": "resolve-story-narrative-instance.ts",
    "resolve-journey-for-sam.ts": "resolve-journey-for-story.ts",
    "assemble-believable-episode-from-pcm.ts": "assemble-believable-episode-from-character.ts",
    "story-jsm-narrative-context.ts": "story-situations-narrative-context.ts",
    "jsm-package-meta.ts": "situations-package-meta.ts",
    "storyboard-sam-fixture.ts": "storyboard-story-fixture.ts",
    "pcm-sam-story-run.test.ts": "character-story-run.test.ts",
}

DIR_RENAMES = [
    ("test/pcm", "test/persona"),
    ("test/jsm", "test/situations"),
    ("test/sam", "test/narrative"),
]

REPLACEMENTS = [
    (r"@local-hosting/twinfile-character/pcm/browser", "@local-hosting/twinfile-character/persona/browser"),
    (r"@local-hosting/twinfile-character/pcm/", "@local-hosting/twinfile-character/persona/"),
    (r"@local-hosting/twinfile-character/pcm\b", "@local-hosting/twinfile-character/persona"),
    (r"@local-hosting/twinfile-character/jsm/", "@local-hosting/twinfile-context/"),
    (r"@local-hosting/twinfile-character/jsm\b", "@local-hosting/twinfile-context"),
    (r"@local-hosting/twinfile-story/sam/browser", "@local-hosting/twinfile-story/narrative/browser"),
    (r"@local-hosting/twinfile-story/sam/", "@local-hosting/twinfile-story/narrative/"),
    (r"@local-hosting/twinfile-story/sam\b", "@local-hosting/twinfile-story/narrative"),
    (r"\bPCMDocument\b", "CharacterDocument"),
    (r"\bSAMDocument\b", "StoryDocument"),
    (r"\bPCMCharacter\b", "CharacterPersona"),
    (r"\bPCMSpecVersion\b", "CharacterSpecVersion"),
    (r"\bSAMSpecVersion\b", "StoryNarrativeSpecVersion"),
    (r"\bPCMEmpathy\b", "CharacterEmpathy"),
    (r"\bPCMExemplar\b", "CharacterExemplar"),
    (r"\bSAMCharacterRef\b", "StoryCharacterRef"),
    (r"\bSAMPlaceRef\b", "StoryPlaceRef"),
    (r"\bSAMBinding\b", "StoryBinding"),
    (r"\bSAMTouchpointCatalog\b", "StoryTouchpointCatalog"),
    (r"\bSAMTouchpointDefinition\b", "StoryTouchpointDefinition"),
    (r"\bSAMTouchpointLink\b", "StoryTouchpointLink"),
    (r"\bSAMTouchpointLocus\b", "StoryTouchpointLocus"),
    (r"\bSAMCharacterContext\b", "StoryCharacterContext"),
    (r"\bSAMPlaceMount\b", "StoryPlaceMount"),
    (r"\bSamJourneyContext\b", "StoryJourneyContext"),
    (r"\bSamStoryCatalogMenuV1\b", "StoryCatalogMenuV1"),
    (r"\bPcmAxmContribution\b", "CharacterAxmContribution"),
    (r"\bPcmJson\b", "CharacterJson"),
    (r"\bSamJson\b", "StoryJson"),
    (r"\bPcmSegmentFacets\b", "CharacterSegmentFacets"),
    (r"\bPcmSegmentStrategy\b", "CharacterSegmentStrategy"),
    (r"\bPcmStoryInstance\b", "CharacterStoryInstance"),
    (r"\bPcmInstanceCharacteristics\b", "CharacterInstanceCharacteristics"),
    (r"\bPcmInstanceVariationPolicy\b", "CharacterInstanceVariationPolicy"),
    (r"\bPcmStoryPsychology\b", "CharacterStoryPsychology"),
    (r"\bPcmStoryBeatContext\b", "CharacterStoryBeatContext"),
    (r"\bPcmAudiencePlane\b", "CharacterAudiencePlane"),
    (r"\bPcmAudienceAspectRef\b", "CharacterAudienceAspectRef"),
    (r"\bPcmAudienceAspectSource\b", "CharacterAudienceAspectSource"),
    (r"\bValidatePCMResult\b", "ValidateCharacterResult"),
    (r"\bValidateSAMScenesResult\b", "ValidateStoryScenesResult"),
    (r"\bLoadPCMResult\b", "LoadCharacterResult"),
    (r"\bCompileSAMInput\b", "CompileStoryInput"),
    (r"\bMaterializePcmStoryInstanceInput\b", "MaterializeCharacterStoryInstanceInput"),
    (r"\bPcmInstanceRandomSource\b", "CharacterInstanceRandomSource"),
    (r"\bPcmDocument\b", "CharacterBundle"),
    (r"\bSamDocument\b", "StoryBundle"),
    (r"\bPcmStoryInstanceDocument\b", "CharacterStoryInstanceDocument"),
    (r"\bSamStoryInstanceDocument\b", "StoryInstanceDocument"),
    (r"\bpcmToContribution\b", "characterToContribution"),
    (r"\bpcmToJSON\b", "characterToJSON"),
    (r"\bpcmFromJSON\b", "characterFromJSON"),
    (r"\bsamToJSON\b", "storyToJSON"),
    (r"\bsamFromJSON\b", "storyFromJSON"),
    (r"\bjsmToJSON\b", "situationsToJSON"),
    (r"\bjsmFromJSON\b", "situationsFromJSON"),
    (r"\bloadPCM\b", "loadCharacter"),
    (r"\bsavePCM\b", "saveCharacter"),
    (r"\bparsePCM\b", "parseCharacter"),
    (r"\bvalidatePCM\b", "validateCharacter"),
    (r"\bloadSAM\b", "loadStory"),
    (r"\bparseSAM\b", "parseStory"),
    (r"\bcompileSAM\b", "compileStory"),
    (r"\bvalidateSAM\b", "validateStoryNarrative"),
    (r"\bassertSupportedPCMSpec\b", "assertSupportedCharacterSpec"),
    (r"\bpcmSpecVersion\b", "characterSpecVersion"),
    (r"\bassertSupportedSAMSpec\b", "assertSupportedStoryNarrativeSpec"),
    (r"\bsamSpecVersion\b", "storyNarrativeSpecVersion"),
    (r"\bpcmCatalogId\b", "characterCatalogId"),
    (r"\bpcmCatalogLabel\b", "characterCatalogLabel"),
    (r"\bpcmCatalogSegment\b", "characterCatalogSegment"),
    (r"\bdemographicProfileFromPcm\b", "demographicProfileFromCharacter"),
    (r"\bpersonaProfileFromPcm\b", "personaProfileFromCharacter"),
    (r"\bpsychographicSegmentProfileFromPcm\b", "psychographicSegmentProfileFromCharacter"),
    (r"\bresolvePcmPersonaDisplayName\b", "resolveCharacterPersonaDisplayName"),
    (r"\bmaterializePcmStoryInstance\b", "materializeCharacterStoryInstance"),
    (r"\bpickPcmInstanceCharacteristics\b", "pickCharacterInstanceCharacteristics"),
    (r"\bhydratePcmSignalsFromDimensions\b", "hydrateCharacterSignalsFromDimensions"),
    (r"\bpsychologyFromPcmStoryInstance\b", "psychologyFromCharacterStoryInstance"),
    (r"\btemplateReplyFromPcmAtBeat\b", "templateReplyFromCharacterAtBeat"),
    (r"\bsegmentIdFromPcmPersonaSegment\b", "segmentIdFromCharacterPersonaSegment"),
    (r"\bcreatePcmInstanceChance\b", "createCharacterInstanceChance"),
    (r"\bpcmInstanceRandomFromChance\b", "characterInstanceRandomFromChance"),
    (r"\bresolvePcmInstanceRandom\b", "resolveCharacterInstanceRandom"),
    (r"\bresolvePcmDemographicPlane\b", "resolveCharacterDemographicPlane"),
    (r"\bsamplePcmDemographicBands\b", "sampleCharacterDemographicBands"),
    (r"\bdemographicPlaneFromPcmSignals\b", "demographicPlaneFromCharacterSignals"),
    (r"\bcompileSamsForCatalog\b", "compileStoriesForCatalog"),
    (r"\bbuildSamStoryCatalogMenu\b", "buildStoryCatalogMenu"),
    (r"\bresolveSamEpisode\b", "resolveStoryEpisode"),
    (r"\bresolveSamEpisodeForPcm\b", "resolveStoryEpisodeForCharacter"),
    (r"\bresolveSamStoryInstance\b", "resolveStoryNarrativeInstance"),
    (r"\bprojectStoryDimensionsFromSam\b", "projectStoryDimensionsFromNarrative"),
    (r"\bmergeSamStoryDimensionsWithHost\b", "mergeStoryDimensionsWithHost"),
    (r"\bassembleBelievableEpisodeFromPcm\b", "assembleBelievableEpisodeFromCharacter"),
    (r"\bbuildPcmSamStoryRun\b", "buildCharacterStoryRun"),
    (r"\bvalidateSAMScenes\b", "validateStoryScenes"),
    (r"\bvalidateSAMAssociations\b", "validateStoryAssociations"),
    (r"\bvalidateSAMNarrativeCoherence\b", "validateStoryNarrativeCoherence"),
    (r"\bvalidateSAMTouchpointPlaces\b", "validateStoryTouchpointPlaces"),
    (r"\bvalidateSAMStoryArc\b", "validateStoryStoryArc"),
    (r"\bnormalizeSAMInput\b", "normalizeStoryInput"),
    (r"\bnormalizeSAMAssociations\b", "normalizeStoryAssociations"),
    (r"\bresolveJourneyForSam\b", "resolveJourneyForStory"),
    (r"\bloadPcmSegmentFacetFiles\b", "loadCharacterSegmentFacetFiles"),
    (r"\bloadPcmStoryTopics\b", "loadCharacterStoryTopics"),
    (r"\bnormalizePCMInput\b", "normalizeCharacterInput"),
    (r"\bstoryboardSamFixture\b", "storyboardStoryFixture"),
    (r"\bfocalPcmId\b", "focalCharacterId"),
    (r"\bsamEpisodeId\b", "episodeId"),
    (r"\bpcmId\b", "characterId"),
    (r"\bpcmSpec\b", "characterSpec"),
    (r"\bsamSpec\b", "storySpec"),
    (r"\bMountPcmBodyV1\b", "MountCharacterBodyV1"),
    (r"\bMountSamBodyV1\b", "MountStoryBodyV1"),
    (r"\bMountJsmBodyV1\b", "MountSituationsBodyV1"),
    (r"\bPCMSchema\b", "CharacterSchema"),
    (r"\bSAMSchema\b", "StoryNarrativeSchema"),
    (r"\bPCM_PACKAGE\b", "CHARACTER_PACKAGE"),
    (r"\bSAM_PACKAGE\b", "STORY_NARRATIVE_PACKAGE"),
    (r"\bPCM_MENTAL_MODEL_SCOPE_FILE\b", "CHARACTER_MENTAL_MODEL_SCOPE_FILE"),
    (r"\bPCM_OBJECTIVES_FILE\b", "CHARACTER_OBJECTIVES_FILE"),
    (r"\bPCM_SEGMENT_FACET_FILES\b", "CHARACTER_SEGMENT_FACET_FILES"),
    (r"\bDEFAULT_PCM_INSTANCE_TRAIT_PICK_COUNT\b", "DEFAULT_CHARACTER_INSTANCE_TRAIT_PICK_COUNT"),
    (r"\bDEFAULT_PCM_INSTANCE_VARIATION\b", "DEFAULT_CHARACTER_INSTANCE_VARIATION"),
    (r'"(pcm)"\s*:', '"character":'),
    (r"'pcm'\s*:", "'character':"),
    (r'"(sam)"\s*:', '"story":'),
    (r"'sam'\s*:", "'story':"),
    (r'"(jsm)"\s*:', '"situations":'),
    (r"'jsm'\s*:", "'situations':"),
    (r"\bPCM\b", "Character"),
    (r"\bSAM\b", "Story"),
    (r"\bJSM\b", "Situations"),
]

EXT = {".ts", ".tsx", ".md", ".json", ".yml", ".yaml", ".mjs"}


def iter_files(base: Path):
    if not base.exists():
        return
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in {"node_modules", "dist", ".git"}]
        for name in filenames:
            if Path(name).suffix in EXT and not name.endswith(".d.ts.map"):
                yield Path(dirpath) / name


def rename_files(base: Path):
    for path in list(iter_files(base)):
        new_name = FILE_RENAMES.get(path.name)
        if new_name:
            dest = path.with_name(new_name)
            if not dest.exists():
                path.rename(dest)


def rename_dirs(base: Path):
    for old, new in DIR_RENAMES:
        src = base / old
        dst = base / new
        if src.exists() and not dst.exists():
            src.rename(dst)
def migrate_text(text: str) -> str:
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    return text


def main():
    story_root = ROOT / "catalog/story"
    char_root = ROOT / "catalog/character"
    if char_root.exists():
        rename_dirs(char_root)
    if story_root.exists():
        rename_dirs(story_root)
        yaml_old = story_root / "test/example/commute-run/sam.yml"
        yaml_new = story_root / "test/example/commute-run/story-narrative.yml"
        if yaml_old.exists() and not yaml_new.exists():
            yaml_old.rename(yaml_new)
    for d in DIRS:
        rename_files(d)
    for d in DIRS:
        for path in iter_files(d):
            original = path.read_text(encoding="utf-8")
            updated = migrate_text(original)
            if updated != original:
                path.write_text(updated, encoding="utf-8")
    print("migrate-drop-acronyms: done")


if __name__ == "__main__":
    main()