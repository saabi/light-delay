import { ids, lightDelayBridgeFixture, withHarlanBlocking } from './light-delay-fixture.js';
import { resolveNavigationContext } from './context.js';
import type { WorldSnapshot } from './world.js';
export interface NavigationViewModel { revision:number; gravity:string; serviceHatch:string; harlanBlocking:boolean; reachable:boolean; summary:string; routeLabels:string[]; contextSourceCount:number; }
export function getBridgeNavigationViewModelFromSnapshot(snapshot:WorldSnapshot):NavigationViewModel{
 const context=resolveNavigationContext(snapshot,{projectId:'project:light-delay',actorId:ids.sorell,from:ids.meal,to:ids.engineering}); const route=context.items.find(i=>i.kind==='route')!.value as any;
 const labels=new Map(snapshot.nodes.map(n=>[n.id,n.label])); return {revision:snapshot.revision,gravity:String(snapshot.state.gravity),serviceHatch:String(snapshot.state['door:service-hatch-bridge']),harlanBlocking:snapshot.occupancy.some((item)=>item.entityId===ids.harlan&&item.blocksTraversal),reachable:route.reachable,summary:route.explanation,routeLabels:route.reachable?route.steps.map((s:any)=>`${labels.get(s.from)??s.from} → ${labels.get(s.to)??s.to}`):route.failures.flatMap((f:any)=>f.reasons),contextSourceCount:new Set(context.items.flatMap(i=>i.sourceRefs)).size};
}
export function getBridgeNavigationViewModel(options:{microgravity?:boolean;harlanBlocks?:boolean}={}):NavigationViewModel{
 let snapshot:WorldSnapshot={...lightDelayBridgeFixture,state:{...lightDelayBridgeFixture.state,gravity:options.microgravity?'microgravity':'1g'}}; if(options.harlanBlocks) snapshot=withHarlanBlocking(snapshot);
 return getBridgeNavigationViewModelFromSnapshot(snapshot);
}
