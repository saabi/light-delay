# Festival-master reference reconciliation — 2026-09-13

English source. Production record, not narrative authority. Generated from the reconciliation pass that prepared `script:light-delay-festival-master` for still generation (plan: separate still/video references, Proxima interior locations and gravity, on-frame reference audit, six-person Operations Gallery presence).

## Method

Per take: read description, framing, camera, location, gravity context and adjoining shots; list on-frame entities; resolve each to its catalog entity and current sheet; verify catalog presence, file existence, editorial status, and canon consistency; never keep a reference because it was already attached; never use an exterior sheet as an interior authority; report canon contradictions instead of resolving them silently. Enforced by `node scripts/report-festival-master-reference-audit.mjs` (0 errors after the pass) and `npm run scrub:still-prompt-cast:check`.

## Canon-presence findings (stop-and-report)

| Shot/take | Current metadata (before) | Master source | Contradiction | Correction applied (lower layer) | Editorial decision? |
| --- | --- | --- | --- | --- | --- |
| 060, 061 | `character:zao` "present, listening" on the bridge, sheet attached | `master:story-b3`–`b5` (Zao murdered before the crossing), `e2` (her recording plays on the bridge) | Zao cannot be on the bridge when her packet arrives | Zao removed from `visibleRefs` and still lists (not off-frame either); 060 secondary locations and off-frame prop sheets removed | No — unambiguous metadata error |
| 095, 096 | `character:zao` "present, listening" in the reactor bay | `master:story-g3` (her photograph fills part of the screen) | Present only as a photograph on the console display | Role set to "on the console display only (personnel photograph)"; sheet kept for the display likeness | No |
| 083–088 | `character:harlan` "present, listening" on the bridge / at the Velari station beats | `master:story-f`/`g` (Harlan tethered and restrained aft after 079; Okoye keeps watch aft) | Harlan is not on the bridge during greeting, contact, and the sphere approach | Harlan removed from `visibleRefs` (not off-frame present) | No |
| 023, 024 | `secondaryLocationIds` includes `location:celestial-ardor-command-vestibule` | Entity removed from `data/locations.json` on 2026-09-13 (bridge description covers the hatch) | Stale entity reference | Removed | No |
| 044, 045 | `locationId: location:celestial-ardor-reactor-service-bay` while the description and attached sheet place Harlan at the bridge-side hatch / bridge compartment | `master:story-b3` (tray below the bridge hatch) | Location id contradicted the action | `locationId` → bridge (044 keeps the service cylinder as secondary) | No |
| 017 | `asset:object-harlan-wrist-device-sheet` attached | Description: Zao’s own wrist dosimeter | Wrong prop (Harlan’s device) | Sheet removed | No |
| 001–009 | "Steady 1 g artificial gravity" in prompts; exterior station/dock sheets as interior authority | `PROXIMA_STATION.md` §3–§5/§7 (rings ≈ 0.5 g, spine microgravity); author decision 2026-09-13 | Wrong gravity and geometry authority | 001–005 → 0.5 g + Operations Gallery sheet; 006–009 → microgravity + axial-dock interior sheet | Decided by the author |

## Per-take records

### 001 (`festival-master:shot-plan-001:take-01`)

- Visible entities: `character:voss (present, listening (silhouette against the display))`, `character:harlan (present, listening (silhouette against the display))`, `character:sorell (present, listening (silhouette against the display))`, `character:zao (present, listening (silhouette against the display))`, `character:rao (present, listening (silhouette against the display))`, `character:okoye (present, listening (silhouette against the display))`
- Off-frame excluded: `character:periodista`
- Removed references: `location-proxima-station-berthed`
- Added references: `location-proxima-operations-gallery-interior-sheet`
- Stale or invalid found: —
- Replacements: `location-proxima-station-berthed` → `location-proxima-operations-gallery-interior-sheet` (exterior station view used as interior authority; replaced by the registered operations-gallery interior sheet)
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-zao-sheet, character-rao-sheet, character-okoye-sheet, location-proxima-operations-gallery-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]

### 002 (`festival-master:shot-plan-002:take-01`)

- Visible entities: `character:harlan (speaking, in focus)`, `character:sorell (speaking, beside Harlan)`
- Off-frame excluded: `character:periodista`, `character:voss`, `character:zao`, `character:rao`, `character:okoye`
- Removed references: `character-periodista-sheet`, `character-voss-sheet`, `character-zao-sheet`, `character-rao-sheet`, `character-okoye-sheet`, `location-proxima-station-berthed`
- Added references: `location-proxima-operations-gallery-interior-sheet`
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-harlan-sheet, character-sorell-sheet, location-proxima-operations-gallery-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]

