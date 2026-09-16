# Location hierarchy draft (English source)

Status: **authored into data** — `data/schemas/locations.schema.json` + rebuilt `data/locations.json` (`schemaVersion` 2.0.0). This draft remains the design rationale.
Purpose: universe-rooted tree of every catalog `location:*`, each node with an explicit **parent relation**, so still-ref and stretch decisions can become deterministic (see `AGENT_GENERATION_BRIEF.md` §4.1).

Implemented host choice: hull is both `vehicle:celestial-ardor` and non-shootable `location:celestial-ardor` (`spatialKind: vessel`); rooms/spines use `aboard` that location.

## 1. Relation vocabulary (draft)

| `parentRelation` | Meaning |
| --- | --- |
| `universe_root` | Synthetic root only |
| `region_of` | Cosmographic region under the root |
| `in_space_of` | Exterior / free-space setting whose “parent” is a region |
| `stationed_in` | Habitat or facility that lives in a region (not a room of another location) |
| `contained_in` | Interior volume physically inside the parent location |
| `aboard` | Interior of a **vehicle** host (parent may be `vehicle:*` until a hull `location:*` exists) |
| `sublocation_of` | Named corner / furniture / framing subset of a parent room (same continuous space) |
| `opens_from` | Accessible from the parent; may sit at a terminus or hatch of the parent without being “inside” its volume in the sheet sense |
| `recessed_in` | Nested chamber inside / behind the parent’s shielding or bulkhead |

A node has **one primary parent** for tree identity (containment / host).  
**Multi-deck spines are not parents of every deck they touch** — see §2.

## 2. Multi-deck spines (elevator, service shaft, central access)

Central access, the service cylinder, and the lift/elevator shaft are **axial circulation volumes**: they run past (or through) many decks. Modeling them as `contained_in` the bridge *or* engineering is wrong; modeling every deck as `contained_in` the shaft is also wrong.

### Recommended model: tree + circulation graph

Split two concerns:

| Layer | Question it answers | Still-ref role |
| --- | --- | --- |
| **Containment tree** (`parent` + `parentRelation`) | What larger *host* is this volume part of? | Ancestors never auto-attach |
| **Circulation edges** (`connects[]`) | Which decks / rooms open onto this spine, and at which level? | Junction ≠ second location sheet unless camera is *in* the spine |

**Spine nodes** (aboard the Ardor, siblings of rooms — not children of a single deck):

| ID | `spatialKind` (draft) | Notes |
| --- | --- | --- |
| `location:celestial-ardor-central-access` | `axial_spine` | Helical trunk; everyday circulation |
| `location:celestial-ardor-service-cylinder` | `axial_spine` | Ladder / technical conduit; bridge hatch |
| `proposed:location:celestial-ardor-lift-shaft` | `axial_spine` | Mentioned in vestibule prose; **not in catalog yet** — do not invent for production until authored |

Each spine declares **deck interfaces**, not child rooms:

```ts
// draft shape on spine locations
spatialKind: "axial_spine";
connects: Array<{
  deckLocationId: LocationId;     // e.g. bridge, engineering, reactor-service-bay
  relation: "opens_onto" | "terminus_at" | "hatch_into";
  levelId?: string;               // optional stable deck key: "bridge" | "engineering" | "aft-reactor"
  notes?: string;
}>;
```

**Deck / room nodes** stay `aboard` the hull. They may list the inverse edge (optional denormalization) or rely on the spine’s `connects` as SoT.

Example (central access):

```text
central-access (axial_spine, aboard Ardor)
  connects → bridge          (opens_onto)      # helical opening / command vestibule
  connects → engineering     (opens_onto)      # mid/aft landings as authored
  connects → reactor-service-bay (terminus_at) # BOTTOM of shaft — scene 19
```

Example (service cylinder):

```text
service-cylinder (axial_spine, aboard Ardor)
  connects → bridge / command-vestibule (hatch_into)
  connects → diplomatic-core-room     (opens_onto)  # technical branch per description
  connects → …other decks as authored
```

Example (lift — when catalogued):

```text
lift-shaft (axial_spine, aboard Ardor)
  connects → each served deck (opens_onto)
```

### What *not* to do

- **Do not** parent `bridge` under `central-access` because the stair opens there.
- **Do not** attach central-access **and** bay sheets because the bay is at the shaft foot — camera space is still one `locationId` (bay *or* shaft interior).
- **Do not** use `secondaryLocationIds` as a substitute for `connects` (that field is shot-level editorial, not ship geography SoT).

