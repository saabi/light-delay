# V2 Context Engine

Status: **core architecture**.

## Decision

The LLM is not project memory.

Authoritative memory lives in project state: semantic objects, authored documents, history, assets and deterministic indexes. Agent/model executions receive **task-specific context packages** assembled by a Context Engine.

The Context Engine is a core application subsystem, not an implementation detail of an AI provider.

Vector retrieval/RAG is one retrieval strategy inside the Context Engine. It is not the primary authority for facts that can be resolved structurally.

Core rule:

> Retrieve facts structurally when possible; retrieve prose semantically when useful.

## Responsibilities

The Context Engine:

1. receives a task plus an anchor in the project;
2. resolves that anchor to semantic/document context;
3. plans retrieval according to task type and budget;
4. executes deterministic and semantic retrieval;
5. ranks/deduplicates evidence;
6. assembles a bounded ContextPackage;
7. records why each item was included;
8. exposes context provenance to the caller/UI;
9. tracks dependencies so cached derived context can become stale;
10. never silently turns retrieved/inferred material into authoritative project state.

## Anchors

Editor and application state provide strong anchors before any semantic search occurs.

Examples:

```text
cursor / selection
  -> document element
  -> scene / presentation
  -> story event(s)
  -> entities / location
  -> world state
  -> dependencies
```

Other anchors include entity, StoryEvent, NarrativePresentation, spatial node, shot, asset, Finding, ChangeSet/revision and arbitrary document range.

## Retrieval strategies

A resolver may combine:

### Immediate document context
- current selection;
- current paragraph/element;
- surrounding elements;
- current scene/section/document.

### Structural queries
- entity and relationships;
- effective world state;
- chronology;
- narrative position;
- facts/knowledge;
- spatial state and reachability;
- causal/dependency graph;
- profile/rule resolution;
- provenance and staleness.

### Exact lexical retrieval
Full-text/term search for names, phrases, identifiers and explicit references.

### Semantic retrieval (RAG)
Embeddings/vector or equivalent semantic retrieval for fuzzy prose similarity:
- representative character dialogue;
- thematically related passages;
- treatments/notes;
- research;
- stylistic examples;
- similar emotional/cinematic material.

### Dependency retrieval
Follow explicit semantic edges such as setup/payoff, source/derivative, represented event, artifact lifecycle and upstream authority.

### Task working context
Short-lived execution notes, prior tool results and relevant recent interaction within the current AgentExecution.

## ContextPackage

A provider-neutral package should be inspectable and serializable.

```ts
interface ContextPackage {
  id: ContextPackageId;
  projectId: ProjectId;
  projectRevision: ProjectRevision;
  task: ContextTask;
  anchor: ContextAnchor;
  budget: ContextBudget;
  items: ContextItem[];
  omissions?: ContextOmission[];
  createdAt: string;
}

interface ContextItem {
  id: string;
  kind: "document" | "entity" | "event" | "state" | "relationship" |
        "fact" | "knowledge" | "spatial" | "asset" | "history" | "working-note";
  sourceRef: string;
  content: unknown;
  reason: string;
  retrieval: "anchor" | "structural" | "dependency" | "lexical" |
             "semantic" | "working";
  authority: "authoritative" | "derived" | "inferred" | "external";
  confidence?: number;
  revision?: ProjectRevision;
  dependencyRefs?: string[];
}
```

The final runtime contract may normalize compact model-facing content separately from rich source references.

## Task-specific policies

Do not use one universal retrieval prompt.

Examples:

### Inline completion
Prefer:
- current element;
- nearby prose;
- current scene state;
- compact participating-character context;
- relevant style rules.

Avoid broad project retrieval unless the text creates an explicit dependency.

### Rewrite selected prose
Prefer:
- selection + immediate context;
- document purpose/format;
- relevant character voice;
- explicit user instruction;
- small number of representative semantic matches.

### Semantic extraction while typing
Prefer:
- changed text range;
- existing semantic bindings for that range;
- current scene/presentation;
- nearby entities/location/world state.

Output an inference/proposal, not authoritative mutation.