### 003 (`festival-master:shot-plan-003:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:sorell (turning toward Voss at frame right)`
- Off-frame excluded: `character:periodista`, `character:harlan`, `character:zao`, `character:rao`, `character:okoye`
- Removed references: `character-periodista-sheet`, `character-harlan-sheet`, `character-zao-sheet`, `character-rao-sheet`, `character-okoye-sheet`, `location-proxima-station-berthed`
- Added references: `location-proxima-operations-gallery-interior-sheet`
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-voss-sheet, character-sorell-sheet, location-proxima-operations-gallery-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]

### 004 (`festival-master:shot-plan-004:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:zao (speaking, in focus)`
- Off-frame excluded: —
- Removed references: `location-proxima-station-berthed`
- Added references: `location-proxima-operations-gallery-interior-sheet`
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-voss-sheet, character-zao-sheet, location-proxima-operations-gallery-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]

### 005 (`festival-master:shot-plan-005:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:zao (speaking, in focus)`
- Off-frame excluded: —
- Removed references: `location-proxima-station-berthed`
- Added references: `location-proxima-operations-gallery-interior-sheet`
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-voss-sheet, character-zao-sheet, location-proxima-operations-gallery-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error, wrong_composition]
- Notes: composition.size INSERT → MCU

### 006 (`festival-master:shot-plan-006:take-01`)

- Visible entities: `character:okoye (moving, hand-over-hand with a restrained pallet in the cargo lane)`, `character:rao (braced at the mid-shaft manifest terminal)`, `character:zao (at the docking collar, berth end)`, `vehicle:celestial-ardor (bow docking collar engaged in the station capture ring at the shaft tip)`
- Off-frame excluded: `character:voss`, `character:harlan`, `character:sorell`
- Removed references: `character-voss-sheet`, `character-harlan-sheet`, `character-sorell-sheet`, `location-proxima-dock-sheet`, `location-celestial-ardor-engineering-sheet`
- Added references: `location-proxima-axial-dock-interior-sheet`, `vehicle-celestial-ardor-model-sheet-v2`
- Stale or invalid found: —
- Replacements: `location-celestial-ardor-engineering-sheet` → none (engineering interior not on-frame (and sheet is needs_review)); `location-proxima-dock-sheet` → `location-proxima-axial-dock-interior-sheet` (exterior dock sheet was the interior geometry authority; replaced by the registered axial-dock interior sheet)
- Unresolved blocker: none
- Affects: still (refs/prompt) + video (gate)
- Final still references (5): character-okoye-sheet, character-rao-sheet, character-zao-sheet, location-proxima-axial-dock-interior-sheet, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [canon_mismatch, continuity_error, wrong_composition]; productionGate deferred (medium video)
- Notes: secondaryLocationIds [engineering] removed: the engineering deck is not on-frame in the dock. composition.size MCU → LS

### 007 (`festival-master:shot-plan-007:take-01`)

- Visible entities: `character:voss (speaking, one hand on the crew rail mid-shaft, station side)`, `character:harlan (speaking, braced at a tether point beside the hazardous-stores gate near the berth)`, `vehicle:celestial-ardor (bow collar at the shaft tip, wide)`
- Off-frame excluded: `character:sorell`, `character:zao`, `character:rao`, `character:okoye`
- Removed references: `character-sorell-sheet`, `character-zao-sheet`, `character-rao-sheet`, `character-okoye-sheet`, `location-proxima-dock-sheet`
- Added references: `location-proxima-axial-dock-interior-sheet`, `vehicle-celestial-ardor-model-sheet-v2`
- Stale or invalid found: —
- Replacements: `location-proxima-dock-sheet` → `location-proxima-axial-dock-interior-sheet` (exterior dock sheet replaced by the registered interior sheet)
- Unresolved blocker: none
- Affects: still (refs/prompt) + video (gate)
- Final still references (4): character-voss-sheet, character-harlan-sheet, location-proxima-axial-dock-interior-sheet, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]; productionGate deferred (medium video)

### 008 (`festival-master:shot-plan-008:take-01`)

- Visible entities: `character:rao (speaking, braced at the manifest terminal)`, `character:zao (speaking, arriving hand-over-hand from the berth end)`
- Off-frame excluded: `character:voss`, `character:harlan`, `character:sorell`, `character:okoye`
- Removed references: `character-voss-sheet`, `character-harlan-sheet`, `character-sorell-sheet`, `character-okoye-sheet`, `location-proxima-dock-sheet`
- Added references: `location-proxima-axial-dock-interior-sheet`
- Stale or invalid found: —
- Replacements: `location-proxima-dock-sheet` → `location-proxima-axial-dock-interior-sheet` (exterior dock sheet replaced by the registered interior sheet)
- Unresolved blocker: none
- Affects: still (refs/prompt) + video (gate)
- Final still references (3): character-rao-sheet, character-zao-sheet, location-proxima-axial-dock-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]; productionGate deferred (medium video)