### Still-ref rule for spines

- Shot `locationId` = the volume the camera occupies.
  - Bodies floating **in** the helical trunk → central-access sheet only.
  - Bodies in the **bay at the shaft foot** → bay sheet only; prompt may say “at the bottom of the central-access shaft” without attaching the shaft sheet.
- A spine sheet is attached only when the spine volume is the staged space (or a rare explicit feature sheet is authored — not the default).

### Optional later: level-scoped viewpoints

If a spine needs distinct still sheets per deck (e.g. “bridge-level looking down” already exists as `central-access-sheet-v4-b`), model those as **`sublocation_of` / viewpoint assets on the spine**, not as separate deck locations:

```text
central-access
  └── proposed: sublocation or asset viewpoint @ bridge-looking-down
```

That keeps one location entity with multiple reference assets keyed by `levelId` / viewpoint — aligned with existing `metadata.viewpoint` on v4-b.

## 2b. Deep nesting and fine sublocations (closet → meal table → … → galaxy)

The **containment tree is arbitrarily deep**. Circulation (`connects`) is only for multi-access spines; it does not replace nesting.

### Fine grain (own still sheet)

Example — closet next to the bridge meal table:

```text
… → celestial-ardor (aboard host)
  └── location:celestial-ardor-bridge          (aboard)
      └── location:celestial-ardor-bridge-meal-table   (sublocation_of → bridge)
          └── proposed:location:…-meal-table-closet    (sublocation_of or contained_in → meal-table)
                  referenceAssetIds: [ closet sheet ]
```

| Question | Answer |
| --- | --- |
| Can the closet have its own reference image? | Yes — its own `location:*` (or later a `feature`/`prop` entity) with `referenceAssetIds`. |
| What is `Shot.locationId` if the camera is inside the closet? | The closet id — attach **closet sheet only**. |
| Do we also attach meal-table / bridge sheets? | **No** by default (same rule as bay vs shaft). Prompt may name “closet beside the meal table on the bridge.” |
| When is meal-table still the `locationId`? | Camera in the meal-table volume; closet is closed / background detail in prose only. |

`sublocation_of` = same continuous room, tighter framing (meal table).  
`contained_in` = distinct enclosed volume inside the parent (closet, vault). Use whichever matches the architecture; both are tree edges.

**Do not add a portal from the meal table to the bridge.** The table is already *in* the bridge (`sublocation_of` → bridge). A portal would wrongly imply two spaces you cross between. You can pan from table to stations without traversing a door.

| Link | Meal table ↔ bridge | Closet ↔ living room (door) | Window ↔ street |
| --- | --- | --- | --- |
| Model | `sublocation_of` (tree only) | `contained_in` **or** portal `kind=door` if you care about the doorway as a transit edge | portal `kind=view` |
| Portal? | **No** | Optional (door); not required for still-ref | Yes |

If a portal *is* used between nested spaces (rare), clarify with `portalKind` + role, e.g. `kind=door`, `relation=exits_to` / `enters_from`, and keep the tree parent as SoT for “where this volume lives.” Prefer tree-only for open sublocations (table, console bank, stair landing in the same room).

### Coarse grain (cities, planets, galaxies)

Same tree, larger nodes — **regions / facilities / exteriors**, usually non-shootable or rare wide shots:

```text
proposed:universe:root
└── proposed:region:milky-way              (region_of)
    └── proposed:region:sol                (region_of)
        └── proposed:region:sol-jupiter    (region_of)   # already in draft
            ├── location:jupiter-periapsis (in_space_of)
            ├── location:proxima-station   (stationed_in)
            │   └── … rooms …
            └── … Ardor aboard …
```

A full Earth-like stack would be:

```text
galaxy → star system → planet → city → building → apartment → room → furniture sublocation → closet
```

each with `parentRelation` ∈ { `region_of`, `in_space_of`, `stationed_in`, `contained_in`, `sublocation_of` }.

Nothing in the model caps depth. What we **avoid**:

- Inventing planet/city nodes before the story needs them as locations.
- Auto-attaching ancestor sheets (galaxy sheet on a closet CU).
- Encoding “apartment in building” as shot `secondaryLocationIds` instead of hierarchy SoT.

### Still-ref selection (deterministic target)

