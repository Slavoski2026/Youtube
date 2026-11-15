/**
 * The release-day city seen from the air (ep. 9): a grid of blocks with varied towers (set-back tiers,
 * glass towers, clusters of smaller blocks), rooftop dressing (water tanks, AC units, antennas with
 * blinking aviation lights, helipads, neon roof signs), parks with trees, pavements, lane marks,
 * street lamps, moving traffic with head/tail lights, and a distant skyline ring on the horizon.
 * Windows are one instanced mesh: warm lamps, dark, or the flickering pink/teal/blue of a game on a TV
 * (`games` = share of windows playing). Everything is seeded and driven by `t`.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { BoxG, CylG, ConeG } from "../../slavoski/detail";
import { Flat, Glow, Halo } from "../../slavoski/materials";
import { P } from "../../slavoski/palette";

const SCREEN_COLORS = ["#FF4FA0", "#2FE0D0", "#6F8CFF", "#B06FFF"];
const FACADES = [P.bldgNavy, P.bldgSlate, P.bldgPurple, P.bldgTeal, P.bldgIndigo, "#4A4E68", "#5E5A70"];
const GLASS = ["#35587A", "#2E6A78", "#3A4C7A"];

type Box = { x: number; y0: number; z: number; w: number; h: number; d: number; color: string; glass: boolean };
type Roof = { kind: "tank" | "antenna" | "ac" | "heli" | "sign"; x: number; y: number; z: number; s: number; c: number };

const rnd = (s: string, a = 0, b = 1) => a + random(s) * (b - a);

export const ScreenCity: React.FC<{
  t: number;
  games?: number;
  lit?: number;
  blocks?: number;
  spacing?: number;
  seed?: string;
  day?: boolean;
  traffic?: boolean;
}> = ({ t, games = 0.35, lit = 0.3, blocks = 7, spacing = 26, seed = "sc", day = false, traffic = true }) => {
  const half = (blocks - 1) / 2;
  const extent = (half + 0.5) * spacing; // edge of the grid (centre of the outer roads)

  // ---------------------------------------------------------------- layout
  const { boxes, roofs, parks } = useMemo(() => {
    const boxes: Box[] = [];
    const roofs: Roof[] = [];
    const parks: { x: number; z: number }[] = [];
    const maxD = Math.hypot(half, half) * spacing;
    const tower = (x: number, z: number, w: number, d: number, h: number, key: string) => {
      const glass = random(`${key}g`) < 0.28;
      const color = glass ? GLASS[Math.floor(random(`${key}gc`) * GLASS.length)] : FACADES[Math.floor(random(`${key}c`) * FACADES.length)];
      const tiers = h > 34 ? (random(`${key}t`) < 0.65 ? 3 : 2) : 1;
      let y0 = 0, tw = w, td = d;
      const shares = tiers === 3 ? [0.62, 0.28, 0.1] : tiers === 2 ? [0.72, 0.28] : [1];
      shares.forEach((sh, k) => {
        const th = h * sh;
        boxes.push({ x, y0, z, w: tw, h: th, d: td, color: k === 0 ? color : glass ? color : FACADES[(FACADES.indexOf(color) + k) % FACADES.length], glass });
        y0 += th;
        tw *= k === 0 ? 0.74 : 0.62;
        td *= k === 0 ? 0.74 : 0.62;
      });
      // roof dressing on the top tier
      const top = boxes[boxes.length - 1];
      const ry = top.y0 + top.h;
      const pick = random(`${key}r`);
      if (h > 50 && pick < 0.45) roofs.push({ kind: "antenna", x, y: ry, z, s: 4 + random(`${key}as`) * 6, c: 0 });
      else if (h > 40 && pick < 0.6) roofs.push({ kind: "heli", x, y: ry, z, s: Math.min(top.w, top.d) * 0.42, c: 0 });
      else if (pick < 0.78) roofs.push({ kind: "tank", x: x + top.w * 0.2, y: ry, z: z - top.d * 0.18, s: 1, c: 0 });
      else roofs.push({ kind: "sign", x, y: ry, z: z + top.d * 0.5 - 0.2, s: Math.min(top.w * 0.8, 8), c: Math.floor(random(`${key}sc`) * SCREEN_COLORS.length) });
      if (random(`${key}ac`) < 0.7) roofs.push({ kind: "ac", x: x - top.w * 0.22, y: ry, z: z + top.d * 0.15, s: 1, c: 0 });
    };
    for (let i = 0; i < blocks; i++)
      for (let j = 0; j < blocks; j++) {
        const cx = (i - half) * spacing, cz = (j - half) * spacing;
        const key = `${seed}${i}_${j}`;
        const r = random(key);
        const central = 1.35 - (Math.hypot(cx, cz) / maxD) * 0.8; // taller downtown
        if (r < 0.12) {
          parks.push({ x: cx, z: cz });
          continue;
        }
        if (r < 0.58) {
          const w = rnd(`${key}w`, 11, 15), d = rnd(`${key}d`, 11, 15);
          tower(cx, cz, w, d, rnd(`${key}h`, 26, 70) * central, key);
        } else {
          for (const [ox, oz] of [
            [-4.4, -4.4],
            [4.4, -4.4],
            [-4.4, 4.4],
            [4.4, 4.4],
          ]) {
            const k2 = `${key}${ox}${oz}`;
            if (random(`${k2}e`) < 0.12) continue;
            tower(cx + ox, cz + oz, rnd(`${k2}w`, 6, 8), rnd(`${k2}d`, 6, 8), rnd(`${k2}h`, 9, 34) * central, k2);
          }
        }
      }
    return { boxes, roofs, parks };
  }, [blocks, half, spacing, seed]);

  // ---------------------------------------------------------------- windows (one instanced mesh)
  const wins = useMemo(() => {
    const out: { m: THREE.Matrix4; kind: number; c: number; ph: number }[] = [];
    const q = new THREE.Quaternion();
    boxes.forEach((b, bi) => {
      const floors = Math.floor((b.h - 1.2) / 3.2);
      const colW = b.glass ? 1.8 : 2.4;
      const faces: [number, number, 0 | 1, number][] = [
        [0, b.d / 2 + 0.03, 0, b.w],
        [Math.PI, -b.d / 2 - 0.03, 0, b.w],
        [Math.PI / 2, b.w / 2 + 0.03, 1, b.d],
        [-Math.PI / 2, -b.w / 2 - 0.03, 1, b.d],
      ];
      faces.forEach(([rot, off, axis, span], fi) => {
        const cols = Math.max(1, Math.floor(span / colW));
        q.setFromEuler(new THREE.Euler(0, rot, 0));
        for (let f = 0; f < floors; f++)
          for (let c = 0; c < cols; c++) {
            const u = -span / 2 + (c + 0.5) * (span / cols);
            const y = b.y0 + 1.9 + f * 3.2;
            const pos = axis === 0 ? new THREE.Vector3(b.x + u, y, b.z + off) : new THREE.Vector3(b.x + off, y, b.z - u * Math.sign(off));
            const m = new THREE.Matrix4().compose(pos, q, new THREE.Vector3(b.glass ? 1.45 : 1.25, b.glass ? 2.2 : 1.65, 1));
            const k = `${seed}w${bi}${fi}${f}${c}`;
            out.push({ m, kind: random(k), c: Math.floor(random(`${k}c`) * SCREEN_COLORS.length), ph: random(`${k}p`) * 10 });
          }
      });
    });
    return out;
  }, [boxes, seed]);
  const winRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = winRef.current;
    if (!m) return;
    const col = new THREE.Color();
    wins.forEach((w, i) => {
      m.setMatrixAt(i, w.m);
      if (w.kind < games) {
        const flick = 0.7 + 0.3 * Math.sin(t * (3 + w.ph) + w.ph * 3) * Math.sin(t * 1.7 + w.ph);
        col.set(SCREEN_COLORS[w.c]).multiplyScalar(day ? flick * 0.8 : flick);
      } else if (w.kind < games + lit) col.set(P.windowLit).multiplyScalar(day ? 0.55 : 1);
      else col.set(day ? "#8FA4BE" : "#1A2038");
      m.setColorAt(i, col);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  // ---------------------------------------------------------------- streets: road lines, dashes, lamps, cars
  const roadLines = useMemo(() => Array.from({ length: blocks + 1 }, (_, k) => (k - blocks / 2) * spacing), [blocks, spacing]);
  const dashes = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    roadLines.forEach((r) => {
      for (let s = -extent; s <= extent; s += 6) {
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(r, 0.06, s), new THREE.Quaternion(), new THREE.Vector3(0.35, 0.04, 2.6)));
        out.push(new THREE.Matrix4().compose(new THREE.Vector3(s, 0.06, r), new THREE.Quaternion(), new THREE.Vector3(2.6, 0.04, 0.35)));
      }
    });
    return out;
  }, [roadLines, extent]);
  const lamps = useMemo(() => {
    const out: THREE.Vector3[] = [];
    roadLines.forEach((r) => {
      for (let s = -extent + 6; s <= extent - 6; s += 13) {
        for (const side of [-5.2, 5.2]) {
          out.push(new THREE.Vector3(r + side, 0, s));
          out.push(new THREE.Vector3(s, 0, r + side));
        }
      }
    });
    return out;
  }, [roadLines, extent]);
  const cars = useMemo(() => {
    const out: { line: number; axis: 0 | 1; dir: 1 | -1; ph: number; v: number; color: string }[] = [];
    const colors = [P.carRed, P.carTeal, "#E8E4DA", "#2B2F3E", "#E8C04A", "#5A4A78"];
    roadLines.forEach((r, li) => {
      for (const axis of [0, 1] as const)
        for (const dir of [1, -1] as const)
          for (let n = 0; n < 5; n++) {
            const k = `${seed}car${li}${axis}${dir}${n}`;
            out.push({ line: r, axis, dir, ph: random(k), v: 7 + random(`${k}v`) * 5, color: colors[Math.floor(random(`${k}c`) * colors.length)] });
          }
    });
    return out;
  }, [roadLines, seed]);
  const carRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const tailRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const body = carRef.current, head = headRef.current, tail = tailRef.current;
    if (!body || !head || !tail) return;
    const L = extent * 2;
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    cars.forEach((c, i) => {
      const s = (((c.ph * L + t * c.v * c.dir) % L) + L) % L - extent;
      const lane = c.dir * 2.1;
      const pos = c.axis === 0 ? new THREE.Vector3(c.line + lane, 0.75, s) : new THREE.Vector3(s, 0.75, c.line - lane);
      const yaw = c.axis === 0 ? (c.dir > 0 ? 0 : Math.PI) : c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      q.setFromEuler(new THREE.Euler(0, yaw, 0));
      body.setMatrixAt(i, new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1.7, 1.3, 3.6)));
      col.set(c.color);
      body.setColorAt(i, col);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      head.setMatrixAt(i, new THREE.Matrix4().compose(pos.clone().addScaledVector(fwd, 1.82).setY(0.8), q, new THREE.Vector3(1.4, 0.3, 0.1)));
      tail.setMatrixAt(i, new THREE.Matrix4().compose(pos.clone().addScaledVector(fwd, -1.82).setY(0.8), q, new THREE.Vector3(1.4, 0.3, 0.1)));
    });
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    tail.instanceMatrix.needsUpdate = true;
  });

  // ---------------------------------------------------------------- trees (parks + a few street trees)
  const trees = useMemo(() => {
    const out: { p: THREE.Vector3; s: number }[] = [];
    parks.forEach((pk, pi) => {
      for (let n = 0; n < 14; n++) out.push({ p: new THREE.Vector3(pk.x + rnd(`${seed}tx${pi}${n}`, -7.5, 7.5), 0, pk.z + rnd(`${seed}tz${pi}${n}`, -7.5, 7.5)), s: rnd(`${seed}ts${pi}${n}`, 0.8, 1.4) });
    });
    return out;
  }, [parks, seed]);
  const treeTopRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const lampPoleRef = useRef<THREE.InstancedMesh>(null);
  const lampHeadRef = useRef<THREE.InstancedMesh>(null);
  const dashRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const tt = treeTopRef.current, tr = treeTrunkRef.current, lp = lampPoleRef.current, lh = lampHeadRef.current, ds = dashRef.current;
    if (tt && tr) {
      trees.forEach((tree, i) => {
        tt.setMatrixAt(i, new THREE.Matrix4().compose(tree.p.clone().setY(3.4 * tree.s), new THREE.Quaternion(), new THREE.Vector3(tree.s, tree.s, tree.s)));
        tr.setMatrixAt(i, new THREE.Matrix4().compose(tree.p.clone().setY(0.8 * tree.s), new THREE.Quaternion(), new THREE.Vector3(tree.s, tree.s, tree.s)));
      });
      tt.instanceMatrix.needsUpdate = true;
      tr.instanceMatrix.needsUpdate = true;
    }
    if (lp && lh) {
      lamps.forEach((l, i) => {
        lp.setMatrixAt(i, new THREE.Matrix4().makeTranslation(l.x, 2.6, l.z));
        lh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(l.x, 5.25, l.z));
      });
      lp.instanceMatrix.needsUpdate = true;
      lh.instanceMatrix.needsUpdate = true;
    }
    if (ds) {
      dashes.forEach((m, i) => ds.setMatrixAt(i, m));
      ds.instanceMatrix.needsUpdate = true;
    }
  });

  const blink = Math.floor(t * 1.5) % 2 === 0;
  return (
    <group>
      {/* asphalt, then a raised pavement per block (parks get grass) */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <BoxG args={[extent * 2 + 60, 0.1, extent * 2 + 60]} />
        <Flat color="#262A3A" />
      </mesh>
      {/* the wider city floor out to the skyline ring */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[1200, 0.1, 1200]} />
        <Flat color={day ? "#3A3F55" : "#1C2030"} />
      </mesh>
      {Array.from({ length: blocks * blocks }, (_, n) => {
        const i = Math.floor(n / blocks), j = n % blocks;
        const x = (i - half) * spacing, z = (j - half) * spacing;
        const park = parks.some((p) => p.x === x && p.z === z);
        return (
          <mesh key={n} position={[x, 0.12, z]} receiveShadow>
            <BoxG args={[spacing - 8.6, 0.24, spacing - 8.6]} />
            <Flat color={park ? "#2F6A4A" : day ? "#6A7084" : "#3E4458"} />
          </mesh>
        );
      })}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={P.laneMark} toneMapped={false} />
      </instancedMesh>

      {/* towers */}
      {boxes.map((b, i) => (
        <group key={i}>
          <mesh position={[b.x, b.y0 + b.h / 2 + 0.24, b.z]} castShadow receiveShadow>
            <BoxG args={[b.w, b.h, b.d]} />
            <Flat color={b.color} />
          </mesh>
          {/* roof slab lip */}
          <mesh position={[b.x, b.y0 + b.h + 0.34, b.z]}>
            <boxGeometry args={[b.w + 0.4, 0.22, b.d + 0.4]} />
            <Flat color="#23283A" />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={winRef} args={[undefined, undefined, wins.length]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* rooftops */}
      {roofs.map((r, i) => {
        const y = r.y + 0.45;
        if (r.kind === "tank")
          return (
            <group key={i} position={[r.x, y, r.z]}>
              {[-0.7, 0.7].map((lx) => (
                <mesh key={lx} position={[lx, 0.6, 0]}>
                  <BoxG args={[0.15, 1.2, 0.15]} />
                  <Flat color="#3A3030" />
                </mesh>
              ))}
              <mesh position={[0, 2.0, 0]} castShadow>
                <CylG args={[1.0, 1.0, 1.8, 10]} />
                <Flat color="#8A5A3A" />
              </mesh>
              <mesh position={[0, 3.2, 0]}>
                <ConeG args={[1.1, 0.7, 10]} />
                <Flat color="#5A3A2A" />
              </mesh>
            </group>
          );
        if (r.kind === "ac")
          return (
            <group key={i} position={[r.x, y, r.z]}>
              {[0, 1, 2].map((k) => (
                <mesh key={k} position={[k * 1.3 - 1.3, 0.45, 0]} castShadow>
                  <BoxG args={[1.1, 0.9, 1.1]} />
                  <Flat color="#9AA2B0" />
                </mesh>
              ))}
            </group>
          );
        if (r.kind === "antenna")
          return (
            <group key={i} position={[r.x, y, r.z]}>
              <mesh position={[0, r.s / 2, 0]}>
                <CylG args={[0.12, 0.22, r.s, 6]} />
                <Flat color="#C9CED8" />
              </mesh>
              <mesh position={[0, r.s + 0.15, 0]}>
                <sphereGeometry args={[0.28, 8, 6]} />
                <Glow color={blink ? "#FF3A2A" : "#3A0E0E"} />
              </mesh>
              {blink ? <Halo position={[0, r.s + 0.2, 0]} size={4} color="#FF3A2A" opacity={0.7} /> : null}
            </group>
          );
        if (r.kind === "heli")
          return (
            <group key={i} position={[r.x, y, r.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[r.s, 16]} />
                <Flat color="#3A3F55" />
              </mesh>
              <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[r.s * 0.82, r.s * 0.9, 16]} />
                <Glow color={day ? "#E8C04A" : "#FFE27A"} />
              </mesh>
              {[-0.5, 0.5].map((hx) => (
                <mesh key={hx} position={[hx * r.s * 0.5, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[r.s * 0.12, r.s * 0.8]} />
                  <Flat color="#F4F2EA" />
                </mesh>
              ))}
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[r.s * 0.5, r.s * 0.12]} />
                <Flat color="#F4F2EA" />
              </mesh>
            </group>
          );
        // a neon roof sign facing +z
        return (
          <group key={i} position={[r.x, y, r.z]}>
            {[-r.s * 0.4, r.s * 0.4].map((lx) => (
              <mesh key={lx} position={[lx, 1.2, -0.2]}>
                <BoxG args={[0.2, 2.4, 0.2]} />
                <Flat color="#2B2F3E" />
              </mesh>
            ))}
            <mesh position={[0, 3.2, 0]}>
              <planeGeometry args={[r.s, 2.0]} />
              <Glow color={SCREEN_COLORS[r.c]} opacity={day ? 0.7 : 1} />
            </mesh>
            {!day ? <Halo position={[0, 3.2, 0.4]} size={r.s * 1.4} color={SCREEN_COLORS[r.c]} opacity={0.45} /> : null}
          </group>
        );
      })}

      {/* trees */}
      <instancedMesh ref={treeTopRef} args={[undefined, undefined, Math.max(1, trees.length)]} castShadow frustumCulled={false}>
        <coneGeometry args={[1.6, 4.4, 6]} />
        <meshLambertMaterial color={P.pine} flatShading />
      </instancedMesh>
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, Math.max(1, trees.length)]} frustumCulled={false}>
        <boxGeometry args={[0.4, 1.6, 0.4]} />
        <meshLambertMaterial color={P.trunk} flatShading />
      </instancedMesh>

      {/* street lamps */}
      <instancedMesh ref={lampPoleRef} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.18, 5.2, 0.18]} />
        <meshLambertMaterial color={P.pole} flatShading />
      </instancedMesh>
      <instancedMesh ref={lampHeadRef} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <boxGeometry args={[0.7, 0.3, 0.7]} />
        <meshBasicMaterial color={day ? "#6A6A60" : P.lampGlow} toneMapped={false} />
      </instancedMesh>

      {/* traffic */}
      {traffic ? (
        <>
          <instancedMesh ref={carRef} args={[undefined, undefined, cars.length]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshLambertMaterial flatShading />
          </instancedMesh>
          <instancedMesh ref={headRef} args={[undefined, undefined, cars.length]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={day ? "#E8E4DA" : "#FFF2C0"} toneMapped={false} />
          </instancedMesh>
          <instancedMesh ref={tailRef} args={[undefined, undefined, cars.length]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#FF3A2A" toneMapped={false} />
          </instancedMesh>
        </>
      ) : null}

      <SkylineRing radius={extent + 70} seed={`${seed}ring`} day={day} />
    </group>
  );
};

/** A far ring of tower silhouettes with sparse lit windows, so the horizon is never empty. */
const SkylineRing: React.FC<{ radius: number; seed: string; day: boolean; count?: number }> = ({ radius, seed, day, count = 46 }) => {
  const towers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`${seed}a${i}`) * 0.08;
        const r = radius + random(`${seed}r${i}`) * 40;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, w: 14 + random(`${seed}w${i}`) * 14, h: 24 + random(`${seed}h${i}`) * 60, a };
      }),
    [count, radius, seed],
  );
  const lights = useMemo(() => {
    const pts: number[] = [];
    towers.forEach((tw, i) => {
      for (let k = 0; k < 14; k++) {
        const u = (random(`${seed}lu${i}${k}`) - 0.5) * tw.w;
        const y = 2 + random(`${seed}ly${i}${k}`) * (tw.h - 4);
        // on the face looking back at the city centre
        const nx = -Math.cos(tw.a), nz = -Math.sin(tw.a);
        pts.push(tw.x + nx * (tw.w / 2 + 0.2) - nz * u, y, tw.z + nz * (tw.w / 2 + 0.2) + nx * u);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [towers, seed]);
  return (
    <group>
      {towers.map((tw, i) => (
        <mesh key={i} position={[tw.x, tw.h / 2, tw.z]} rotation={[0, -tw.a, 0]}>
          <BoxG args={[tw.w, tw.h, tw.w]} />
          <Flat color={day ? "#5A6478" : "#1A1E30"} />
        </mesh>
      ))}
      {!day ? (
        <points geometry={lights}>
          <pointsMaterial color={P.windowLit} size={3} sizeAttenuation={false} toneMapped={false} />
        </points>
      ) : null}
    </group>
  );
};
