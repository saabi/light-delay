import type { WorldSnapshot } from './world';
export const ids={sorell:'character:lian-sorell',harlan:'character:rylen-harlan',meal:'location:celestial-ardor-bridge-meal-table',stations:'nav:bridge-crew-stations',central:'location:celestial-ardor-central-access',service:'location:celestial-ardor-service-cylinder',engineering:'location:celestial-ardor-engineering'} as const;
export const lightDelayBridgeFixture:WorldSnapshot={
 id:'fixture:light-delay-bridge',revision:1,state:{gravity:'1g','door:service-hatch-bridge':'open'},
 nodes:[{id:ids.meal,label:'Bridge meal table',kind:'location'},{id:ids.stations,label:'Bridge crew stations',kind:'waypoint'},{id:ids.central,label:'Central Access',kind:'location'},{id:ids.service,label:'Service Cylinder',kind:'location'},{id:ids.engineering,label:'Engineering',kind:'location'}],
 edges:[
  {id:'nav-edge:meal-table-around-to-stations',from:ids.meal,to:ids.stations,via:'around-central-opening-rail',cost:1,bidirectional:true,notes:'Source: data/locations.json; 1g-safe walk around the helical opening.'},
  {id:'nav-edge:meal-table-across-shaft-to-stations',from:ids.meal,to:ids.stations,via:'across-open-shaft',cost:1,bidirectional:true,requirements:[{key:'gravity',eq:'microgravity'}],notes:'Source: data/locations.json; only valid in microgravity.'},
  {id:'nav-edge:stations-to-service-hatch',from:ids.stations,to:ids.service,via:'portal:bridge-service-hatch',cost:1,bidirectional:true,requirements:[{key:'door:service-hatch-bridge',eq:'open'}],notes:'Source: data/locations.json.'},
  {id:'nav-edge:stations-to-central-access',from:ids.stations,to:ids.central,via:'portal:bridge-central-access-opening',cost:1,bidirectional:true,requirements:[{key:'gravity',in:['microgravity','1g']}],notes:'Source: data/locations.json.'},
  {id:'derived-edge:central-access-engineering',from:ids.central,to:ids.engineering,via:'central-access-level:engineering',cost:1,bidirectional:true,notes:'Derived from Central Access connects[] → Engineering in data/locations.json.'}
 ],
 occupancy:[],entityLocations:{[ids.sorell]:ids.meal,[ids.harlan]:ids.stations}
};
export function withHarlanBlocking(snapshot:WorldSnapshot):WorldSnapshot{return {...snapshot,revision:snapshot.revision+1,occupancy:[...snapshot.occupancy,{entityId:ids.harlan,nodeId:ids.stations,blocksTraversal:true,reason:'Harlan occupies the crew-stations passage and blocks traversal.'}]};}
