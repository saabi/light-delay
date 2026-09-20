# V2 architecture acceptance scenarios

Status: **architecture tests**. These are domain acceptance scenarios, not yet automated tests.

A proposed v2 schema or service design should be rejected if it requires project-specific hacks to satisfy these cases.

## A. Light Delay: Zao's delayed recording

Zao records a warning early. The recording persists. Later the crew plays it after Zao has died.

Expected:
- recording event, playback event and represented/captured content are distinct;
- Zao need not be physically present at playback;
- narrative order may place playback late while represented content is early;
- system classifies this as diegetic/mediated presentation, not necessarily flashback;
- send/receive/store delays can be represented;
- audience knowledge changes at playback, not capture, unless another presentation reveals it earlier.

## B. True flashback

At story time T24, the film directly presents an event from T1 with no diegetic recording.

Expected:
- chronology remains T1;
- narrative presentation occurs at later narrative position;
- mode may be flashback;
- no media artifact is required.

## C. Unreliable memory

A character remembers an event inaccurately.

Expected:
- remembered representation can differ from actual-world event;
- memory context/presentation does not overwrite actual chronology;
- reliability/truth is separate from world-context kind.

## D. Time travel with linear subjective continuity

A traveler experiences: 1985 departure -> 1955 arrival -> 1955 actions -> altered/returned 1985.

Expected:
- the traveler's experienced order remains linear even though world/calendar time moves backward;
- causal order is not inferred from calendar timestamps;
- narrative order may independently remain linear or be rearranged;
- no second timeline is required merely because time travel occurred.

## E. Fixed-loop time travel

A traveler goes into the past and causes an event that was already part of the history they departed from.

Expected:
- one history context can represent the loop;
- validators do not require a divergence merely because causal order crosses world-time order;
- project/profile may declare fixed-loop temporal semantics.

## F. Mutable/branching history

A past intervention changes later history.

Expected:
- project can represent a predecessor history and altered history with an explicit divergence event;
- mutable-history and branching semantics remain distinguishable by project temporal model;
- entities/events retain provenance across history contexts where identity continuity is meaningful;
- ordinary linear projects need not create HistoryContext objects.

## G. Ardor bridge: gravity-dependent crossing

Meal table and crew stations have a safe around-rail route. A direct route crosses the central opening and is safe only in microgravity.

Expected:
- in 1g, around-rail remains reachable and direct crossing is disabled;
- in microgravity, both may be reachable;
- containment under the same Bridge does not itself establish reachability;
- camera/still location semantics remain independent of nav waypoints.

## H. Harlan blocks the route

Harlan occupies a required waypoint/edge with hostile stance.

Expected:
- pathfinding can avoid him if another valid route exists;
- otherwise it reports a forced encounter/blocker;
- moving Harlan changes navigation without changing permanent geography;
- an unexplained story movement through the blocker can produce a validation finding.

## I. Multi-level elevator/shaft

Deck 1 to Deck 5 normally traverses intermediate segments/interfaces.

Expected:
- a locked Deck-3 door can prevent entry/exit at Deck 3 without necessarily preventing passage past it;
- a blocked shaft segment between Deck 3 and Deck 4 prevents travel through that segment;
- levels need not all be shootable locations;
- traversal state is not inferred from containment.

## J. Mobile host

Sorell is aboard the Celestial Ardor while the Ardor leaves Proxima.

Expected:
- Sorell's local placement can remain aboard the Ardor;
- her effective world placement follows the mobile host;
- inventory she carries follows her;
- contained ship inventory follows the ship;
- movement does not require rewriting every contained entity's absolute location.

## K. Dragon with multiple roles

A dragon is a speaking character and can carry/rider-transport another character.

Expected:
- one entity identity can have character/agent/vehicle/carrier roles;
- rider traversal may depend on dragon capabilities;
- carried inventory is supported;
- no duplicate "dragon character" and "dragon vehicle" identity is required.

## L. Range-limited transporter without XYZ

Enterprise-like vessel A is proximity-distance 50 from location B. Its transporter range is 60.

