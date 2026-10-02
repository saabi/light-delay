export type WorldValue = string | number | boolean;
export type WorldState = Record<string, WorldValue>;

export interface SpatialNode { id: string; label: string; kind: 'location' | 'waypoint'; }
export interface Requirement { key: string; eq?: WorldValue; in?: WorldValue[]; }
export interface NavigationEdge { id: string; from: string; to: string; cost: number; bidirectional?: boolean; via?: string; requirements?: Requirement[]; notes?: string; }
export interface OccupancyBlocker { entityId: string; nodeId: string; blocksTraversal: boolean; reason: string; }
export interface WorldSnapshot { id: string; revision: number; state: WorldState; nodes: SpatialNode[]; edges: NavigationEdge[]; occupancy: OccupancyBlocker[]; entityLocations: Record<string,string>; }
export interface RouteStep { edgeId: string; from: string; to: string; via?: string; }
export interface RouteFailure { edgeId: string; from: string; to: string; reasons: string[]; }
export type RouteResult = { reachable: true; cost: number; steps: RouteStep[] } | { reachable: false; failures: RouteFailure[] };

function requirementFailure(r: Requirement, state: WorldState): string | undefined {
 const actual=state[r.key];
 if(r.eq !== undefined && actual !== r.eq) return `${r.key} must be ${String(r.eq)} (currently ${String(actual)})`;
 if(r.in && !r.in.includes(actual)) return `${r.key} must be one of ${r.in.join(', ')} (currently ${String(actual)})`;
}
function edgeDirections(edge: NavigationEdge){return edge.bidirectional?[{...edge},{...edge,from:edge.to,to:edge.from}]:[edge];}
export function findRoute(snapshot: WorldSnapshot, actorId: string, from: string, to: string): RouteResult {
 const directions=snapshot.edges.flatMap(edgeDirections); const failures:RouteFailure[]=[];
 const open=directions.filter(e=>{
  const reasons=(e.requirements??[]).map(r=>requirementFailure(r,snapshot.state)).filter((x):x is string=>!!x);
  const blocker=snapshot.occupancy.find(o=>o.blocksTraversal && o.nodeId===e.to && o.entityId!==actorId); if(blocker) reasons.push(blocker.reason);
  if(reasons.length) failures.push({edgeId:e.id,from:e.from,to:e.to,reasons}); return reasons.length===0;
 });
 const dist=new Map<string,number>([[from,0]]); const prev=new Map<string,{node:string;edge:NavigationEdge}>(); const queue=new Set(snapshot.nodes.map(n=>n.id)); queue.add(from); queue.add(to);
 while(queue.size){let current:string|undefined; let best=Infinity; for(const n of queue){const d=dist.get(n)??Infinity;if(d<best){best=d;current=n;}} if(!current||best===Infinity) break; queue.delete(current); if(current===to) break;
  for(const e of open.filter(e=>e.from===current)){const next=best+e.cost;if(next<(dist.get(e.to)??Infinity)){dist.set(e.to,next);prev.set(e.to,{node:current,edge:e});}}
 }
 if(!dist.has(to)) return {reachable:false,failures}; const steps:RouteStep[]=[]; let cursor=to; while(cursor!==from){const p=prev.get(cursor);if(!p) break;steps.unshift({edgeId:p.edge.id,from:p.edge.from,to:p.edge.to,via:p.edge.via});cursor=p.node;} return {reachable:true,cost:dist.get(to)!,steps};
}
export function explainRoute(result: RouteResult): string {
 if(result.reachable) return result.steps.length ? `Reachable in ${result.steps.length} step${result.steps.length===1?'':'s'}.` : 'Already at destination.';
 if(!result.failures.length) return 'No connected route exists in the current spatial model.';
 return result.failures.map(f=>`${f.from} → ${f.to}: ${f.reasons.join('; ')}`).join(' | ');
}
export function getEffectiveLocation(snapshot:WorldSnapshot,entityId:string){return snapshot.entityLocations[entityId];}
