import { describe,expect,it } from 'vitest';
import { findRoute } from './world'; import { ids,lightDelayBridgeFixture,withHarlanBlocking } from './light-delay-fixture';
describe('Light Delay navigation vertical slice',()=>{
 it('uses the safe around-rail route in 1g',()=>{const r=findRoute(lightDelayBridgeFixture,ids.sorell,ids.meal,ids.engineering);expect(r.reachable).toBe(true);if(r.reachable) expect(r.steps[0].edgeId).toBe('nav-edge:meal-table-around-to-stations');});
 it('allows the direct shaft crossing in microgravity',()=>{const s={...lightDelayBridgeFixture,state:{...lightDelayBridgeFixture.state,gravity:'microgravity'}};const r=findRoute(s,ids.sorell,ids.meal,ids.engineering);expect(r.reachable).toBe(true);if(r.reachable) expect(['nav-edge:meal-table-around-to-stations','nav-edge:meal-table-across-shaft-to-stations']).toContain(r.steps[0].edgeId);});
 it('explains Harlan as a blocker',()=>{const r=findRoute(withHarlanBlocking(lightDelayBridgeFixture),ids.sorell,ids.meal,ids.engineering);expect(r.reachable).toBe(false);if(!r.reachable) expect(r.failures.some(f=>f.reasons.some(x=>x.includes('Harlan')))).toBe(true);});
});
