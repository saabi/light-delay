import type { OccupancyBlocker, WorldSnapshot, WorldValue } from './world';

export type RevisionNumber = number;
export type PrincipalKind = 'human' | 'importer' | 'agent' | 'system';

export interface PrincipalRef {
 kind: PrincipalKind;
 id: string;
}

export interface SetWorldStateOperation {
 type: 'SetWorldState';
 key: string;
 value: WorldValue;
}

export interface SetOccupancyOperation {
 type: 'SetOccupancy';
 entityId: string;
 occupancy: readonly OccupancyBlocker[];
}

export type SemanticOperation = SetWorldStateOperation | SetOccupancyOperation;

export interface WorldStatePrecondition {
 type: 'WorldStateEquals';
 key: string;
 expected: WorldValue;
}

export interface OccupancyPrecondition {
 type: 'OccupancyEquals';
 entityId: string;
 expected: readonly OccupancyBlocker[];
}

export type Precondition = WorldStatePrecondition | OccupancyPrecondition;

export interface ChangeSet {
 id: string;
 projectId: string;
 baseRevision: RevisionNumber;
 resultingRevision: RevisionNumber;
 principal: PrincipalRef;
 timestamp: string;
 intent: string;
 operations: readonly SemanticOperation[];
 preconditions: readonly Precondition[];
 restoresRevision?: RevisionNumber;
}

export interface ProjectRevision {
 projectId: string;
 number: RevisionNumber;
 changeSetId: string | null;
 timestamp: string;
 state: WorldSnapshot;
}

export interface CommitInput {
 baseRevision: RevisionNumber;
 principal: PrincipalRef;
 intent: string;
 operations: readonly SemanticOperation[];
 preconditions?: readonly Precondition[];
 changeSetId?: string;
 timestamp?: string;
}

export interface RestoreInput {
 baseRevision: RevisionNumber;
 principal: PrincipalRef;
 intent?: string;
 changeSetId?: string;
 timestamp?: string;
}

export type RevisionError =
 | {
   kind: 'conflict';
   code: 'STALE_BASE_REVISION';
   expectedBaseRevision: RevisionNumber;
   actualRevision: RevisionNumber;
  }
 | {
   kind: 'precondition-failed';
   code: 'PRECONDITION_FAILED';
   precondition: Precondition;
   actual: unknown;
  }
 | {
   kind: 'validation';
   code: 'INVALID_CHANGE_SET' | 'UNSUPPORTED_RESTORE';
   messages: readonly string[];
  }
 | {
   kind: 'duplicate-change-set';
   code: 'DUPLICATE_CHANGE_SET';
   changeSetId: string;
  }
 | {
   kind: 'not-found';
   code: 'REVISION_NOT_FOUND';
   revision: RevisionNumber;
  };

export type CommitResult =
 | { ok: true; changeSet: ChangeSet; revision: ProjectRevision }
 | { ok: false; error: RevisionError };

export interface RevisionHistoryOptions {
 projectId: string;
 initialTimestamp?: string;
 now?: () => string;
 idFactory?: () => string;
}

function cloneOccupancy(value: OccupancyBlocker): OccupancyBlocker {
 return { ...value };
}

function cloneOperation(operation: SemanticOperation): SemanticOperation {
 return operation.type === 'SetWorldState'
  ? { ...operation }
  : { ...operation, occupancy: operation.occupancy.map(cloneOccupancy) };
}

function clonePrecondition(precondition: Precondition): Precondition {
 return precondition.type === 'WorldStateEquals'
  ? { ...precondition }
  : { ...precondition, expected: precondition.expected.map(cloneOccupancy) };
}

function cloneSnapshot(snapshot: WorldSnapshot): WorldSnapshot {
 return {
  ...snapshot,
  state: { ...snapshot.state },
  nodes: snapshot.nodes.map((node) => ({ ...node })),
  edges: snapshot.edges.map((edge) => ({
   ...edge,
   requirements: edge.requirements?.map((requirement) => ({
    ...requirement,
    in: requirement.in ? [...requirement.in] : undefined
   }))
  })),
  occupancy: snapshot.occupancy.map(cloneOccupancy),
  entityLocations: { ...snapshot.entityLocations }
 };
}

function deepFreeze<T>(value: T): T {
 if (value && typeof value === 'object' && !Object.isFrozen(value)) {
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
 }
 return value;
}

