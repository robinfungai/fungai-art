/* Contribution Tracker — mock multi-user demo data */

const TrackerData = (() => {
  const NODES = [
    { id:'berlin', name:'Berlin Studio / LAB', region:'DE-BE', color:'#6BD66F' },
    { id:'sweden', name:'Sweden Foraging',     region:'SE-N',  color:'#4FA8E0' },
    { id:'genoa',  name:'Genoa Castle',        region:'IT-GE', color:'#E8B14B' },
  ];

  const CONTRIB_TYPES = [
    { id:'kitchen',   label:'Kitchen help',         sub:'1 day · cooking · cleanup',   earn:40, rep:1, autoApprove:false },
    { id:'forage',    label:'Foraging guide',       sub:'Lead a circle · half day',    earn:60, rep:1, autoApprove:false },
    { id:'content',   label:'Content creation',     sub:'Photo · video · writing',     earn:20, rep:0, autoApprove:true  },
    { id:'event',     label:'Event facilitation',   sub:'Help run an experience',      earn:80, rep:2, autoApprove:false },
    { id:'specimen',  label:'Species identification',sub:'Document a find · upload',   earn:15, rep:0, autoApprove:true  },
    { id:'workshop',  label:'Lead a workshop',      sub:'Teach a skill · 2-3 hours',   earn:100, rep:3, autoApprove:false },
    { id:'mend',      label:'Mend / repair',        sub:'Studio upkeep · tools',       earn:25, rep:1, autoApprove:false },
  ];

  // Tier thresholds (points)
  const TIERS = [
    { id:'seed',     label:'Seed',     min:0,   color:'#8B7E62' },
    { id:'forager',  label:'Forager',  min:10,  color:'#C9B894' },
    { id:'mycelium', label:'Mycelium', min:50,  color:'#6BD66F' },
    { id:'keystone', label:'Keystone', min:150, color:'#E8B14B' },
  ];

  function tierFor(points) {
    let t = TIERS[0];
    for (const x of TIERS) if (points >= x.min) t = x;
    return t;
  }

  // Seeded members — pretend these came from your existing community
  const MEMBERS = [
    { id:'birch',    handle:'@birch',    name:'Birch Lindqvist',  role:'admin',   homeNodeId:'sweden', avatar:'#6BD66F', joined:'2024-01-12' },
    { id:'cedar',    handle:'@cedar',    name:'Cedar Walden',     role:'steward', homeNodeId:'berlin', avatar:'#E8B14B', joined:'2024-02-04' },
    { id:'rowan',    handle:'@rowan',    name:'Rowan Hellström',  role:'steward', homeNodeId:'sweden', avatar:'#4FA8E0', joined:'2024-02-22' },
    { id:'sorrel',   handle:'@sorrel',   name:'Sorrel Marenghi',  role:'forager', homeNodeId:'genoa',  avatar:'#B6F0AE', joined:'2024-04-18' },
    { id:'fern',     handle:'@fern',     name:'Fern Adachi',      role:'member',  homeNodeId:'berlin', avatar:'#F5D689', joined:'2024-06-03' },
    { id:'alder',    handle:'@alder',    name:'Alder Vroom',      role:'member',  homeNodeId:'berlin', avatar:'#A6D5F2', joined:'2024-07-10' },
    { id:'moss',     handle:'@moss',     name:'Moss Ó Cinnéide',  role:'member',  homeNodeId:'genoa',  avatar:'#C9B894', joined:'2024-09-25' },
    { id:'wren',     handle:'@wren',     name:'Wren Pavlič',      role:'member',  homeNodeId:'sweden', avatar:'#E6D9B5', joined:'2025-01-08' },
  ];

  // Seed history: a handful of contributions across all members so the demo
  // doesn't start empty. Status: approved | pending | rejected.
  const NOW = Date.now();
  const days = n => NOW - n * 86400000;
  const hours = n => NOW - n * 3600000;

  const SEED_CONTRIBUTIONS = [
    { id:'c-1',  memberId:'birch',  typeId:'forage',   nodeId:'sweden', notes:'Autumn Schizophyllum walk · 7 participants',                                        status:'approved', submittedAt:days(28), reviewedAt:days(27), reviewedBy:'cedar' },
    { id:'c-2',  memberId:'birch',  typeId:'specimen', nodeId:'sweden', notes:'Documented Hericium erinaceus · 61.4°N',                                            status:'approved', submittedAt:days(25), reviewedAt:days(25), reviewedBy:'birch' },
    { id:'c-3',  memberId:'cedar',  typeId:'kitchen',  nodeId:'berlin', notes:'Sensual dinner Friday · prep + service',                                            status:'approved', submittedAt:days(21), reviewedAt:days(20), reviewedBy:'birch' },
    { id:'c-4',  memberId:'cedar',  typeId:'event',    nodeId:'berlin', notes:'Co-hosted full-moon ceremony',                                                     status:'approved', submittedAt:days(18), reviewedAt:days(17), reviewedBy:'birch' },
    { id:'c-5',  memberId:'rowan',  typeId:'forage',   nodeId:'sweden', notes:'Chaga harvest · birch grove east',                                                  status:'approved', submittedAt:days(15), reviewedAt:days(14), reviewedBy:'cedar' },
    { id:'c-6',  memberId:'sorrel', typeId:'workshop', nodeId:'genoa',  notes:'Tincture-making intensive · 6 students',                                            status:'approved', submittedAt:days(12), reviewedAt:days(11), reviewedBy:'birch' },
    { id:'c-7',  memberId:'fern',   typeId:'content',  nodeId:'berlin', notes:'Photo essay on the apothecary table — autumn light',                                status:'approved', submittedAt:days(10), reviewedAt:days(10), reviewedBy:'cedar' },
    { id:'c-8',  memberId:'fern',   typeId:'kitchen',  nodeId:'berlin', notes:'Sunday lunch · vegan menu',                                                        status:'approved', submittedAt:days(7),  reviewedAt:days(6),  reviewedBy:'cedar' },
    { id:'c-9',  memberId:'alder',  typeId:'mend',     nodeId:'berlin', notes:'Repaired the dehydrator + sharpened foraging knives',                              status:'approved', submittedAt:days(6),  reviewedAt:days(5),  reviewedBy:'cedar' },
    { id:'c-10', memberId:'alder',  typeId:'content',  nodeId:'berlin', notes:'Short film: 90 seconds inside the studio',                                        status:'approved', submittedAt:days(4),  reviewedAt:days(4),  reviewedBy:'cedar' },
    { id:'c-11', memberId:'moss',   typeId:'specimen', nodeId:'genoa',  notes:'Inonotus obliquus on dead beech · GPS attached',                                  status:'approved', submittedAt:days(3),  reviewedAt:days(3),  reviewedBy:'sorrel' },
    { id:'c-12', memberId:'wren',   typeId:'kitchen',  nodeId:'sweden', notes:'Forager breakfast for arrivals',                                                  status:'approved', submittedAt:days(2),  reviewedAt:days(2),  reviewedBy:'rowan' },
    // Pending — these are what the steward sees in the queue
    { id:'c-13', memberId:'fern',   typeId:'event',    nodeId:'berlin', notes:'Helped run the Sunday tasting · 4h on the floor',                                  status:'pending',  submittedAt:hours(20) },
    { id:'c-14', memberId:'alder',  typeId:'mend',     nodeId:'berlin', notes:'Repainted the storage shelves · 6 hours over 2 days',                              status:'pending',  submittedAt:hours(14) },
    { id:'c-15', memberId:'wren',   typeId:'forage',   nodeId:'sweden', notes:'Late-season Cantharellus walk with two new members',                              status:'pending',  submittedAt:hours(9)  },
    { id:'c-16', memberId:'moss',   typeId:'workshop', nodeId:'genoa',  notes:'Lectured on Italian fungal ecology · 2.5 hours · slides attached',                 status:'pending',  submittedAt:hours(4)  },
  ];

  return { NODES, CONTRIB_TYPES, MEMBERS, TIERS, tierFor, SEED_CONTRIBUTIONS };
})();