### Continuity review
Use broader structural context:
- scene;
- adjacent/causally related events;
- state transitions;
- chronology;
- knowledge;
- movement/reachability;
- relevant prior findings.

### Arc/story-wide analysis
Allow larger graph traversal and semantic retrieval across the narrative, with explicit budget and evidence list.

## Retrieval budgets

Budget is multidimensional, not only tokens:

```text
max model tokens
max retrieved items
max semantic-search results
max graph depth
max document distance
latency target
cost class
freshness requirement
```

Interactive completion uses a very small/fast budget. Explicit deep review may use a much larger budget.

## Indexes

V2 may maintain several rebuildable indexes:

```text
ID/reference index
temporal index
spatial/navigation index
relationship/causal/dependency graph
full-text index
vector/embedding index
```

Indexes are projections/caches. They are never authoritative project history.

## Agent working memory

Long-running agents may maintain temporary working memory inside an AgentExecution:

```text
task
baseProjectRevision
plan
retrieved ContextPackages
working notes
tool/query results
proposed Findings
proposed ChangeSets
```

Anything that must survive the execution becomes an explicit project artifact, Finding, decision, relationship or accepted ChangeSet. Hidden model/session state is never required to reconstruct project meaning.

## Caching and staleness

Context-derived summaries and embeddings may be cached with dependency references and source revisions.

A change invalidates only dependent cached material where possible.

Example:

```text
Sorell voice summary @ revision 2140
depends on:
  entity:sorell
  arc:sorell
  relationship:sorell-harlan
  selected dialogue passages
```

Changing docking geometry should not invalidate it. Changing Sorell's authored characterization should.

## Inspectability and UX

AI-assisted actions should be able to expose **Context used** on demand without cluttering the default UI.

The inspection view may show:
- included sources;
- retrieval reason;
- authority/inference status;
- source revision;
- omitted context because of budget;
- semantic-search matches;
- user exclusions.

Users may exclude a source or request additional context and rerun a proposal.

This supports the v2 principle: quiet by default, explicit on demand.

## Security and tenancy

Context resolution occurs after authorization. Retrieval must not cross workspace/project boundaries unless an explicitly authorized shared-library source is requested.

Agent/tool permissions constrain both retrieval and mutation. A model provider receives only the assembled package needed for the task, not unrestricted project access.

## Deterministic versus model work

Do not spend model tokens answering questions the application can answer exactly.

Examples:

```text
Where is Sorell?                  -> world-state projection
Can Sorell reach Engineering?     -> spatial/pathfinding query
What does Rao know at this time?  -> knowledge query
Which event created this asset?   -> provenance/dependency query

Similar emotional scenes?         -> semantic retrieval
Make Sorell sound more herself.   -> structural + semantic context + LLM
Infer unstated movement from prose -> local context + LLM proposal
```

## Initial implementation slice

Before provider integration, implement interfaces and a deterministic fixture resolver sufficient for:

```text
resolveAnchor()
getImmediateContext()
getStructuralContext()
getDependencyContext()
assembleContextPackage()
explainContextPackage()
```

Then add lexical retrieval. Add embeddings/vector infrastructure only after a real task demonstrates value; keep the semantic-retrieval interface provider/index independent.

The first proof should assemble context for:

> At this point in the story, can Sorell get from the Bridge to Engineering?

The LLM is unnecessary for the route answer. A later prose rewrite at the same cursor should reuse the same anchor but receive a different context policy.

## Acceptance requirements

1. Same anchor + project revision + deterministic policy produces reproducible structural context.
2. Context packages record the project revision they describe.
3. Structural facts are not replaced by vector-search guesses.
4. A package can explain why each item was included.
5. Unauthorized data cannot enter a package.
6. Cached context is invalidated through declared dependencies/revisions.
7. Semantic retrieval can be disabled without breaking deterministic application behavior.
8. Provider adapters consume ContextPackage-derived input rather than querying project persistence directly.
9. Agent hidden/session memory is not required to resume from durable execution artifacts.
10. The Write UI can remain visually quiet while inference/retrieval operates underneath.
