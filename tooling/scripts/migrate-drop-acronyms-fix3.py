#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASES = [ROOT / "catalog/character", ROOT / "catalog/story", ROOT.parent / "fieldwise-locker"]

FIXES = [
    (r"from '\.\./types/story\.js'", "from '../types/story-narrative.js'"),
    (r"from '\.\./\.\./types/story\.js'", "from '../../types/story-narrative.js'"),
    (r"from '\.\./\.\./\.\./src/contract/narrative/types/story\.js'", "from '../../../src/contract/narrative/types/story-narrative.js'"),
    (r"from '\.\./\.\./types/story-journey\.js'", "from '../../types/story-narrative-journey.js'"),
    (r"story-jsm-narrative-context", "story-situations-narrative-context"),
    (r"buildStoryJsmNarrativeContext", "buildStorySituationsNarrativeContext"),
    (r"StoryJsmNarrativeContextV1", "StorySituationsNarrativeContextV1"),
    (r"StoryJsmJobNarrativeV1", "StorySituationsJobNarrativeV1"),
    (r"character-character\.schema", "character-persona.schema"),
    (r"\bPCM_SPEC_VERSION\b", "CHARACTER_SPEC_VERSION"),
    (r"\bPcmAudienceAspectRefSchema\b", "CharacterAudienceAspectRefSchema"),
    (r"\bPcmAudiencePlaneSchema\b", "CharacterAudiencePlaneSchema"),
    (r"\bPCM_GROUP_FIELD_KEYS\b", "CHARACTER_GROUP_FIELD_KEYS"),
    (r"SUPPORTED_PCM_SPECS", "SUPPORTED_CHARACTER_SPECS"),
    (r"PCMSpec", "CharacterSpec"),
    (r"jsm-package-meta", "situations-package-meta"),
    (r"\bJSM_PACKAGE\b", "SITUATIONS_PACKAGE"),
    (r"\bresolveStoryEpisodeForPcm\b", "resolveStoryEpisodeForCharacter"),
    (r"\bSamJourneyTouchpoint\b", "StoryJourneyTouchpoint"),
    (r"\bSamJourneyJob\b", "StoryJourneyJob"),
    (r"\bSamJourneyNeed\b", "StoryJourneyJob"),
    (r"\bSamJourneyPhase\b", "StoryJourneyPhase"),
    (r"\bSamJourney\b", "StoryJourney"),
    (r"\bStoryBundle\b", "StoryDocument"),
    (r"validateStoryAssociations", "validateStoryNarrativeAssociations"),
    (r"validateStoryScenes\b", "validateStoryNarrativeScenes"),
    (r"validateStoryStoryArc\b", "validateStoryNarrativeStoryArc"),
    (r"\bValidateSAMContext\b", "ValidateStoryContext"),
    (r"\bValidateSAMResult\b", "ValidateStoryResult"),
    (r"\bValidateSAMAssociationsResult\b", "ValidateStoryAssociationsResult"),
    (r"validateSamNarrativeCoherence", "validateStoryNarrativeCoherence"),
    (r"ValidateSamNarrativeCoherenceResult", "ValidateStoryNarrativeCoherenceResult"),
    (r"\bSamStoryInstanceJson\b", "StoryInstanceJson"),
    (r"\bSamStoryRuntimeWire\b", "StoryRuntimeWire"),
    (r"\bResolveSamStoryInstanceInput\b", "ResolveStoryNarrativeInstanceInput"),
    (r"\bResolveSamStoryInstanceResult\b", "ResolveStoryNarrativeInstanceResult"),
    (r"\bBuildPcmSamStoryRunInput\b", "BuildCharacterStoryRunInput"),
    (r"\bPcmSamStoryRun\b", "CharacterStoryRun"),
    (r"parseSamStoryDimensions", "parseStoryDimensions"),
    (r"\bSamStoryDimension", "StoryDimension"),
    (r"\bSamStoryDimensionsSchema\b", "StoryDimensionsSchema"),
    (r"projectStoryDimensionsFromNarrative", "projectStoryDimensionsFromStory"),
    (r"ProjectStoryDimensionsFromStoryInput", "ProjectStoryDimensionsFromStoryInput"),
]


def main() -> None:
    for base in BASES:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".md", ".yml"}:
                continue
            if "node_modules" in path.parts:
                continue
            text = path.read_text(encoding="utf-8")
            orig = text
            for pat, repl in FIXES:
                text = re.sub(pat, repl, text)
            if text != orig:
                path.write_text(text, encoding="utf-8")
    sam_test = ROOT / "catalog/story/test/sam"
    if sam_test.exists():
        import shutil

        shutil.rmtree(sam_test)
    print("migrate-drop-acronyms-fix3: done")


if __name__ == "__main__":
    main()