### 009 (`festival-master:shot-plan-009:take-01`)

- Visible entities: `character:voss (speaking, on the crew rail)`, `character:zao (speaking, at the terminal, not stopping her work)`
- Off-frame excluded: `character:harlan`, `character:sorell`, `character:rao`, `character:okoye`
- Removed references: `character-harlan-sheet`, `character-sorell-sheet`, `character-rao-sheet`, `character-okoye-sheet`, `location-proxima-dock-sheet`
- Added references: `location-proxima-axial-dock-interior-sheet`
- Stale or invalid found: —
- Replacements: `location-proxima-dock-sheet` → `location-proxima-axial-dock-interior-sheet` (exterior dock sheet replaced by the registered interior sheet)
- Unresolved blocker: none
- Affects: still (refs/prompt) + video (gate)
- Final still references (3): character-voss-sheet, character-zao-sheet, location-proxima-axial-dock-interior-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error, wrong_composition]; productionGate deferred (medium video)
- Notes: composition.size CU → MCU

### 010 (`festival-master:shot-plan-010:take-01`)

- Visible entities: `character:voss (seated, hull side, stations end)`, `character:harlan (seated, hull side, middle)`, `character:okoye (seated, hull side, lift end)`, `character:rao (seated, room side, stations end)`, `character:sorell (seated, room side, middle)`, `character:zao (speaking, seated, room side, lift end, glancing up at the display)`, `vehicle:celestial-ardor (silhouette on the hull-wall systems display, slowly rotating)`
- Off-frame excluded: —
- Removed references: —
- Added references: `vehicle-celestial-ardor-model-sheet-v2`
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (8): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-zao-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → LS

### 011 (`festival-master:shot-plan-011:take-01`)

- Visible entities: `character:sorell (speaking, seated, room side, middle)`, `character:harlan (speaking, seated, hull side, middle, across from Sorell)`, `character:rao (seated beyond, room side, stations end)`, `character:voss (seated beyond, hull side, stations end)`
- Off-frame excluded: `character:zao`, `character:okoye`
- Removed references: `character-zao-sheet`, `character-okoye-sheet`
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-sorell-sheet, character-harlan-sheet, character-rao-sheet, character-voss-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → MS

### 012 (`festival-master:shot-plan-012:take-01`)

- Visible entities: `character:sorell (speaking, seated, room side, middle)`, `character:voss (speaking, seated, hull side, stations end)`, `character:harlan (at frame edge at the start, hull side, middle)`
- Off-frame excluded: `character:zao`, `character:rao`, `character:okoye`
- Removed references: `character-zao-sheet`, `character-rao-sheet`, `character-okoye-sheet`
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-sorell-sheet, character-voss-sheet, character-harlan-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [continuity_error]

### 013 (`festival-master:shot-plan-013:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-zao-sheet, character-rao-sheet, character-sorell-sheet, character-harlan-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 013b (`festival-master:shot-plan-013b:take-01`)

- Visible entities: `vehicle:celestial-ardor (exterior, the ship in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): vehicle-celestial-ardor-jupiter, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:celestial-ardor (exterior, the ship in frame)

### 014 (`festival-master:shot-plan-014:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-zao-sheet, character-rao-sheet, character-sorell-sheet, character-harlan-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 015 (`festival-master:shot-plan-015:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-zao-sheet, character-rao-sheet, character-sorell-sheet, character-harlan-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 016 (`festival-master:shot-plan-016:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-zao-sheet, location-celestial-ardor-engineering-sheet
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size OTS → MCU

### 016b (`festival-master:shot-plan-016b:take-01`)

- Visible entities: `vehicle:celestial-ardor (exterior, the ship in frame)`
- Off-frame excluded: —
- Removed references: `vehicle-celestial-ardor-proportional` (scale/proportional diagram is not a storyboard reference (art bible only))
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): location-velari-wormhole-mouth-sheet, vehicle-celestial-ardor-jupiter, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:celestial-ardor (exterior, the ship in frame)

### 017 (`festival-master:shot-plan-017:take-01`)