```text
stillLocationSheet(shot) =
  catalogSheet(shot.locationId)           # required
  + sheets(shot.explicitFeatureRefIds?) # optional authored extras only
# never: sheets(ancestors(shot.locationId))
# never: sheets(spines that merely connect to locationId)
```

Ancestors remain available for **prompts, UI breadcrumbs, and validation** (“closet must be under bridge”), not for default image attachment.

### When circulation still matters in a deep nest

Only if something **spans many siblings** (elevator serving every floor of a building). Then:

- building floors = `contained_in` building  
- elevator shaft = `axial_spine` `contained_in` / `aboard` building with `connects` → each floor  

Same pattern as Ardor shafts — scale-invariant.

### Portals (windows, doors, transporters)

Generalize apertures to **portals**: directed (or bidirectional) links from a host location/feature to another location, without implying containment.

| `portalKind` | Typical use | Walk / transit? | Range |
| --- | --- | --- | --- |
| `view` | window, viewport, porthole | no (see-only) | usually N/A or line-of-sight only |
| `door` | hatch, balcony, airlock | yes, local | usually adjacent only (`maxRange` omitted or 0) |
| `corridor` | fixed walkable link (optional alias of door) | yes | adjacent |
| `transporter` | pad / beam / gate | yes, jump | **`maxRange` required** (abstract distance units) |
| `wormhole` | fixed or conditional long gate | yes | often unlimited *along that portal*, or special rules |

Window onto the street:

```text
living-room
  portal(kind=view) → street-outside
```

Door/balcony:

```text
living-room
  portal(kind=door) → street-outside    # walkable; not a parent edge
```

Transporter aboard a mobile vehicle:

```text
vehicle A (mobile location / host)
  └── transporter-pad D
        portal(kind=transporter, maxRange=60) → { destinations resolved at runtime }
```

Fixed destination list is optional. For sci-fi pads, **reachable set is computed** from proximity + range (§2c), not hand-maintained coordinates.

| Relation family | Examples | Still-ref default |
| --- | --- | --- |
| Containment tree | room in apartment in building | sheet of camera space only |
| Circulation `connects` | elevator / axial spines (multi-deck) | spine sheet only if camera is *in* the spine |
| Portals | window, door, transporter, wormhole | sheet of camera space; far side only if it drives the frame or is an authored extra |

Spine `connects` can later be viewed as a **restricted portal subclass** (multi-level door graph). Until schema merge, keep spines’ `connects` as authored convenience for ship decks.

**Ardor reading:** the three shafts — central access, service cylinder, and lift (when catalogued) — are each an `axial_spine` whose `connects` / door-portals point at **every deck they serve** (bridge, engineering, bay terminus, etc.). The decks are not children of the shaft; the shaft has portals *to* the decks.

## 2c. Proximity without coordinates (continuity / portal range)

Continuity testers should not need XYZ. Maintain an undirected **proximity graph** on location nodes (regions, stations, bays, exterior sites — usually not every closet):

```ts
proximityEdges: Array<{
  a: LocationId;
  b: LocationId;
  distance: number;   // abstract units, same scale as portal.maxRange
}>;
```

**Distance** `dist(X, Y)` = shortest-path sum on that graph (∞ if disconnected).  
**Identity:** `dist(X, X) = 0`.

**Mobile presence** (vehicle / ship as location host):

```ts
// continuity ledger / runtime fact — not catalog permanence
presence: { mobileId: LocationId | VehicleId; at: LocationId }
// e.g. vehicle A arrived at location B  →  presence.at = B  ⇒  dist(A, B) = 0
```

When asking “how far is vehicle A from C?”, use **`dist(presence.at(A), C)`** (or `dist(A,C)` if A is treated as colocated with `at`).

### Transporter reachability (your example)

Given:

- Vehicle **A** has `presence.at = B` → `dist(A, B) = 0`
- Proximity edge (or path) with `dist(B, C) < 50` (e.g. 40)
- Portal **D** on A: `kind=transporter`, `maxRange=60`

Then **D can reach C** iff:

```text
dist(presence.at(A), C) <= D.maxRange
```

Here `dist(B,C) < 50 <= 60` → reachable.

If A later leaves B for a far site F with `dist(F,C) = 200`, the same portal cannot reach C until proximity or presence changes — **no coordinate maintenance**, only presence facts + authored proximity edges.

### Authoring proximity sparsely

