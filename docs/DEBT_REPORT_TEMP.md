# Debt audit snapshot

> **Status:** point-in-time audit captured on 2026-08-26 before the subsequent documentation synchronization. `TODO.md` is the canonical live debt register and `docs/PROJECT_STATUS.md` is the current status summary. In particular, the contradictions enumerated under “Documentation debt” below were corrected or explicitly marked historical in the same follow-up task; they remain in this snapshot as evidence of what the audit found, not as open findings. The statement that the worktree was clean also describes the start of the audit, before those documentation edits.

## Current health

  - Latest GitHub Pages deployment succeeded (https://github.com/saabi/light-delay/actions/runs/33016840435). 
  - Worktree is clean; master matches origin/master.                                                          
  - No open GitHub issues or pull requests.                                                                   
  - npm run validate:data: passes.                                                                            
  - All 130 registered assets currently exist on disk.                                                        
  - Manual graph audit found no broken act/scene/beat/cue/shot/take relationships.                            
  - Playwright: 12/12 tests pass locally.                                                                     
  - ESLint passes.                                                                                            
  - npm run lint nevertheless fails because Prettier reports 16 unformatted files.                            
                                                                                                              
  ## Highest-priority technical debt                                                                          
                                                                                                              
  1. Unsafe legacy extractor                                                                                  
                                                                                                              
  npm run extract:legacy is still advertised as useful, but its own warning says it should not be run over the
  migrated tree. It overwrites project.json, entities, assets, documents and the synchronization report using 
  the obsolete pre-migration format.                                                                          
                                                                                                              
  Evidence: /E:/Work/light-delay/scripts/extract-legacy.mjs:11, /E:/Work/light-delay/package.json:19, /E:/    
  Work/light-delay/README.md:41.                                                                              
                                                                                                              
  It should be retired, renamed as an archival command, or changed to write into a temporary extraction       
  directory.                                                                                                  
                                                                                                              
  2. Schema and validator drift                                                                               
                                                                                                              
  The schema is effectively maintained in Markdown, TypeScript, a separate JavaScript validator and unchecked 
  JSON casts.                                                                                                 
                                                                                                              
  A concrete failure already exists: the trailer has 29 notes with type editorial, while Note.type does not   
  permit that value. Validation and type-checking still pass because JSON is cast directly to ScriptFile and  
  assertJsonModule only checks that it is an object.                                                          
                                                                                                              
  Evidence: /E:/Work/light-delay/src/lib/types/common.ts:10, /E:/Work/light-delay/data/scripts/light-delay-   
  trailer.json:1354, /E:/Work/light-delay/src/lib/data/repositories/index.ts:35, /E:/Work/light-delay/src/lib/  data/loaders/loadJson.ts:14.                                                                                
                                                                                                              
  The validator also does not enforce several requirements already listed in the migration plan:              
                                                                                                              
  - Actual asset-file existence.                                                                              
  - Most foreign-key and parent/child relationships.                                                          
  - Ordering.                                                                                                 
  - Cue-placement bounds.                                                                                     
  - Selected takes belonging to their shot.                                                                   
  - Note type/status correctness.                                                                             
                                                                                                              
  Current data passed a separate audit, but CI would not catch future violations. See /E:/Work/light-delay/   
  docs/MIGRATION_PLAN.md:333.                                                                                 
                                                                                                              
  3. Unsupported Node runtime                                                                                 
                                                                                                              
  .nvmrc pins Node 25, which reached end of life on March 31, 2026. CI is therefore building with an          
  unsupported runtime. Node 24 is the current LTS line. Node.js EOL information                               
  (https://nodejs.org/en/about/eol).                                                                          
                                                                                                              
  Evidence: /E:/Work/light-delay/.nvmrc:1, /E:/Work/light-delay/docs/PROJECT_STATUS.md:61.                    
                                                                                                              
  4. Incomplete CI quality gate                                                                               
                                                                                                              
  Pages CI runs data validation, Svelte checking, unit tests and build, but not formatting, ESLint or browser 
  tests.                                                                                                      
                                                                                                              
  Currently:                                                                                                  
                                                                                                              
  - Prettier fails on 16 files.                                                                               
  - ESLint passes independently.                                                                              
  - All 12 E2E tests pass locally, but CI would not catch a browser regression.                               
                                                                                                              
  Evidence: /E:/Work/light-delay/.github/workflows/pages.yml:29, /E:/Work/light-delay/package.json:14.        
                                                                                                              
  ## Canon and narrative debt                                                                                 
                                                                                                              
  The following explicit decisions remain unresolved:
                                                                                                              
  - Master chronology: T+24 h versus T+26.5 h.                                                                
  - “Option B” trajectory/course-correction mechanism.                                                        
  - Consistent terminology for AI, mediation, diplomatic core, quantum core and envelope.                     
  - Real running time: 30:00 is an authored timing target, not a timed performance.                           
  - Exact optical link budget for Zao’s laser: trajectory uncertainty, wavelength, aperture, pulse energy,    
    coding and receiver sensitivity.                                                                          
                                                                                                              
  - Volkov’s specialization and Tanaka’s entire mission function.                                             
  - Whether to back-propagate Vega, richer specialist texture and clearer relay preparation into shorter      
    scripts.                                                                                                  
                                                                                                              
  Primary register: /E:/Work/light-delay/docs/PROJECT_STATUS.md:45, /E:/Work/light-delay/TODO.md:26.          
                                                                                                              
  Technical design also retains revisable parameters:                                                         
                                                                                                              
  - Ardor: 18 m diameter, room/deck distribution, elevator capacity, trunk diameters, radiator and tank       
    geometry.
                                                                                                              
  - Proxima: 110 m habitat length, dock count, mass, population, power architecture, internal distribution and    radiator geometry.                                                                                        
                                                                                                              
  See /E:/Work/light-delay/docs/technical/CELESTIAL_ARDOR.md:306 and /E:/Work/light-delay/docs/technical/     
  PROXIMA_STATION.md:265.                                                                                     
                                                                                                              
  ## Script and production debt                                                                               
                                                                                                              
  - Main short: 17 scenes, 112 shots/takes, but 33 takes need replacement stills.                             
  - Festival Cut: seven scenes and 13 cues, but zero shots, takes or canonical images.                        
  - Trailer: 29 shots/takes; still needs rhythm refinement, possible title stills and audio.                  
  - Long treatment: 28 scenes/beats, but no dialogue cues, shots or takes. Development is intentionally       
    blocked on editorial review.                                                                              
                                                                                                              
  - All four registered scripts remain draft.                                                                 
  - Scenes 13–14 still need movement reviewed against transverse decks and 1 g deceleration.                  
  - Boarding/docking references such as ramps need checking against the external nose-first Proxima collar.   
  - Old Ardor artwork still depicts incompatible geometry in places.                                          
  - Harlan needs visual separation from Voss.                                                                 
  - Rao’s name remains phonetically close to Zao; the canon decision must precede possible sheet/UI           
    regeneration.                                                                                             

  See /E:/Work/light-delay/TODO.md:17 and /E:/Work/light-delay/higgsfield-uploads/TODO.md:7.                  
                                                                                                              
  Visual coverage is also incomplete: 10 of 21 catalogued characters currently have no reference asset. Some  
  are minor or long-treatment-only characters, so this should be prioritized by production need rather than   
  filled automatically.                                                                                       
                                                                                                              
  ## Localization and media debt                                                                              
                                                                                                              
  Narrative translation remains almost entirely pending:                                                      
                                                                                                              
  - 118 dialogue cues across the main, Festival and trailer scripts; none has an English variant.             
  - The trailer also has 14 untranslated text cues.                                                           
  - Action, beat, scene and shot prose lacks localized variants.                                              
  - Five migrated prose documents have English content, but all five remain draft; none is reviewed.          
  - The canon document is still a four-block stub.                                                            
  - Three historical/review documents are represented only by a single Spanish block.                         
                                                                                                              
  The media catalogue contains 130 images and no audio or video. Ten Spanish voice profiles exist, but none   
  has a sample asset. This encompasses the trailer audio debt and any future voiced animatic work.            
                                                                                                              
  ## Asset provenance and rights debt                                                                         
                                                                                                              
  Of 130 assets:                                                                                              
                                                                                                              
  - 129 have no source record.                                                                                
  - All 130 lack an exact model field.                                                                        
  - Prompts, negative prompts, seeds, references, edits, platform identifiers and competition eligibility     
    remain unavailable or unverified.                                                                         
                                                                                                              
  This is significant before festival submission or broader distribution. See /E:/Work/light-delay/docs/      
  ASSET_PROVENANCE.md:14.                                                                                     
                                                                                                              
  The full dependency audit reports three low-severity development-chain findings through SvelteKit’s cookie  
  dependency; the production-only audit reports zero vulnerabilities. Remediation should be tested carefully  
  rather than applying the audit’s anomalous downgrade suggestion automatically. GHSA-pxg6-pf52-xh8x          
  (https://github.com/advisories/GHSA-pxg6-pf52-xh8x).                                                        
                                                                                                              
  ## Editorial workflow debt                                                                                  
                                                                                                              
  The planned author-note system remains unimplemented.                                                       
                                                                                                              
  There are presently 111 note records, but they lack stable IDs, workflow status, priority, authorship,      
  dates, target paths, suggested actions and acceptance criteria. There is no deterministic notes:build       
  command or generated pending-notes report.                                                                  
                                                                                                              
  The existing resolved?: boolean convention also cannot distinguish informational notes from actionable debt 
  reliably. See /E:/Work/light-delay/TODO.md:5.                                                               
                                                                                                              
  Duration edits remain browser-local. There is no JSON export/import or server-backed editorial persistence. 
                                                                                                              
  ## Documentation debt                                                                                       
                                                                                                              
  Several documents now contradict the implementation:                                                        
                                                                                                              
  - /E:/Work/light-delay/README.md:75 still calls the legacy HTML screenplay canonical, despite the           
    application using structured JSON.                                                                        
                                                                                                              
  - /E:/Work/light-delay/docs/PRODUCTION_PLAN.md:8 says the animatic has 100 shots and that Festival has no   
    script; current data has 112 main shots and a Festival draft.                                             
                                                                                                              
  - /E:/Work/light-delay/docs/PROJECT_STATUS.md:51 calls Festival’s seven units “sequences”; the JSON contains    seven scenes and zero Sequence records.                                                                   
                                                                                                              
  - /E:/Work/light-delay/docs/SVELTEKIT_SETUP.md:192 still says to use adapter-auto, that deployment is       
    undecided and that i18n was not selected.                                                                 
                                                                                                              
  - /E:/Work/light-delay/docs/MIGRATION_PLAN.md:3 still labels itself an initial proposal and describes       
    completed phases as future work.                                                                          
                                                                                                              
  - /E:/Work/light-delay/data/README.md:12 says most documents are stubs.                                     
  - Historical full-feature files contain FTL mechanics and an obsolete “add four characters” TODO without an 
    inline archival warning. Their separate review marks them historical, but the source files themselves     
    remain easy to misread.                                                                                   
    ship’s standard external laser and dedicated local control.

  - Animatic scene titles remain deliberately different from screenplay headings and still need editorial     
    refinement.

  ## Storage and platform debt

  - legacy-site/assets and static/assets contain 129 byte-identical files, duplicating 225,995,072 bytes—about
    216 MiB.

  - The duplication is currently justified by regression-reference policy, but should be removed after a      
    recorded parity sign-off.

  - The generic authoring engine remains coupled to Light Delay content and has no reusable software license. 
  - Generator scripts hardcode substantial narrative content, creating additional source-of-truth ambiguity   
    beside the generated JSON.