- Visible entities: `character:zao (in focus, center frame)`
- Off-frame excluded: —
- Removed references: `object-harlan-wrist-device-sheet` (prop is Harlan's wrist device; the shot shows Zao's own wrist dosimeter)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-zao-sheet, location-celestial-ardor-engineering-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → MCU

### 018 (`festival-master:shot-plan-018:take-01`)

- Visible entities: `character:zao (screen left, arms crossed, facing Harlan across the passage)`, `character:harlan (screen right, facing Zao across the passage)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-inner-shielding-vault-sheet
- imageStatus: needs_regeneration [continuity_error]

### 019 (`festival-master:shot-plan-019:take-01`)

- Visible entities: `character:zao (screen left near the vault access door, remaining in place, watching Harlan go)`, `character:harlan (departing screen right, back to camera, walking away alone in the opposite direction from Zao)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-inner-shielding-vault-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size ELS → MLS

### 020 (`festival-master:shot-plan-020:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-proxima-geophysical-impulse-package-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)

### 021 (`festival-master:shot-plan-021:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-proxima-geophysical-impulse-package-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)

### 023 (`festival-master:shot-plan-023:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:harlan (present, listening)`, `character:sorell (present, listening)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: —
- Added references: `character-rao-sheet` (Rao is on frame among the bridge crew facing forward), `character-okoye-sheet` (Okoye is on frame among the bridge crew facing forward)
- Stale or invalid found: location:celestial-ardor-command-vestibule (entity removed from locations.json 2026-09-13)
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-harlan-sheet, character-voss-sheet, character-sorell-sheet, location-celestial-ardor-bridge-realistic-reference, location-celestial-ardor-bridge-service-shaft-reference, character-rao-sheet, character-okoye-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → MLS

### 024 (`festival-master:shot-plan-024:take-01`)

