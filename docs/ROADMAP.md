# Roadmap

Each milestone ends in something playable. A playable 2D simulation must never depend on advanced 3D or frontier AI.

| # | Milestone | Definition of done | Status |
|---|-----------|--------------------|--------|
| 0 | **Foundation**: repo, map, data schemas, save/load, deterministic clock, scenario JSON | Open the map and load a saved world | ✅ this branch |
| 1 | **First playable observer loop**: time selector, Advance Turn, factions with flags, territory overlay, 8–10 chronological events per turn, event log | Advance and review consistent state changes | next |
| 2 | **Autonomous causality**: faction goals, economy/resources, local stability, diplomacy, event prerequisites and persistence | Events visibly arise from conditions and affect later turns | |
| 3 | **Battles & crisis zoom**: automatic and editor-triggered battles, contested regions, severity, pause on major events, city inset | A battle evolves over several turns and changes state | |
| 4 | **God Mode & foreign actors**: faction editor, event injection, peacekeepers, mercenaries, aid, save-point branching | Edit conditions and observe unscripted responses | |
| 5 | **Richer map & characters**: neighbourhoods, infrastructure overlays, text interviews, local reports, optional voice | | |
| 6 | **3D proof of concept**: one neighbourhood from available data, streamed in three.js (or Unreal), attached to a simulated event | | |
| 7 | **Advanced visuals & voice**: scale reconstruction, Gaussian splats, replay, real-time voices, optional video | | |

## Architecture

```
src/engine/   Pure TypeScript simulation: no UI, no network. Deterministic.
  types.ts      WorldState, Faction, Location, WorldEvent, Intervention…
  clock.ts      Turn lengths (1h–1mo) and hourly slicing of long turns
  rng.ts        Seeded PRNG whose state lives in the save
  world.ts      advanceTurn() and the System pipeline
  scenario.ts   Scenario validation and world creation
  save.ts       Versioned save files
  geo.ts        Map projection helpers
src/data/     Scenario JSON (geography, factions, locations, opening events)
src/ui/       React UI. Only reads the engine's state and calls its functions.
```

Turn pipeline (filled in from Milestone 1 on): advance clock → logistics and baseline conditions → actor intentions → constraint checks and resolution → write state changes → rank and summarise events → pause on major incidents → save a replayable record.

AI (local Ollama first, optional cloud model) will plug in as a *system* that proposes intentions and writes narrative. The engine validates everything it proposes before writing state.

UI mockups: https://claude.ai/artifact/HYeRPvcB3SuhWHJo1vPQv5
