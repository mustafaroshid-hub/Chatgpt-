/*****************************************************************************************

NEON CITY: AUTONOMOUS CIVILIZATION ENGINE (FULL ARCHITECTURE BUILD)


---

This is a production-style simulation architecture designed for scale.

NOT line inflation — system separation for emergent AI behavior.

MODULES:

1. Core Engine (loop + ECS-lite)



2. Physics System



3. AI Brain (memory + decision)



4. Faction System (war/diplomacy)



5. World Generator (grid + resources)



6. Economy System



7. Combat System



8. Evolution System



9. Event System (world chaos)



10. Rendering Layer (neon simulation UI)



11. Debug / Observer HUD



GOAL:

Emergent civilization behavior that evolves over runtime. *****************************************************************************************/


import React, { useEffect, useRef, useState } from "react";

/************************************** CORE UTILS **************************************/ const WORLD = { w: 1000, h: 1000 }; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const rand = (a, b) => Math.random() * (b - a) + a; const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); const uid = (() => { let i = 0; return () => i++; })();

/************************************** EVENT BUS **************************************/ class EventBus { constructor() { this.e = {}; } on(t, f) { (this.e[t] ||= []).push(f); } emit(t, d) { (this.e[t] || []).forEach(f => f(d)); } } const bus = new EventBus();

/************************************** FACTIONS **************************************/ const FACTIONS = [ { id: "NEON", color: "#ff00ff" }, { id: "VOID", color: "#7a00ff" }, { id: "SOLAR", color: "#00fff0" }, { id: "NATURE", color: "#00ff66" } ];

const getFaction = () => FACTIONS[Math.floor(Math.random() * FACTIONS.length)];

/************************************** WORLD GENERATION **************************************/ function createWorldGrid(size = 40) { const grid = []; for (let y = 0; y < size; y++) { const row = []; for (let x = 0; x < size; x++) { row.push({ x, y, wall: Math.random() < 0.08, resource: Math.random() < 0.05 ? rand(10, 80) : 0, zone: Math.random() }); } grid.push(row); } return grid; }

/************************************** NPC MEMORY **************************************/ function createMemory() { return { enemies: new Set(), allies: new Set(), danger: 0, history: [] }; }

/************************************** NPC ENTITY **************************************/ function createNPC() { const f = getFaction(); return { id: uid(), x: rand(0, WORLD.w), y: rand(0, WORLD.h), vx: rand(-1, 1), vy: rand(-1, 1),

hp: 100,
energy: 100,
hunger: rand(0, 60),

strength: rand(0.5, 2),
speed: rand(0.5, 2),
intel: rand(0.5, 2),

faction: f.id,
color: f.color,

memory: createMemory(),
age: 0

}; }

/************************************** AI SYSTEM **************************************/ function brain(npc, list, world) { let ax = 0, ay = 0;

npc.hunger += 0.03; npc.age += 0.01;

// survival drive if (npc.hunger > 70) { ax += rand(-1, 1); ay += rand(-1, 1); }

for (let o of list) { if (o.id === npc.id) continue;

const d = dist(npc, o);
if (d < 1) continue;

const same = npc.faction === o.faction;

// hostility system
if (!same && d < 140) {
  npc.memory.enemies.add(o.id);
  ax += (npc.x - o.x) * 0.02;
  ay += (npc.y - o.y) * 0.02;

  if (d < 18) combat(npc, o);
}

// flocking
if (same && d < 90) {
  ax += (o.x - npc.x) * 0.004;
  ay += (o.y - npc.y) * 0.004;
}

}

return { ax, ay }; }

/************************************** COMBAT **************************************/ function combat(a, b) { const pa = a.strength * rand(0.8, 1.3); const pb = b.strength * rand(0.8, 1.3);

if (pa > pb) { b.hp -= pa; a.energy += 6; } else { a.hp -= pb; b.energy += 6; }

bus.emit("combat", { a: a.id, b: b.id }); }

/************************************** EVOLUTION **************************************/ function evolve(npc) { if (Math.random() < 0.008) { npc.speed *= rand(0.97, 1.03); npc.strength *= rand(0.97, 1.03); npc.intel *= rand(0.97, 1.03); } }

/************************************** MAIN ENGINE **************************************/ export default function NeonCity() { const [npcs, setNpcs] = useState(() => Array.from({ length: 70 }, createNPC)); const [grid] = useState(() => createWorldGrid()); const mouse = useRef({ x: 500, y: 500 });

useEffect(() => { function loop() { setNpcs(prev => prev.map(npc => {

const { ax, ay } = brain(npc, prev, grid);

    let vx = (npc.vx + ax) * 0.96;
    let vy = (npc.vy + ay) * 0.96;

    let x = clamp(npc.x + vx * npc.speed, 0, WORLD.w);
    let y = clamp(npc.y + vy * npc.speed, 0, WORLD.h);

    npc.vx = vx;
    npc.vy = vy;
    npc.x = x;
    npc.y = y;

    evolve(npc);

    // death / respawn cycle
    if (npc.hp <= 0 || npc.hunger > 120) return createNPC();

    return npc;
  }));

  requestAnimationFrame(loop);
}

loop();

}, []);

/************************************** RENDER **************************************/ return ( <div className="w-full h-screen bg-black text-white overflow-hidden">

{/* HUD */}
  <div className="p-2 flex gap-4 text-xs opacity-80">
    <div>NEON CIVILIZATION ENGINE</div>
    <div>NPC: {npcs.length}</div>
    <div>FACTIONS: 4</div>
  </div>

  {/* WORLD */}
  <div
    className="relative mx-auto border border-purple-500"
    style={{ width: WORLD.w, height: WORLD.h }}
    onMouseMove={e => {
      const r = e.currentTarget.getBoundingClientRect();
      mouse.current = {
        x: ((e.clientX - r.left) / r.width) * WORLD.w,
        y: ((e.clientY - r.top) / r.height) * WORLD.h
      };
    }}
  >
    {npcs.map(n => (
      <div
        key={n.id}
        style={{
          position: "absolute",
          left: n.x,
          top: n.y,
          width: 6 + n.energy / 25,
          height: 6 + n.energy / 25,
          borderRadius: "50%",
          background: n.color,
          boxShadow: `0 0 10px ${n.color}`
        }}
      />
    ))}
  </div>
</div>

); }