- Put edges where the story cares (dock↔station, periapsis↔mouth, station↔nearby beacon).
- Do **not** fully connect the closet graph; lift queries to a **site-scale** ancestor if needed (`siteOf(closet) = building or district`) before looking up proximity.
- Optional: `distanceUnit` label on the hierarchy file (`"abstract" | "km" | "light-minutes"`) for docs only; testers compare numbers on one scale.

### Continuity tester hooks (draft)

- Assert `presence.at` matches the current scene/shot exterior or berth.
- Assert transporter use: `reachable(portal, destination)`.
- Assert view portals do not require range (or use a separate LOS flag).
- Never infer reachability from containment alone (being under the same galaxy does not imply `dist` is small).

## 2d. Navigation graph (pathfinding + world state + blockers)

Hierarchy + portals answer *what connects*. **Navigation** answers *can this character get from here to there under current world state, without forbidden crossings?*

Still no XYZ: author a **nav graph** whose nodes are locations / sublocations (meal table, crew stations, vestibule, shaft segments) and whose edges are traversable steps gated by **predicates on world state**.

```ts
/** Continuity / scene runtime — keys are stable ids */
type WorldState = Record<string, string | boolean | number>;

interface NavEdge {
  id: string;
  from: LocationId;
  to: LocationId;
  via?: string;              // portal id, shaft segment, "around-rail", etc.
  /** All must hold for the edge to be usable (AND). Empty = always open. */
  requires?: WorldStatePredicate[];
  cost?: number;
  tags?: string[];           // e.g. "crosses-open-shaft", "around-central-opening"
}

type WorldStatePredicate =
  | { key: string; eq: string | boolean | number }
  | { key: string; in: Array<string | boolean | number> }
  | { key: string; neq: string | boolean | number };
```

### World state (generic)

Gravity is one key among many. Author whatever the story needs:

| Example key | Values | Used for |
| --- | --- | --- |
| `gravity` | `1g` \| `microgravity` \| … | shaft crossing vs walk-around |
| `door:service-hatch-bridge` | `open` \| `closed` \| `locked` | hatch transit |
| `airlock:aft` | `cycled` \| `vacuum-side` \| … | EVA routes |
| `power:lift` | `on` \| `off` | elevator edges |
| `alert` | `none` \| `lockdown` | blocked corridors |

Testers read `WorldState` from scene/shot context + continuity ledger (same place as occupancy / mobile presence).

### Bridge example (Voss: meal table → crew stations)

```text
edge around-rail:
  requires: []                         # or none — always valid when bridge is traversable

edge across-open-shaft:
  requires: [{ key: "gravity", eq: "microgravity" }]
  tags: ["crosses-open-shaft"]
```

| `WorldState.gravity` | Valid path |
| --- | --- |
| `1g` | around-rail only |
| `microgravity` | around-rail **or** across-open-shaft |

Service hatch example:

```text
edge into-service-cylinder:
  requires: [
    { key: "door:service-hatch-bridge", eq: "open" }
  ]
```

Under lockdown you might add `{ key: "alert", neq: "lockdown" }` on public corridors.

Tester:

```text
pathExists(actor, from, to, worldState)
```

### Blockers (Harlan in the service shaft)

Character (or object) **occupancy** is continuity state on a nav node (or edge):

```ts
occupancy: Array<{
  entityId: CharacterId | ObjectId;
  at: LocationId;           // e.g. service-cylinder @ bridge hatch / shaft segment
  stance?: "hostile" | "ally" | "neutral" | "unconscious" | "obstacle";
}>;
```

Path search can require:

```text
pathAvoiding(occupancy where stance ∈ {hostile, obstacle})
```

or report **forced encounter**:

```text
shortestPath intersects Harlan @ service-shaft
  → continuity flag: must confront / divert / wait
```

So if Voss’s only route under current state threads the service hatch and Harlan is hostile there, the tester fails “unseen passage” or demands an authored beat.

Occupancy is separate from `WorldState` keys (entities move); door/gravity/power stay in `WorldState`.

### What nav is *not*

- Not the containment tree (meal table does not portal to bridge; both are on the bridge nav subgraph).
- Not proximity (inter-site abstract distance for transporters).
- Not still-ref selection (camera `locationId` sheet only).

Nav may **reference** portals/spine connects as `via`, and may subdivide a room into waypoints (table, stations, rail arc) without making each a shootable catalog location — waypoints can be `navOnly: true` nodes.

### Tester API sketch

