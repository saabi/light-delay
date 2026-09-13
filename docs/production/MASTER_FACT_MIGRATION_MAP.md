# Master fact migration map (Festival ledger → master outline)

**Status:** **applied** 2026-09-13 (author-signed). Live grain is the reminted master outline (`outline.revision` ≥ 21). This table is the **pre-apply review record** of the 1:1 port plus verdicts; post-apply ids, intro steps, and retirements are summarized below and detailed in [`MASTER_FACT_MIGRATION_NOTES.md`](MASTER_FACT_MIGRATION_NOTES.md).

**Apply tooling:** `scripts/apply-master-fact-migration-notes.mjs`, `scripts/fix-festival-fact-cue-bindings.mjs`. Gate: `npm run report:causal-structure`.

## Post-apply active set (33)

| Master id | Intro step | Notes |
| --- | --- | --- |
| `master:fact-voss-misread-motives` | `p2` | Keep |
| `master:fact-harlan-loading-access-open` | `a2` | Moved from `a3` |
| `master:fact-first-thrust-cutoff-done` | `a3b` | Moved from `a3c` |
| `master:fact-fuel-mass-discrepancy` | `a4` | Split from fact-04 |
| `master:fact-neutron-excess-detected` | `a5` | Split from fact-04 |
| `master:fact-impulse-package-identified` | `b1b` | Keep |
| `master:fact-bridge-hears-cutoff-warning` | `b2` | Split from fact-06 (overt) |
| `master:fact-harlan-jams-wireless` | `b2` | Split from fact-06 (withheld) |
| `master:fact-harlan-cuts-wired-comms-cameras` | `b3` | Split from fact-06 (withheld) |
| `master:fact-only-moving-intercept-left` | `b5` | Moved from `b6` |
| `master:fact-harlan-believes-burst-reached-earth` | `c2` | Narrowed from fact-08 |
| `master:fact-zao-murdered` | `c3` | Split from fact-09 |
| `master:fact-harlan-secures-vault` | `c3a` | New mint |
| `master:fact-flight-controls-cut` | `c3a` | Split from fact-09 |
| `master:fact-sorell-found-zao` | `c4` | Split/move from fact-10 |
| `master:fact-cameras-show-only-rescue` | `c5` | Split from fact-10 |
| `master:fact-harlan-accuses-sorell` | `c7` | Split from fact-11 |
| `master:fact-harlan-accusation-not-proof` | `c9` | Narrowed |
| `master:fact-case-open-station-leg` | `c10` | Keep |
| `master:fact-engine-healthy-separate-causes` | `d2b` | Keep |
| `master:fact-vault-lock-rejects-timing-diagnostic` | `d4` | +`dependsOn` vault secure; description scrubbed |
| `master:fact-burst-corridor-signal-incoming` | `d7` | Keep |
| `master:fact-recording-identifies-bomb-harlan` | `e2` | Renamed/narrowed from fact-16 |
| `master:fact-recording-authenticated` | `e5` | New mint |
| `master:fact-evidence-converges-revoke-harlan` | `e6` | Moved from `e5` |
| `master:fact-aft-console-only-interrupt` | `e6` | Keep (depends on authenticated) |
| `master:fact-harlan-escaped-with-wrist` | `f2` | Keep |
| `master:fact-fourth-cutoff-bypass-stairs` | `f4` | Keep |
| `master:fact-bomb-delayable-scientific-input` | `f5` | Moved from `f6` |
| `master:fact-greeting-completed` | `f6` | Split from fact-22 |
| `master:fact-greeting-authorized-sent` | `g1` | Split from fact-22 |
| `master:fact-station-answered-emissary` | `g2b` | Keep |
| `master:fact-voss-earth-record-credits-zao` | `g3` | Keep |

## Retired (kept as `status: retired`)

`undeclared-mass-neutron-aft`, `sabotage-heard-comms-cut`, `burst-sent-earth-wrong-inference`, `zao-dead-flight-cut-after-murder`, `sorell-found-body-cameras`, `recording-ids-bomb-harlan`, `clean-greeting-prepared`

## Pre-apply review table (1:1 port + verdicts)