function equivalent(left: unknown, right: unknown): boolean {
 return JSON.stringify(left) === JSON.stringify(right);
}

function occupancyForEntity(snapshot: WorldSnapshot, entityId: string): OccupancyBlocker[] {
 return snapshot.occupancy
  .filter((blocker) => blocker.entityId === entityId)
  .map(cloneOccupancy)
  .sort((a, b) => `${a.nodeId}:${a.reason}`.localeCompare(`${b.nodeId}:${b.reason}`));
}

function validatePrincipal(principal: PrincipalRef, messages: string[]): void {
 if (!principal.id.trim()) messages.push('principal.id must not be empty');
 if (!['human', 'importer', 'agent', 'system'].includes(principal.kind)) messages.push('principal.kind is invalid');
}

function validateOperation(operation: SemanticOperation, messages: string[]): void {
 if (operation.type === 'SetWorldState') {
  if (!operation.key.trim()) messages.push('SetWorldState.key must not be empty');
  if (operation.value === undefined) messages.push('SetWorldState.value must be defined');
  return;
 }
 if (!operation.entityId.trim()) messages.push('SetOccupancy.entityId must not be empty');
 for (const blocker of operation.occupancy) {
  if (!blocker.nodeId.trim()) messages.push('SetOccupancy blocker.nodeId must not be empty');
  if (!blocker.reason.trim()) messages.push('SetOccupancy blocker.reason must not be empty');
 }
}

function validatePrecondition(precondition: Precondition, messages: string[]): void {
 if (precondition.type === 'WorldStateEquals') {
  if (!precondition.key.trim()) messages.push('WorldStateEquals.key must not be empty');
  return;
 }
 if (!precondition.entityId.trim()) messages.push('OccupancyEquals.entityId must not be empty');
}

function applyOperation(snapshot: WorldSnapshot, operation: SemanticOperation): void {
 if (operation.type === 'SetWorldState') {
  snapshot.state[operation.key] = operation.value;
  return;
 }
 snapshot.occupancy = snapshot.occupancy.filter((blocker) => blocker.entityId !== operation.entityId);
 snapshot.occupancy.push(...operation.occupancy.map(cloneOccupancy));
}

function diffSnapshots(current: WorldSnapshot, target: WorldSnapshot): SemanticOperation[] | RevisionError {
 if (current.id !== target.id || !equivalent(current.nodes, target.nodes) || !equivalent(current.edges, target.edges) || !equivalent(current.entityLocations, target.entityLocations)) {
  return {
   kind: 'validation',
   code: 'UNSUPPORTED_RESTORE',
   messages: ['restore currently supports semantic world-state and occupancy differences only']
  };
 }

 const operations: SemanticOperation[] = [];
 const stateKeys = [...new Set([...Object.keys(current.state), ...Object.keys(target.state)])].sort();
 for (const key of stateKeys) {
  if (current.state[key] !== target.state[key] && target.state[key] !== undefined) {
   operations.push({ type: 'SetWorldState', key, value: target.state[key] });
  }
 }

 const entityIds = [...new Set([...current.occupancy.map((item) => item.entityId), ...target.occupancy.map((item) => item.entityId)])].sort();
 for (const entityId of entityIds) {
  const currentOccupancy = occupancyForEntity(current, entityId);
  const targetOccupancy = occupancyForEntity(target, entityId);
  if (!equivalent(currentOccupancy, targetOccupancy)) operations.push({ type: 'SetOccupancy', entityId, occupancy: targetOccupancy });
 }
 return operations;
}

export class InMemoryRevisionHistory {
 private readonly projectId: string;
 private readonly now: () => string;
 private readonly idFactory: () => string;
 private readonly revisions: ProjectRevision[];
 private readonly changeSets = new Map<string, ChangeSet>();

 constructor(initial: WorldSnapshot, options: RevisionHistoryOptions) {
  if (!options.projectId.trim()) throw new Error('projectId must not be empty');
  if (!Number.isInteger(initial.revision) || initial.revision < 0) throw new Error('initial revision must be a non-negative integer');
  this.projectId = options.projectId;
  this.now = options.now ?? (() => new Date().toISOString());
  this.idFactory = options.idFactory ?? (() => `changeset:${crypto.randomUUID()}`);
  this.revisions = [deepFreeze({
   projectId: this.projectId,
   number: initial.revision,
   changeSetId: null,
   timestamp: options.initialTimestamp ?? this.now(),
   state: deepFreeze(cloneSnapshot(initial))
  })];
 }