```text
assertReachable(actor, from, to, worldState, { avoidStances?, maxCost? })
assertForcedEncounter(actor, from, to, worldState) → entities[]
assertNoTag(actor, from, to, worldState, { forbiddenTags: ["crosses-open-shaft"] })
assertEdgeDisabled(edgeId, worldState)  // e.g. door closed
```

## 3. Tree (all 14 catalog locations + proposed hosts)

IDs marked `proposed:` are **not** in `data/locations.json` yet.

```text
proposed:universe:root                          (universe_root)
└── proposed:region:sol-jupiter                 (region_of → universe)
│   ├── location:jupiter-periapsis              (in_space_of → sol-jupiter)
│   ├── location:proxima-station                (stationed_in → sol-jupiter)
│   │   └── location:proxima-dock               (contained_in → proxima-station)
│   │       # axial dock on non-rotating spine; Ardor berths here
│   ├── location:velari-wormhole-mouth          (in_space_of → sol-jupiter)
│   │       # gate mouth near Jupiter; pulse opening only
│   └── proposed:vehicle-host:celestial-ardor   (aboard host → sol-jupiter while in this region)
│       │   # mirrors vehicle:celestial-ardor until a hull location exists
│       ├── location:celestial-ardor-bridge     (aboard → celestial-ardor)
│       │   ├── location:celestial-ardor-bridge-meal-table
│       │   │       (sublocation_of → bridge)     # ALREADY parentLocationId=bridge
│       │   └── location:celestial-ardor-command-vestibule
│       │           (sublocation_of → bridge)     # command-deck landing / shaft heads
│       ├── location:celestial-ardor-central-access
│       │           (aboard → celestial-ardor; spatialKind=axial_spine)
│       │           # connects → bridge, engineering; terminus_at reactor-service-bay — §2
│       ├── location:celestial-ardor-reactor-service-bay
│       │   │       (aboard → celestial-ardor)
│       │   │       # shaft foot via circulation, NOT child of central-access
│       │   └── location:celestial-ardor-inner-shielding-vault
│       │           (recessed_in → reactor-service-bay)
│       ├── location:celestial-ardor-service-cylinder
│       │           (aboard → celestial-ardor; spatialKind=axial_spine)
│       ├── location:celestial-ardor-engineering
│       │           (aboard → celestial-ardor)
│       └── location:diplomatic-core-room
│                   (aboard → celestial-ardor)
│
└── proposed:region:velari-space                (region_of → universe)
    └── location:velari-station                 (stationed_in → velari-space)
            # beyond the gate; not a room of Proxima or the Ardor
```

## 4. Flat table (catalog locations only)

| Location ID | Proposed parent | `parentRelation` | Catalog today |
| --- | --- | --- | --- |
| `location:jupiter-periapsis` | `proposed:region:sol-jupiter` | `in_space_of` | no parent |
| `location:proxima-station` | `proposed:region:sol-jupiter` | `stationed_in` | no parent |
| `location:proxima-dock` | `location:proxima-station` | `contained_in` | no parent |
| `location:velari-wormhole-mouth` | `proposed:region:sol-jupiter` | `in_space_of` | no parent |
| `location:velari-station` | `proposed:region:velari-space` | `stationed_in` | no parent |
| `location:celestial-ardor-bridge` | `proposed:vehicle-host:celestial-ardor` | `aboard` | no parent |
| `location:celestial-ardor-bridge-meal-table` | `location:celestial-ardor-bridge` | `sublocation_of` | **parent = bridge** |
| `location:celestial-ardor-command-vestibule` | `location:celestial-ardor-bridge` | `sublocation_of` | no parent |
| `location:celestial-ardor-central-access` | `proposed:vehicle-host:celestial-ardor` | `aboard` (+ `spatialKind=axial_spine`) | no parent |
| `location:celestial-ardor-service-cylinder` | `proposed:vehicle-host:celestial-ardor` | `aboard` (+ `spatialKind=axial_spine`) | no parent |
| `location:celestial-ardor-engineering` | `proposed:vehicle-host:celestial-ardor` | `aboard` | no parent |
| `location:celestial-ardor-reactor-service-bay` | `proposed:vehicle-host:celestial-ardor` | `aboard` + circulation `terminus_at` ← central-access | **parent = engineering** (supersede both parent and “child of shaft”) |
| `location:celestial-ardor-inner-shielding-vault` | `location:celestial-ardor-reactor-service-bay` | `recessed_in` | **parent = bay** |
| `location:diplomatic-core-room` | `proposed:vehicle-host:celestial-ardor` | `aboard` | no parent |