| Master id | Legacy id | Festival story | Introduced in master step (1:1) | EN (abbrev) | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `master:fact-voss-misread-motives` | `festival-master:fact-01` | `festival-master:story-01` | `master:story-p2` | Voss has misread Harlan’s fear as hope and Sorell’s caution as reluctanc | Keep | — |
| `master:fact-harlan-loading-access-open` | `festival-master:fact-02` | `festival-master:story-02` | `master:story-a3` | Harlan has legitimate loading and vault access; Zao’s independent rechec | Verify / likely move | Applied → `a2` |
| `master:fact-first-thrust-cutoff-done` | `festival-master:fact-03` | `festival-master:story-03` | `master:story-a3c` | The Ardor has completed its first thrust cutoff and turnover. | Move | Applied → `a3b` |
| `master:fact-undeclared-mass-neutron-aft` | `festival-master:fact-04` | `festival-master:story-04` | `master:story-a5` | Extra fuel indicates undeclared mass; a separate neutron source lies aft | Split | Applied → fuel + neutron |
| `master:fact-impulse-package-identified` | `festival-master:fact-05` | `festival-master:story-05` | `master:story-b1b` | Zao has identified the timed geophysical impulse package; Harlan knows s | Keep | — |
| `master:fact-sabotage-heard-comms-cut` | `festival-master:fact-06` | `festival-master:story-06` | `master:story-b4b` | The bridge heard sabotage but no culprit; Harlan cut wireless, wired com | **Split** | Applied → 3 facts; KE bug fixed |
| `master:fact-only-moving-intercept-left` | `festival-master:fact-07` | `festival-master:story-07` | `master:story-b6` | Zao has eliminated every useful warning route except an undisclosed movi | Move | Applied → `b5` |
| `master:fact-burst-sent-earth-wrong-inference` | `festival-master:fact-08` | `festival-master:story-08` | `master:story-c2` | Zao transmitted a signed burst; Harlan saw the result but wrongly inferr | Split | Applied → belief-only |
| `master:fact-zao-dead-flight-cut-after-murder` | `festival-master:fact-09` | `festival-master:story-09` | `master:story-c3b` | Zao is dead; Harlan disabled bridge flight commands only after the murde | **Split + Move** | Applied → murder / vault / flight |
| `master:fact-sorell-found-body-cameras` | `festival-master:fact-10` | `festival-master:story-10` | `master:story-c5` | Sorell found Zao after the blackout; restored cameras show only the resc | Split + Move | Applied → found + cameras |
| `master:fact-harlan-accusation-not-proof` | `festival-master:fact-11` | `festival-master:story-11` | `master:story-c9` | Harlan’s accusation creates suspicion but does not prove Sorell killed Z | Split or rename | Applied → accuse + not-proof |
| `master:fact-case-open-station-leg` | `festival-master:fact-12` | `festival-master:story-12` | `master:story-c10` | Voss kept the case open during the twenty-three-and-a-half-hour station  | Keep | — |
| `master:fact-engine-healthy-separate-causes` | `festival-master:fact-13` | `festival-master:story-13` | `master:story-d2b` | The engine was healthy; hidden mass and neutrons require separate causes | Keep | — |
| `master:fact-vault-lock-rejects-timing-diagnostic` | `festival-master:fact-14` | `festival-master:story-14` | `master:story-d4` | The local vault lock rejects command authority; Elin left a timing diagn | Verify + rewire dependsOn | Applied |
| `master:fact-burst-corridor-signal-incoming` | `festival-master:fact-15` | `festival-master:story-15` | `master:story-d7` | The burst targeted a moving receiver; an incoming signal now follows its | Keep | — |
| `master:fact-recording-ids-bomb-harlan` | `festival-master:fact-16` | `festival-master:story-16` | `master:story-e2` | Zao’s authenticated recording identifies the bomb, Harlan, the protected | **Split + Move** | Applied with fact-17 |
| `master:fact-evidence-converges-revoke-harlan` | `festival-master:fact-17` | `festival-master:story-17` | `master:story-e5` | Independent evidence converges on Harlan strongly enough to isolate him  | **Split + Move** | Applied → `e6` + auth mint |
| `master:fact-aft-console-only-interrupt` | `festival-master:fact-18` | `festival-master:story-18` | `master:story-e6` | Only the aft local console can interrupt the automatic plan; three minut | Keep | — |
| `master:fact-harlan-escaped-with-wrist` | `festival-master:fact-19` | `festival-master:story-19` | `master:story-f2` | Harlan escaped toward Elin with the wrist device still controlling the l | Keep (minor wording) | — |
| `master:fact-fourth-cutoff-bypass-stairs` | `festival-master:fact-20` | `festival-master:story-20` | `master:story-f4` | The fourth gravity cutoff lets Okoye and Voss bypass the stairs and cont | Keep | — |
| `master:fact-bomb-delayable-scientific-input` | `festival-master:fact-21` | `festival-master:story-21` | `master:story-f6` | The bomb can be delayed through its scientific timing input but is not d | Verify | Applied → `f5` |
| `master:fact-clean-greeting-prepared` | `festival-master:fact-22` | `festival-master:story-22` | `master:story-g1` | Sorell has prepared one clean hull-light greeting and Voss has authorize | Move candidate | Applied → completed + authorized |
| `master:fact-station-answered-emissary` | `festival-master:fact-23` | `festival-master:story-23` | `master:story-g2b` | The station answered and sent a protected Velari emissary to meet Sorell | Keep | — |
| `master:fact-voss-earth-record-credits-zao` | `festival-master:fact-24` | `festival-master:story-24` | `master:story-g3` | Voss sent Earth an independent record crediting Zao while repair and bom | Keep | — |

Sign-off: Author (approved in chat) date: 2026-09-13  
Applied: 2026-09-13