Expected:
- B is a candidate reachable destination;
- changing abstract distance to 70 makes it unreachable;
- no Cartesian coordinates are required;
- moving the vessel can alter effective proximity/reachability.

## M. Fantasy inside an otherwise realistic film

Two friends imagine a dragon battle during one presentation/sequence.

Expected:
- project need not globally become Fantasy;
- scoped world context/profile can add fantasy vocabulary/rules;
- actual-world events remain separate;
- cinematic fantasy treatment is optional and separate from ontology.

## N. Medieval letter

A messenger carries a letter between towns.

Expected:
- letter uses generic Artifact/InformationCarrier concepts;
- no screen/recording-specific core concept is required;
- travel and carrier movement can validate delivery chronology.

## O. Prophecy

A prophecy describes a possible future that may never occur.

Expected:
- represented/proposed future is not automatically an established StoryEvent in the actual world;
- later fulfillment may link to it without retroactively making every detail true.

## P. Linear drama

A user writes a simple short film with no nonlinear time, portals or complex world simulation.

Expected:
- user can work through familiar documents/scenes without manually configuring advanced graphs;
- defaults/inference produce valid minimal semantic state;
- advanced fields remain optional until needed.

## Q. Live-action production without AI generation

Expected:
- shots, setups, takes, continuity and assets work without GenerationSpec;
- AI-generation validation does not produce irrelevant errors.

## R. AI-heavy production

Expected:
- identity/location/object references can be required by policy;
- structured GenerationSpec compiles provider packages;
- reference-budget constraints are provider-specific derived concerns;
- generated output retains provenance to semantic inputs and provider adapter/version.

## S. Hybrid production

An AI previs shot is later replaced by a live-action take.

Expected:
- both realizations retain provenance;
- edit can select the live-action take;
- previs can be superseded without deletion;
- downstream dependencies can distinguish selected/current realization.

## T. Arbitrary import

A user imports an unknown project format containing prose, character tables and shot notes.

Expected:
- source is retained;
- deterministic adapters may handle recognized portions;
- AI may propose mappings for unknown portions;
- ambiguous mappings have confidence/notes and require review;
- import produces proposed semantic ChangeSets rather than direct database writes.

## U. Concurrent collaborators

Two users edit from revision 1842. One changes Rao's costume; another moves Harlan.

Expected:
- operations may rebase if semantically independent and preconditions remain true.

If both change the same portal state or one invalidates the other's assumptions:
- conflict is surfaced for resolution;
- neither edit silently overwrites the other.

## V. Agent against stale revision

An agent prepares a ChangeSet from revision 2100 while project is now 2107.

Expected:
- server checks preconditions/dependencies;
- safe operations may rebase;
- semantically stale proposals are revalidated or rejected for review;
- agent cannot bypass application authorization by writing storage directly.

## W. Staleness from upstream change

A generated shot depends on Sorell identity reference and Ardor geometry. Ardor geometry changes.

Expected:
- dependent media is not deleted or regenerated automatically;
- affected artifact is marked stale with a traceable reason;
- unaffected dependencies remain valid;
- user can inspect the mutation that caused staleness.

## X. Narrative product versus history branch

A Festival Cut is an intentional authored narrative product. Separately, an editor creates an experimental branch for a different third act.

Expected:
- Festival Cut has NarrativeVersion/product identity and lineage;
- experimental branch is project-history state, not automatically another cut;
- branch may merge without creating a narrative product.

## Y. Restore history

User views revision 500 and chooses to restore it.

Expected:
- revisions 501+ remain in history;
- system creates a new ChangeSet whose result resembles revision 500;
- attribution and rationale remain inspectable.

## Z. Light Delay migration

Expected imported project can answer, with provenance:
- Where is Sorell at a selected story/narrative point?
- What does Rao know there?
- Can Sorell reach Engineering under current world state, and why/why not?
- When was Zao's warning captured, sent, received and played?
- Which narrative presentation reveals it?
- Which assets depend on Ardor geometry?
- Which become stale after a geometry mutation?
- Which current artifacts came from master authority versus deprecated rescue material?

Passing this scenario is the primary proof that v2 preserves rather than erases the repository's accumulated design.