## 5. Conflicts / decisions to ratify

1. **Reactor service bay** — Not a child of the shaft. Host = Ardor (`aboard`); circulation = central-access `terminus_at` the bay. Catalog parent `engineering` should be dropped or demoted to a secondary zone edge.
2. **Hull host** — No `location:celestial-ardor`. Draft uses `proposed:vehicle-host:celestial-ardor` aligned with `vehicle:celestial-ardor`. Schema choice: allow vehicle parents, or add a hull location entity.
3. **Universe / regions** — Synthetic nodes for tree rooting; may live only in hierarchy JSON, not as shootable locations.
4. **Command vestibule** — Bridge-deck sublocation at shaft heads; circulation edges to central-access / service-cylinder / lift when authored.
5. **Lift/elevator** — Prose-only today; add `location:celestial-ardor-lift-shaft` only when authored, as `axial_spine` with `connects` to served decks.
6. **Diplomatic core** — Aboard Ardor; service-cylinder technical branch = circulation edge, not dual still location.
7. **Proxima operations gallery** — Not a separate catalog location yet.
8. **`secondaryLocationIds` on shots** — Prefer `locationId` + hierarchy/circulation SoT; do not encode ship geography in shot secondaries.
9. **Portals vs spines** — Unify `connects` into `portalKind=door` later, or keep spines separate for multi-deck authoring ergonomics.
10. **Proximity graph scope** — Which nodes get edges (sites only vs every room); distance unit label; where `MobilePresence` lives (continuity ledger vs production contexts).
11. **Nav graph granularity** — Which bridge waypoints are catalog locations vs `navOnly` nodes; how shaft segments are keyed per deck; occupancy SoT for character blockers; shared vocabulary for `WorldState` keys (`gravity`, `door:*`, …).

## 6. Worked still-ref implication (scene 19)

- Camera space: `location:celestial-ardor-reactor-service-bay`
- Primary still location sheet: bay sheet only
- Central-access is a **circulation ancestor/link**, not an auto-attached sheet
- Vault door: prompt detail and/or vault sheet only if the vault **space** drives the frame

## 7. Suggested schema sketch (not implemented)

```ts
type LocationParentRelation =
  | "contained_in"
  | "sublocation_of"
  | "aboard"
  | "opens_from"
  | "recessed_in"
  | "stationed_in"
  | "in_space_of"
  | "region_of";

type LocationSpatialKind =
  | "region"
  | "facility"
  | "room"
  | "sublocation"
  | "axial_spine"    // multi-deck shaft / elevator / central access
  | "exterior";

type CirculationRelation = "opens_onto" | "terminus_at" | "hatch_into";

type PortalKind = "view" | "door" | "corridor" | "transporter" | "wormhole";

interface Portal {
  id: string;
  hostLocationId: LocationId;       // room, pad sublocation, or vehicle interior
  kind: PortalKind;
  /** Fixed destination when static (window always faces that street). Omit for dynamic transporters. */
  towardLocationId?: LocationId;
  /** Abstract distance; required for transporter range checks — see §2c */
  maxRange?: number;
  bidirectional?: boolean;
}

interface ProximityEdge {
  a: LocationId;
  b: LocationId;
  distance: number;
}

/** Continuity / runtime — not permanent catalog geography */
interface MobilePresence {
  mobileId: LocationId | VehicleId;
  at: LocationId;
}

interface Location {
  id: LocationId;
  spatialKind?: LocationSpatialKind;
  parentLocationId?: LocationId | VehicleId;
  parentRelation?: LocationParentRelation;
  connects?: Array<{
    deckLocationId: LocationId;
    relation: CirculationRelation;
    levelId?: string;
  }>;
  portals?: Portal[]; // or portals live in a side table keyed by hostLocationId
}

// Hierarchy file may also hold: proximityEdges[], portals[], navEdges[],
// and testers read MobilePresence + character occupancy from the continuity ledger.
```

Synthetic universe/region nodes: either a small `data/location-hierarchy.json` SoT that references catalog IDs, or first-class entries with `kind: "region" | "universe"` excluded from shot `locationId`.

---

**Coverage check:** all 14 `data/locations.json` entries appear in §3–§4. No other catalog locations exist as of this draft.