 get current(): ProjectRevision {
  return this.revisions[this.revisions.length - 1];
 }

 get history(): readonly ProjectRevision[] {
  return [...this.revisions];
 }

 get changeSetsInOrder(): readonly ChangeSet[] {
  return this.revisions.slice(1).map((revision) => this.changeSets.get(revision.changeSetId!)!);
 }

 getRevision(number: RevisionNumber): ProjectRevision | undefined {
  return this.revisions.find((revision) => revision.number === number);
 }

 commit(input: CommitInput): CommitResult {
  const messages: string[] = [];
  if (!Number.isInteger(input.baseRevision) || input.baseRevision < 0) messages.push('baseRevision must be a non-negative integer');
  if (!input.intent.trim()) messages.push('intent must not be empty');
  if (!input.operations.length) messages.push('operations must not be empty');
  validatePrincipal(input.principal, messages);
  input.operations.forEach((operation) => validateOperation(operation, messages));
  (input.preconditions ?? []).forEach((precondition) => validatePrecondition(precondition, messages));
  const changeSetId = input.changeSetId ?? this.idFactory();
  if (!changeSetId.trim()) messages.push('changeSetId must not be empty');
  if (messages.length) return { ok: false, error: { kind: 'validation', code: 'INVALID_CHANGE_SET', messages } };
  if (this.changeSets.has(changeSetId)) return { ok: false, error: { kind: 'duplicate-change-set', code: 'DUPLICATE_CHANGE_SET', changeSetId } };
  if (input.baseRevision !== this.current.number) {
   return { ok: false, error: { kind: 'conflict', code: 'STALE_BASE_REVISION', expectedBaseRevision: input.baseRevision, actualRevision: this.current.number } };
  }

  for (const precondition of input.preconditions ?? []) {
   const actual = precondition.type === 'WorldStateEquals'
    ? this.current.state.state[precondition.key]
    : occupancyForEntity(this.current.state, precondition.entityId);
   const expected = precondition.type === 'WorldStateEquals' ? precondition.expected : precondition.expected;
   if (!equivalent(actual, expected)) return { ok: false, error: { kind: 'precondition-failed', code: 'PRECONDITION_FAILED', precondition, actual } };
  }

  const resultingRevision = this.current.number + 1;
  const projected = cloneSnapshot(this.current.state);
  projected.revision = resultingRevision;
  input.operations.forEach((operation) => applyOperation(projected, operation));
  const changeSet = deepFreeze({
   id: changeSetId,
   projectId: this.projectId,
   baseRevision: input.baseRevision,
   resultingRevision,
   principal: { ...input.principal },
   timestamp: input.timestamp ?? this.now(),
   intent: input.intent,
   operations: input.operations.map(cloneOperation),
   preconditions: (input.preconditions ?? []).map(clonePrecondition)
  });
  const revision = deepFreeze({
   projectId: this.projectId,
   number: resultingRevision,
   changeSetId,
   timestamp: changeSet.timestamp,
   state: deepFreeze(projected)
  });
  this.changeSets.set(changeSetId, changeSet);
  this.revisions.push(revision);
  return { ok: true, changeSet, revision };
 }

 restore(targetRevision: RevisionNumber, input: RestoreInput): CommitResult {
  const target = this.getRevision(targetRevision);
  if (!target) return { ok: false, error: { kind: 'not-found', code: 'REVISION_NOT_FOUND', revision: targetRevision } };
  const operations = diffSnapshots(this.current.state, target.state);
  if (!Array.isArray(operations)) return { ok: false, error: operations };
  if (!operations.length) return { ok: false, error: { kind: 'validation', code: 'INVALID_CHANGE_SET', messages: ['restore target is already the current projection'] } };
  const result = this.commit({
   ...input,
   intent: input.intent ?? `Restore revision ${targetRevision}`,
   operations,
   changeSetId: input.changeSetId,
   timestamp: input.timestamp
  });
  if (result.ok) {
   const restored = deepFreeze({ ...result.changeSet, restoresRevision: targetRevision });
   this.changeSets.set(restored.id, restored);
   const revision = this.revisions[this.revisions.length - 1];
   const replaced = deepFreeze({ ...revision, changeSetId: restored.id });
   this.revisions[this.revisions.length - 1] = replaced;
   return { ok: true, changeSet: restored, revision: replaced };
  }
  return result;
 }
}
