export type ProjectRevision = number;
export type ContextRetrieval = 'anchor' | 'structural' | 'dependency' | 'lexical' | 'semantic' | 'working';
export type ContextAuthority = 'authoritative' | 'derived' | 'inferred' | 'external';

export type ContextAnchor =
	| { kind: 'document-range'; documentId: string; start: number; end: number }
	| { kind: 'entity'; entityId: string }
	| { kind: 'story-event'; eventId: string }
	| { kind: 'presentation'; presentationId: string }
	| { kind: 'spatial'; spatialId: string }
	| { kind: 'shot'; shotId: string }
	| { kind: 'finding'; findingId: string };

export interface ContextBudget {
	maxTokens?: number;
	maxItems?: number;
	maxSemanticResults?: number;
	maxGraphDepth?: number;
	latencyClass?: 'interactive' | 'normal' | 'deep';
	costClass?: 'minimal' | 'normal' | 'extended';
}

export interface ContextTask {
	kind: 'completion' | 'rewrite' | 'extract' | 'review' | 'analysis' | 'agent';
	instruction: string;
}

export interface ContextItem {
	id: string;
	kind: string;
	sourceRef: string;
	content: unknown;
	reason: string;
	retrieval: ContextRetrieval;
	authority: ContextAuthority;
	confidence?: number;
	revision?: ProjectRevision;
	dependencyRefs?: string[];
}

export interface ContextOmission {
	reason: 'budget' | 'authorization' | 'stale' | 'duplicate' | 'policy';
	sourceRef?: string;
	detail?: string;
}

export interface ContextPackage {
	id: string;
	projectId: string;
	projectRevision: ProjectRevision;
	task: ContextTask;
	anchor: ContextAnchor;
	budget: ContextBudget;
	items: ContextItem[];
	omissions?: ContextOmission[];
	createdAt: string;
}

export interface ContextRequest {
	projectId: string;
	projectRevision: ProjectRevision;
	task: ContextTask;
	anchor: ContextAnchor;
	budget: ContextBudget;
}

export interface ContextResolver {
	resolve(request: ContextRequest): Promise<ContextPackage>;
	explain(context: ContextPackage): ContextExplanation;
}

export interface ContextExplanation {
	projectRevision: ProjectRevision;
	items: Array<Pick<ContextItem, 'sourceRef' | 'reason' | 'retrieval' | 'authority'>>;
	omissions: ContextOmission[];
}

/**
 * Provider-neutral seam for fuzzy prose retrieval.
 * Implementations may use embeddings, another semantic index, or be disabled.
 */
export interface SemanticRetriever {
	search(input: {
		projectId: string;
		projectRevision: ProjectRevision;
		query: string;
		limit: number;
	}): Promise<ContextItem[]>;
}
