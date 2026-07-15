# Project Design Document

## Feature: Region-scoped scheduling

### Architecture

- `regions` is the canonical list of selectable regions, while `region_cities` maps each region to supported cities, city-centre coordinates, and a matching radius.
- Initial rows map `austin`, `killeen`, and `waco` to `central_texas`. Austin uses a 50-mile matching radius to cover Greater Austin; the other city radii are narrower.
- `members`, `shifts`, and `history` receive a non-null `region_name`. Existing rows migrate to `central_texas`; the `active_members` view exposes `region_name`.
- The React `RegionProvider` loads available regions, restores the browser-selected value, or selects a nearby region with `navigator.geolocation`. A location error or no match requires manual selection rather than guessing; affected pages show an explicit selection prompt.
- Navigation owns the region dropdown. Schedule, Contacts, History, and Google Calendar derive all reads and writes from the active region. The Google Calendar URL becomes a region-name keyed configuration map.

### Key Decisions

| Decision | Rationale | Alternatives considered | Date |
|---|---|---|---|
| Use city-centre radius matching | Avoids a third-party reverse-geocoding service, API key, and location-data disclosure. | Reverse geocoding; GeoJSON city boundaries. | 2026-07-12 |
| Scope data with `region_name` | The existing unauthenticated application has no user-to-region authorization model; this adds the requested display and data separation with minimal schema change. | Full auth plus user-region membership. | 2026-07-12 |
| Require manual selection on an unknown location | Prevents silently displaying the wrong region's members or calendar. | Defaulting to the first configured region. | 2026-07-12 |
| Enforce region referential integrity in SQL | Rejects unknown regions and cross-region shift/member records even if a future client bypasses UI filters. | Client-side checks only. | 2026-07-12 |

### Open Questions

- Adding a second region requires its city rows and Google Calendar URL configuration.
- The current unauthenticated data model cannot enforce per-user regional access; this feature scopes application data but does not introduce authorization.

### Changelog

| Date | Changes |
|---|---|
| 2026-07-12 | Documented the approved region-scoped scheduling architecture. |