- Visible entities: `character:harlan (foreground, back to camera, beside the service hatch)`, `object:harlan-wrist-device (Harlan touches the device)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: location:celestial-ardor-command-vestibule (entity removed from locations.json 2026-09-13)
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-harlan-sheet, location-celestial-ardor-bridge-realistic-reference, location-celestial-ardor-bridge-service-shaft-reference, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:harlan-wrist-device (Harlan touches the device)

### 026 (`festival-master:shot-plan-026:take-01`)

- Visible entities: `character:harlan (center frame, alone, flying through the service shaft toward the panel)`, `object:wired-comms-deck-patch-panel (hinged tray below the service hatch, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-harlan-sheet, location-celestial-ardor-service-cylinder-sheet, location-celestial-ardor-central-access-sheet, object-wired-comms-deck-patch-panel-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13 visibleRefs += object:wired-comms-deck-patch-panel (hinged tray below the service hatch, in frame)

### 027 (`festival-master:shot-plan-027:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-sorell-sheet, character-voss-sheet, location-celestial-ardor-service-cylinder-sheet
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size CU → MCU

### 028 (`festival-master:shot-plan-028:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-sorell-sheet, location-celestial-ardor-service-cylinder-sheet
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size OTS → MCU

### 029 (`festival-master:shot-plan-029:take-01`)

- Visible entities: `character:zao (in focus, center frame)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → MCU

### 030 (`festival-master:shot-plan-030:take-01`)

- Visible entities: `character:zao (in focus, center frame)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet
- imageStatus: needs_regeneration [continuity_error]

### 031 (`festival-master:shot-plan-031:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 032 (`festival-master:shot-plan-032:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 033 (`festival-master:shot-plan-033:take-01`)

- Visible entities: `character:zao (in focus, center frame)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet
- imageStatus: needs_regeneration [continuity_error, quality]

### 034 (`festival-master:shot-plan-034:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 035 (`festival-master:shot-plan-035:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 036 (`festival-master:shot-plan-036:take-01`)

- Visible entities: `character:zao (present, listening)`, `character:harlan (speaking, in focus)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 037 (`festival-master:shot-plan-037:take-01`)

- Visible entities: `character:zao (present, listening)`, `character:harlan (speaking, in focus)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 038 (`festival-master:shot-plan-038:take-01`)

- Visible entities: `character:zao (present, listening)`, `character:harlan (speaking, in focus)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-zao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 039 (`festival-master:shot-plan-039:take-01`)

- Visible entities: `character:harlan (in focus, center frame)`, `object:harlan-wrist-device (Harlan rekeys the vault with it)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:harlan-wrist-device (Harlan rekeys the vault with it)

### 040b (`festival-master:shot-plan-040b:take-01`)

- Visible entities: `vehicle:celestial-ardor (exterior, the ship in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): location-velari-wormhole-mouth-sheet, vehicle-celestial-ardor-model-sheet-v2
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:celestial-ardor (exterior, the ship in frame)

### 041 (`festival-master:shot-plan-041:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-voss-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference, location-velari-wormhole-mouth-sheet
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size INSERT → MS

### 043 (`festival-master:shot-plan-043:take-01`)

- Visible entities: `character:sorell (center, still holding Zao’s body, handset raised)`, `character:zao (center, held by Sorell)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-sorell-sheet, character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 044 (`festival-master:shot-plan-044:take-01`)

- Visible entities: `character:harlan (center frame, alone, at the reconnected communications tray)`, `object:harlan-wrist-device (worn on Harlan’s wrist)`, `object:wired-comms-deck-patch-panel (tray at which the trunks are reconnected)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-harlan-sheet, location-celestial-ardor-bridge-realistic-reference, object-wired-comms-deck-patch-panel-sheet, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:harlan-wrist-device (worn on Harlan’s wrist) visibleRefs += object:wired-comms-deck-patch-panel (tray at which the trunks are reconnected) locationId location:celestial-ardor-reactor-service-bay → location:celestial-ardor-bridge (description: bridge-side hatch / bridge compartment; bridge sheet was already the attached authority)

### 045 (`festival-master:shot-plan-045:take-01`)

- Visible entities: `character:harlan (foreground, alone, glancing toward a monitor inset showing Sorell and Zao)`
- Off-frame excluded: —
- Removed references: `object-wired-comms-deck-patch-panel-sheet` (close-up on Harlan and the monitor; tray not on frame)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-harlan-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [continuity_error]
- Notes: locationId location:celestial-ardor-reactor-service-bay → location:celestial-ardor-bridge (description: bridge-side hatch / bridge compartment; bridge sheet was already the attached authority)

### 045b (`festival-master:shot-plan-045b:take-01`)

- Visible entities: `character:harlan (moving through the service route)`, `character:okoye (moving with Harlan toward the outer bay)`
- Off-frame excluded: —
- Removed references: `object-wired-comms-deck-patch-panel-sheet` (characters moving through the service route; tray not on frame)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-harlan-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference, location-celestial-ardor-service-cylinder-sheet
- imageStatus: needs_regeneration [continuity_error]

### 046 (`festival-master:shot-plan-046:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:harlan (speaking, in focus)`, `character:sorell (present, listening)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: —
- Added references: `character-okoye-sheet` (Okoye supervises Sorell on frame)
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, location-celestial-ardor-bridge-realistic-reference, character-okoye-sheet
- imageStatus: needs_regeneration [continuity_error]

### 047 (`festival-master:shot-plan-047:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size INSERT → MS

### 053 (`festival-master:shot-plan-053:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size INSERT → MS

### 054 (`festival-master:shot-plan-054:take-01`)

- Visible entities: `character:rao (speaking, in focus)`, `character:okoye (present, listening)`, `character:harlan (present, listening)`, `character:voss (present, listening)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-rao-sheet, character-okoye-sheet, character-harlan-sheet, character-voss-sheet, location-celestial-ardor-central-access-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-inner-shielding-vault-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 055 (`festival-master:shot-plan-055:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-okoye-sheet, character-harlan-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size ELS → MS central-access reference sheet replaced in place on 2026-09-13

### 056 (`festival-master:shot-plan-056:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-rao-sheet, character-okoye-sheet, character-harlan-sheet, character-voss-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 057 (`festival-master:shot-plan-057:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:harlan (speaking, in focus)`, `character:rao (speaking, in focus)`, `character:okoye (present, listening)`
- Off-frame excluded: `character:sorell`
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-voss-sheet, character-harlan-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size CU → MCU off-frame: character:sorell — medium close-up on Rao at her station with Harlan; Sorell not on frame

### 059 (`festival-master:shot-plan-059:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-harlan-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size INSERT → MCU

### 060 (`festival-master:shot-plan-060:take-01`)

- Visible entities: `character:rao (speaking, in focus, at her bridge station)`, `character:voss (at frame edge, listening)`, `character:sorell (at frame edge, listening)`
- Off-frame excluded: `character:harlan`, `character:okoye`
- Removed references: `character-harlan-sheet`, `character-okoye-sheet`, `character-zao-sheet`, `location-celestial-ardor-reactor-service-bay-sheet`, `location-celestial-ardor-inner-shielding-vault-sheet`, `object-optical-contingency-transmitter-sheet`
- Added references: —
- Stale or invalid found: character:zao listed as present on the bridge after her death (master b3–b5, e2); reactor-service-bay, inner-vault, and optical-transmitter sheets attached for locations/props not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-rao-sheet, character-voss-sheet, character-sorell-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]
- Notes: Canon-presence correction: Zao removed from visibleRefs (not off-frame either); secondaryLocationIds removed; nine references reduced to four.

### 061 (`festival-master:shot-plan-061:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:harlan (present, listening)`, `character:sorell (present, listening)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: `character-zao-sheet`
- Added references: —
- Stale or invalid found: character:zao listed as present on the bridge after her death
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [canon_mismatch]
- Notes: Canon-presence correction: Zao removed from visibleRefs and references.

### 062 (`festival-master:shot-plan-062:take-01`)

- Visible entities: `character:zao (in focus, center frame)`, `object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-zao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-proxima-geophysical-impulse-package-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)

### 065 (`festival-master:shot-plan-065:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [wrong_composition]
- Notes: composition.size INSERT → MS

### 070 (`festival-master:shot-plan-070:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:harlan (present, listening)`, `character:sorell (present, listening)`, `character:rao (speaking, in focus)`, `character:okoye (present, listening)`, `object:harlan-wrist-device (on Harlan’s wrist as Voss orders it taken)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-voss-sheet, character-harlan-sheet, character-sorell-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:harlan-wrist-device (on Harlan’s wrist as Voss orders it taken)

### 071 (`festival-master:shot-plan-071:take-01`)

- Visible entities: `character:harlan (speaking, in focus)`, `character:okoye (present, listening)`, `character:voss (present, listening)`, `character:sorell (present, listening)`, `object:harlan-wrist-device (extended toward Okoye)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-harlan-sheet, character-okoye-sheet, character-voss-sheet, character-sorell-sheet, location-celestial-ardor-bridge-realistic-reference, location-celestial-ardor-service-cylinder-sheet, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → MS visibleRefs += object:harlan-wrist-device (extended toward Okoye)

### 074 (`festival-master:shot-plan-074:take-01`)

- Visible entities: `character:rao (speaking, in focus)`, `character:harlan (present, listening)`, `character:voss (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (7): character-rao-sheet, character-harlan-sheet, character-voss-sheet, character-okoye-sheet, location-celestial-ardor-central-access-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-service-cylinder-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 075 (`festival-master:shot-plan-075:take-01`)

- Visible entities: `character:rao (present, listening)`, `character:harlan (speaking, in focus)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-rao-sheet, character-harlan-sheet, location-celestial-ardor-reactor-service-bay-sheet
- imageStatus: needs_regeneration [continuity_error, quality]

### 076 (`festival-master:shot-plan-076:take-01`)

- Visible entities: (unchanged)
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-voss-sheet, character-okoye-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: central-access reference sheet replaced in place on 2026-09-13

### 077 (`festival-master:shot-plan-077:take-01`)

- Visible entities: `character:harlan (present, listening)`, `character:rao (present, listening)`, `character:voss (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-harlan-sheet, character-rao-sheet, character-voss-sheet, character-okoye-sheet, location-celestial-ardor-reactor-service-bay-sheet, location-celestial-ardor-central-access-sheet
- imageStatus: needs_regeneration [continuity_error, wrong_composition]
- Notes: composition.size INSERT → LS central-access reference sheet replaced in place on 2026-09-13

### 078 (`festival-master:shot-plan-078:take-01`)

- Visible entities: `character:harlan (present, listening)`, `character:rao (present, listening)`, `character:voss (present, listening)`, `character:okoye (speaking, in focus)`, `object:harlan-wrist-device (recovered by Okoye)`
- Off-frame excluded: —
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-harlan-sheet, character-rao-sheet, character-voss-sheet, character-okoye-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-harlan-wrist-device-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:harlan-wrist-device (recovered by Okoye)

### 079 (`festival-master:shot-plan-079:take-01`)

- Visible entities: `character:harlan (speaking, in focus)`, `character:rao (present, listening)`, `character:voss (speaking, in focus)`, `character:okoye (present, listening)`, `object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (6): character-harlan-sheet, character-rao-sheet, character-voss-sheet, character-okoye-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [continuity_error, quality]
- Notes: visibleRefs += object:optical-contingency-transmitter (optical-array local control console in the outer bay, in frame)

### 080 (`festival-master:shot-plan-080:take-01`)

- Visible entities: `character:rao (speaking, in focus)`, `character:voss (present, listening)`, `object:harlan-wrist-device (recovered wrist device in Rao’s hand)`
- Off-frame excluded: `character:okoye`, `character:harlan`
- Removed references: `object-optical-contingency-transmitter-sheet` (optical-array console not on frame in this framing/location)
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-rao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-harlan-wrist-device-sheet, character-voss-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: off-frame: character:okoye, character:harlan — medium shot on Rao opening the vault with Voss visibleRefs += object:harlan-wrist-device (recovered wrist device in Rao’s hand)

### 081 (`festival-master:shot-plan-081:take-01`)

- Visible entities: `character:rao (speaking, in focus)`, `object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)`, `object:time-reference-diagnostic-unit (portable diagnostic unit beside the bomb, in frame)`
- Off-frame excluded: `character:voss`, `character:okoye`, `character:harlan`
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-rao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-proxima-geophysical-impulse-package-sheet, object-time-reference-diagnostic-unit-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:proxima-geophysical-impulse-package (the armed device and its controller, in frame) visibleRefs += object:time-reference-diagnostic-unit (portable diagnostic unit beside the bomb, in frame) off-frame: character:voss, character:okoye, character:harlan — close-up on Rao and the device

### 082 (`festival-master:shot-plan-082:take-01`)

- Visible entities: `character:rao (speaking, in focus)`, `character:okoye (present, listening)`, `character:harlan (present, listening)`, `object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-rao-sheet, location-celestial-ardor-inner-shielding-vault-sheet, object-proxima-geophysical-impulse-package-sheet, character-okoye-sheet, character-harlan-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += object:proxima-geophysical-impulse-package (the armed device and its controller, in frame)

### 083 (`festival-master:shot-plan-083:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:sorell (present, listening)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-sorell-sheet, character-voss-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [canon_mismatch, wrong_composition]
- Notes: composition.size INSERT → MCU Canon-presence correction: character:harlan removed (not in this space).

### 084 (`festival-master:shot-plan-084:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:sorell (speaking, in focus)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-sorell-sheet, character-voss-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [canon_mismatch]
- Notes: Canon-presence correction: character:harlan removed (not in this space).

### 085 (`festival-master:shot-plan-085:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:sorell (speaking, in focus)`, `character:rao (present, listening)`, `character:okoye (present, listening)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-sorell-sheet, character-voss-sheet, character-rao-sheet, character-okoye-sheet, location-celestial-ardor-bridge-realistic-reference
- imageStatus: needs_regeneration [canon_mismatch]
- Notes: Canon-presence correction: character:harlan removed (not in this space).

### 086 (`festival-master:shot-plan-086:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:sorell (present, listening)`, `character:rao (present, listening)`
- Off-frame excluded: `character:okoye`
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (5): character-voss-sheet, character-sorell-sheet, character-rao-sheet, location-celestial-ardor-bridge-realistic-reference, location-velari-station-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]
- Notes: Canon-presence correction: character:harlan removed (not in this space). off-frame: character:okoye — medium shot at the windows: Voss, Sorell, Rao on frame

### 087 (`festival-master:shot-plan-087:take-01`)

- Visible entities: `character:voss (present, listening)`, `character:sorell (speaking, in focus)`
- Off-frame excluded: `character:rao`, `character:okoye`
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-sorell-sheet, character-voss-sheet, location-velari-station-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]
- Notes: Canon-presence correction: character:harlan removed (not in this space). off-frame: character:rao, character:okoye — close-up on Sorell with Voss

