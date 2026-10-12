/**
 * Small 3D models of each lab's mechanism, sitting on the hub pedestals.
 * `t` (0→1) is the hover amount; each emblem shows a hint of its mechanism as t rises.
 * Built labs are painted; unbuilt ones are plain clay.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group, Mesh } from 'three';

export const CLAY = '#d9d1c0';
const INK = '#2b2a27';

interface EmblemProps {
  t: { current: number };
  painted: boolean;
}

const paint = (painted: boolean, color: string) => (painted ? color : CLAY);

function Mat({ color, rough = 0.6 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} />;
}

/** A word-bar that splits into token blocks. */
function Tokenizer({ t, painted }: EmblemProps) {
  const parts = useRef<(Mesh | null)[]>([]);
  const widths = [0.42, 0.28, 0.5];
  const colors = ['#9db4ff', '#ffc493', '#8fdcb4'];
  useFrame(() => {
    let x = -(widths.reduce((a, b) => a + b, 0) + 0.24 * t.current) / 2;
    parts.current.forEach((m, i) => {
      if (!m) return;
      m.position.x = x + widths[i]! / 2;
      m.position.y = 0.2 + 0.08 * t.current * (i % 2 ? 1 : 0.4);
      x += widths[i]! + 0.12 * t.current;
    });
  });
  return (
    <group>
      {widths.map((w, i) => (
        <RoundedBox key={i} ref={(m) => void (parts.current[i] = m)} args={[w, 0.3, 0.42]} radius={0.06}>
          <Mat color={paint(painted, colors[i]!)} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** 2 → 3 → 1 network of nodes and links. */
function NeuralNet({ t, painted }: EmblemProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y = -0.35 + 0.7 * t.current;
  });
  const layers = [
    [-0.35, 0.35],
    [-0.5, 0, 0.5],
    [0],
  ];
  const nodes = layers.flatMap((col, li) => col.map((z) => [(li - 1) * 0.55, 0.32, z] as const));
  const links: [readonly number[], readonly number[]][] = [];
  layers.forEach((col, li) => {
    if (li === layers.length - 1) return;
    col.forEach((z1) => layers[li + 1]!.forEach((z2) => links.push([[(li - 1) * 0.55, 0.32, z1], [li * 0.55, 0.32, z2]])));
  });
  return (
    <group ref={g}>
      {nodes.map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.11, 24, 16]} />
          <Mat color={paint(painted, '#6f8cff')} />
        </mesh>
      ))}
      {links.map(([a, b], i) => {
        const dx = b[0]! - a[0]!;
        const dz = b[2]! - a[2]!;
        const len = Math.hypot(dx, dz);
        return (
          <mesh key={i} position={[(a[0]! + b[0]!) / 2, 0.32, (a[2]! + b[2]!) / 2]} rotation={[0, -Math.atan2(dz, dx), Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, len, 6]} />
            <Mat color={paint(painted, '#b9c6ff')} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A row of tokens with arcs linking them; arcs rise on hover. */
function Attention({ t, painted }: EmblemProps) {
  const arcs = useRef<(Group | null)[]>([]);
  useFrame(() => arcs.current.forEach((a, i) => a && a.scale.set(1, 0.55 + 0.6 * t.current * (1 - i * 0.2), 1)));
  const xs = [-0.6, -0.2, 0.2, 0.6];
  return (
    <group>
      {xs.map((x, i) => (
        <RoundedBox key={i} args={[0.26, 0.26, 0.26]} radius={0.05} position={[x, 0.13, 0.15]}>
          <Mat color={paint(painted, ['#ffc493', '#9db4ff', '#8fdcb4', '#f2b6e1'][i]!)} />
        </RoundedBox>
      ))}
      {[
        [-0.6, 0.6],
        [-0.2, 0.6],
        [-0.6, 0.2],
      ].map(([a, b], i) => (
        <group key={i} ref={(g) => void (arcs.current[i] = g)} position={[(a! + b!) / 2, 0.26, 0.15]}>
          <mesh>
            <torusGeometry args={[(b! - a!) / 2, 0.022, 8, 32, Math.PI]} />
            <Mat color={paint(painted, INK)} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A conveyor carrying tokens toward a stamp. */
function Inference({ t, painted }: EmblemProps) {
  const items = useRef<(Mesh | null)[]>([]);
  const phase = useRef(0);
  useFrame((_, dt) => {
    phase.current = (phase.current + dt * 0.5 * t.current) % 1;
    items.current.forEach((m, i) => m && (m.position.x = -0.7 + (((i / 3 + phase.current) % 1) * 1.1)));
  });
  return (
    <group>
      <RoundedBox args={[1.6, 0.12, 0.5]} radius={0.04} position={[0, 0.06, 0]}>
        <Mat color={paint(painted, '#4a4944')} />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} ref={(m) => void (items.current[i] = m)} args={[0.2, 0.2, 0.2]} radius={0.04} position={[0, 0.22, 0]}>
          <Mat color={paint(painted, ['#9db4ff', '#ffc493', '#8fdcb4'][i]!)} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.34, 0.55, 0.62]} radius={0.05} position={[0.62, 0.36, 0]}>
        <Mat color={paint(painted, '#6f8cff')} />
      </RoundedBox>
    </group>
  );
}

/** GPU racks whose memory slabs fill up on hover. */
function Serving({ t, painted }: EmblemProps) {
  const fills = useRef<(Mesh | null)[]>([]);
  useFrame(() => fills.current.forEach((m, i) => m && m.scale.set(1, 0.25 + t.current * (0.75 - i * 0.12), 1)));
  return (
    <group>
      {[-0.42, 0, 0.42].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <RoundedBox args={[0.32, 0.8, 0.5]} radius={0.04} position={[0, 0.4, 0]}>
            <Mat color={paint(painted, '#3d3c38')} />
          </RoundedBox>
          <mesh ref={(m) => void (fills.current[i] = m)} position={[0, 0.06, 0.26]}>
            <boxGeometry args={[0.22, 0.68, 0.02]} />
            <Mat color={paint(painted, i === 2 ? '#ff8a7a' : '#8fdcb4')} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A little agent with a belt of tools that orbit on hover. */
function Agent({ t, painted }: EmblemProps) {
  const belt = useRef<Group>(null);
  useFrame((_, dt) => {
    if (belt.current) belt.current.rotation.y += dt * 1.6 * t.current;
  });
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.6, 24]} />
        <Mat color={paint(painted, '#6f8cff')} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.2, 24, 16]} />
        <Mat color={paint(painted, '#f4f1ea')} />
      </mesh>
      <group ref={belt} position={[0, 0.3, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox
            key={i}
            args={[0.14, 0.14, 0.14]}
            radius={0.03}
            position={[Math.cos((i * Math.PI) / 2) * 0.45, 0, Math.sin((i * Math.PI) / 2) * 0.45]}
          >
            <Mat color={paint(painted, ['#ffc493', '#8fdcb4', '#f2b6e1', '#ffe17a'][i]!)} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

export const EMBLEMS: Record<string, (p: EmblemProps) => React.JSX.Element> = {
  tokenizer: Tokenizer,
  'neural-net': NeuralNet,
  attention: Attention,
  inference: Inference,
  serving: Serving,
  agent: Agent,
};
