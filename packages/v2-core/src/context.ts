import { explainRoute, findRoute, getEffectiveLocation, type WorldSnapshot } from './world';
export interface StudioContextItem { id:string; kind:'world-state'|'entity-location'|'route'; label:string; value:unknown; reason:string; sourceRefs:string[]; }
export interface StudioContextPackage { projectId:string; projectRevision:number; anchor:{kind:'entity';entityId:string}; items:StudioContextItem[]; }
export function resolveNavigationContext(snapshot:WorldSnapshot,input:{projectId:string;actorId:string;from:string;to:string}):StudioContextPackage{
 const route=findRoute(snapshot,input.actorId,input.from,input.to);
 return {projectId:input.projectId,projectRevision:snapshot.revision,anchor:{kind:'entity',entityId:input.actorId},items:[
  {id:'context:world-state',kind:'world-state',label:'World state',value:snapshot.state,reason:'State predicates affect traversal.',sourceRefs:['data/locations.json']},
  {id:'context:actor-location',kind:'entity-location',label:'Actor location',value:getEffectiveLocation(snapshot,input.actorId),reason:'Navigation starts from the actor context.',sourceRefs:['fixture:light-delay-bridge']},
  {id:'context:route',kind:'route',label:'Route',value:{...route,explanation:explainRoute(route)},reason:'Deterministic pathfinding under the selected world state.',sourceRefs:route.reachable?route.steps.map(s=>s.edgeId):route.failures.map(f=>f.edgeId)}
 ]};
}