### 088 (`festival-master:shot-plan-088:take-01`)

- Visible entities: `character:sorell (speaking, in focus)`, `vehicle:velari-transport-sphere (the Velari transport sphere, in frame)`
- Off-frame excluded: `character:voss`, `character:rao`, `character:okoye`
- Removed references: —
- Added references: —
- Stale or invalid found: character:harlan listed as present — restrained in the outer bay after 079 (master f/g: Okoye keeps watch aft); not on the bridge
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-sorell-sheet, vehicle-velari-transport-sphere-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]
- Notes: Canon-presence correction: character:harlan removed (not in this space). off-frame: character:voss, character:rao, character:okoye — over-the-shoulder on Sorell toward the sphere visibleRefs += vehicle:velari-transport-sphere (the Velari transport sphere, in frame)

### 089 (`festival-master:shot-plan-089:take-01`)

- Visible entities: `character:sorell (present, listening)`, `character:voss (present, listening)`, `vehicle:velari-transport-sphere (the Velari transport sphere, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-sorell-sheet, character-voss-sheet, vehicle-velari-transport-sphere-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:velari-transport-sphere (the Velari transport sphere, in frame)

### 091 (`festival-master:shot-plan-091:take-01`)

- Visible entities: `character:sorell (in focus, center frame)`, `vehicle:velari-transport-sphere (the Velari transport sphere, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (2): character-sorell-sheet, vehicle-velari-transport-sphere-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:velari-transport-sphere (the Velari transport sphere, in frame)

### 092 (`festival-master:shot-plan-092:take-01`)

- Visible entities: `character:sorell (in focus, center frame)`, `vehicle:velari-transport-sphere (the Velari transport sphere, in frame)`, `character:velari-envoy (the Velari envoy inside the sphere, in frame)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (3): character-sorell-sheet, vehicle-velari-transport-sphere-sheet, character-velari-envoy-sheet
- imageStatus: needs_regeneration [continuity_error]
- Notes: visibleRefs += vehicle:velari-transport-sphere (the Velari transport sphere, in frame) visibleRefs += character:velari-envoy (the Velari envoy inside the sphere, in frame)

### 095 (`festival-master:shot-plan-095:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:zao (on the console display only (personnel photograph); not physically present)`, `object:optical-contingency-transmitter (optical-array local control console; Voss transmits from it)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-voss-sheet, character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error]
- Notes: Canon-presence correction: Zao is present only as a photograph on the display; role updated, sheet retained for the display likeness. visibleRefs += object:optical-contingency-transmitter (optical-array local control console; Voss transmits from it)

