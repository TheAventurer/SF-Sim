# SF-Sim — South Florida: Living History

A personal, single-player, turn-based alternate-history simulation of a **fictional** Second American Civil War in modern South Florida. You are an observer and world editor: the world only moves when you advance a turn, and autonomous factions act on their own.

> Fictional scenario. Not a prediction of real events. Geography is approximate.

## Run it

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # engine tests
npm run build    # type-check and production build
```

## What works now (Milestone 0)

- South Florida map with the opening territory control of the *Fractured Spring* scenario (8 fictional factions with flags)
- Click areas and cities to see population and control shares
- Turn lengths of 1 hour, 6 hours, 1 day, 1 week and 1 month. Long turns are processed in hourly slices.
- Deterministic engine: the same save plus the same turn length always gives the same result
- Save and load in a browser slot, plus export and import of JSON save files

See [docs/ROADMAP.md](docs/ROADMAP.md) for the milestones and architecture.
