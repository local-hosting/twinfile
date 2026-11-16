#!/usr/bin/env python3
"""Hard-cut Sam/Pcm/Jsm public names in twinfile catalog (story + character)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASES = [ROOT / "catalog/story", ROOT / "catalog/character", ROOT / "packages/spec/doc"]

REPLACEMENTS = [
    (r"touchpointGraphToSamWire", "touchpointGraphToStoryWire"),
    (r"matchSamStoryCatalogIdsFromText", "matchStoryCatalogIdsFromText"),
    (r"SamStoryCatalogTextMatchV1", "StoryCatalogTextMatchV1"),
    (r"SamStoryCatalogFleetPlaceRef", "StoryCatalogFleetPlaceRef"),
    (r"SamStorySelectionV1", "StorySelectionV1"),
    (r"assembleSamStoryRun", "assembleCharacterStoryRun"),
    (r"AssembledSamStoryRun", "AssembledCharacterStoryRun"),
    (r"planSamStoryEpisodeCalendar", "planStoryEpisodeCalendar"),
    (r"PlanSamStoryEpisodeCalendarInput", "PlanStoryEpisodeCalendarInput"),
    (r"PlanSamStoryEpisodeCalendarResult", "PlanStoryEpisodeCalendarResult"),
    (r"SamStoryRunState", "CharacterStoryRunState"),
    (r"buildSamStoryPlanCatalogSnapshot", "buildStoryPlanCatalogSnapshot"),
    (r"buildSamStoryPlanChecklist", "buildStoryPlanChecklist"),
    (r"buildSamStoryPlanExtractionIndex", "buildStoryPlanExtractionIndex"),
    (r"mergeSamStoryPlanInput", "mergeStoryPlanInput"),
    (r"buildSamStoryPlanNarrativeContext", "buildStoryPlanNarrativeContext"),
    (r"formatSamStoryPlanLlmUserPrompt", "formatStoryPlanLlmUserPrompt"),
    (r"composeSamStoryPlanWorkingScenario", "composeStoryPlanWorkingScenario"),
    (r"isThinSamStoryPlanScenario", "isThinStoryPlanScenario"),
    (r"intentIdsForSamStoryPlanningSegment", "intentIdsForStoryPlanningSegment"),
    (r"readSamStoryPlanSegmentNeedsSummary", "readStoryPlanSegmentNeedsSummary"),
    (r"readSamStoryPlanSegmentTopic", "readStoryPlanSegmentTopic"),
    (r"resolveSamStoryPlanningPrimaryFocusArea", "resolveStoryPlanningPrimaryFocusArea"),
    (r"SamStoryPlanCatalogSnapshotV1", "StoryPlanCatalogSnapshotV1"),
    (r"SamStoryPlanFleetPlaceSnapshotV1", "StoryPlanFleetPlaceSnapshotV1"),
    (r"SamStoryPlanSegmentObjectiveV1", "StoryPlanSegmentObjectiveV1"),
    (r"SamStoryPlanSegmentSnapshotV1", "StoryPlanSegmentSnapshotV1"),
    (r"SamStoryPlanAxmMenuPlanInputV1", "StoryPlanAxmMenuPlanInputV1"),
    (r"SamStoryPlanAxmMenuSelectionV1", "StoryPlanAxmMenuSelectionV1"),
    (r"SamStoryPlanHeuristicSelectionV1", "StoryPlanHeuristicSelectionV1"),
    (r"SamStoryPlanCatalogBuildInputV1", "StoryPlanCatalogBuildInputV1"),
    (r"SamStoryPlanChecklistItemV1", "StoryPlanChecklistItemV1"),
    (r"SamStoryPlanExtractedHintsV1", "StoryPlanExtractedHintsV1"),
    (r"SamStoryPlanExtractionIndexV1", "StoryPlanExtractionIndexV1"),
    (r"SamStoryPlanExtractionSegmentBriefV1", "StoryPlanExtractionSegmentBriefV1"),
    (r"SamStoryPlanInputV1", "StoryPlanInputV1"),
    (r"SamStoryPlanNarrativeBuildInputV1", "StoryPlanNarrativeBuildInputV1"),
    (r"SamStoryPlanNarrativeContextV1", "StoryPlanNarrativeContextV1"),
    (r"SamStoryPlanScenarioHintsV1", "StoryPlanScenarioHintsV1"),
    (r"SamStoryPlanSegmentNarrativeV1", "StoryPlanSegmentNarrativeV1"),
    (r"SamStoryPlanningCustomerCatalogV1", "StoryPlanningCustomerCatalogV1"),
    (r"SamStoryPlanningFocusInterestV1", "StoryPlanningFocusInterestV1"),
    (r"SamStoryPlanningSegmentObjectiveV1", "StoryPlanningSegmentObjectiveV1"),
    (r"SamStoryPlanningSegmentProfileV1", "StoryPlanningSegmentProfileV1"),
    (r"mergeSamStoryDimensionsIntoCreateBody", "mergeStoryDimensionsIntoCreateBody"),
    (r"parseSamStoryDimensions", "parseStoryDimensions"),
    (r"SamStoryDimension", "StoryDimension"),
    (r"SamStoryDimensionsSchema", "StoryDimensionsSchema"),
    (r"\bPCM\b", "Character"),
    (r"\bSAM\b", "Story"),
    (r"\bJSM\b", "Situations"),
    (r"/pcm", "/persona"),
    (r"/sam", "/narrative"),
    (r"/jsm", "/situations"),
]


def main() -> None:
    for base in BASES:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if "node_modules" in path.parts or path.suffix not in {".ts", ".tsx", ".md"}:
                continue
            text = path.read_text(encoding="utf-8")
            orig = text
            for pat, repl in REPLACEMENTS:
                text = re.sub(pat, repl, text)
            if text != orig:
                path.write_text(text, encoding="utf-8")
    print("drop-pcm-sam-twinfile-hard: done")


if __name__ == "__main__":
    main()