### 096 (`festival-master:shot-plan-096:take-01`)

- Visible entities: `character:voss (speaking, in focus)`, `character:zao (on the console display only (personnel photograph); not physically present)`, `object:optical-contingency-transmitter (optical-array local control console; Voss transmits from it)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: still
- Final still references (4): character-voss-sheet, character-zao-sheet, location-celestial-ardor-reactor-service-bay-sheet, object-optical-contingency-transmitter-sheet
- imageStatus: needs_regeneration [canon_mismatch, continuity_error, wrong_composition]
- Notes: Canon-presence correction: Zao is present only as a photograph on the display; role updated, sheet retained for the display likeness. composition.size INSERT → MCU visibleRefs += object:optical-contingency-transmitter (optical-array local control console; Voss transmits from it)

### title (`festival-master:shot-plan-title:take-01`)

- Visible entities: `vehicle:celestial-ardor (distant ship visible near the station)`
- Off-frame excluded: —
- Removed references: —
- Added references: —
- Stale or invalid found: —
- Replacements: —
- Unresolved blocker: none
- Affects: video (gate) + still (dedupe)
- Final still references (2): location-proxima-station-berthed, vehicle-celestial-ardor-jupiter
- imageStatus: needs_review [quality]; productionGate deferred (medium video)
- Notes: Duplicate asset:vehicle-celestial-ardor-jupiter removed (listed twice). scene-00-title setting.interiorExterior INT → EXT (exterior establishing view).

## Composition size changes (placeholder cycle re-authored)

| Shot | From | To |
| --- | --- | --- |
| 005 | INSERT | MCU |
| 006 | MCU | LS |
| 009 | CU | MCU |
| 010 | INSERT | LS |
| 011 | INSERT | MS |
| 016 | OTS | MCU |
| 017 | INSERT | MCU |
| 019 | ELS | MLS |
| 023 | INSERT | MLS |
| 027 | CU | MCU |
| 028 | OTS | MCU |
| 029 | INSERT | MCU |
| 041 | INSERT | MS |
| 047 | INSERT | MS |
| 053 | INSERT | MS |
| 055 | ELS | MS |
| 057 | CU | MCU |
| 059 | INSERT | MCU |
| 065 | INSERT | MS |
| 071 | INSERT | MS |
| 077 | INSERT | LS |
| 083 | INSERT | MCU |
| 096 | INSERT | MCU |

## Regeneration debt (imageStatus: needs_regeneration)

94 of 104 takes. Reasons: canon_mismatch=19, continuity_error=67, wrong_composition=23, quality=25. Ten central-shaft takes (013, 014, 015, 026, 054, 055, 056, 074, 076, 077) are included because the central-access sheet was replaced in place on 2026-09-13. Debt never blocks a still job.

## Video-only holds

- title: deferred (medium video, video_deferred_external_reference, prerequisite asset:location-proxima-station-exterior-guide-still)
- 006: deferred (medium video, video_deferred_external_reference, prerequisite asset:location-proxima-station-exterior-guide-still)
- 007: deferred (medium video, video_deferred_external_reference, prerequisite asset:location-proxima-station-exterior-guide-still)
- 008: deferred (medium video, video_deferred_external_reference, prerequisite asset:location-proxima-station-exterior-guide-still)
- 009: deferred (medium video, video_deferred_external_reference, prerequisite asset:location-proxima-station-exterior-guide-still)

No take carries a still or all-media hold.

