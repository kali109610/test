import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, RoundedBox } from '@react-three/drei';
import { Vector3, type Group, type PerspectiveCamera } from 'three';
import type { LabMeta } from '../labs/registry';
import type { NodePosition } from './layout';

interface Props {
  labs: LabMeta[];
  positions: NodePosition[];
  done: Record<string, number>;
  hovered: string | null;
  selected: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function LabNode({
  lab,
  pos,
  active,
  onHover,
  onOpen,
  groups,
}: {
  groups: RefObject<Map<string, Group>>;
  lab: LabMeta;
  pos: NodePosition;
  active: boolean;
  onHover: Props['onHover'];
  onOpen: Props['onOpen'];
}) {
  const built = lab.status === 'ready';
  const group = useRef<Group | null>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const targetZ = active ? 0.35 : 0;
    const targetS = active ? 1.08 : 1;
    // Frame-rate independent damping; snaps under reduced motion.
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 18);
    g.position.z += (targetZ - g.position.z) * k;
    const s = g.scale.x + (targetS - g.scale.x) * k;
    g.scale.setScalar(s);
  });

  return (
    <group position={[pos.x, pos.y, 0]}>
      <group
        ref={(g) => {
          group.current = g;
          if (g) groups.current.set(lab.id, g);
          else groups.current.delete(lab.id);
        }}
      >
        <RoundedBox
          args={[BOX_W, 0.9, 0.35]}
          radius={0.12}
          smoothness={4}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(lab.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            onHover(null);
            document.body.style.cursor = '';
          }}
          onClick={(e) => {
            e.stopPropagation();
            document.body.style.cursor = '';
            onOpen(lab.id);
          }}
        >
          <meshStandardMaterial
            color={built ? '#2f5bea' : active ? '#ffffff' : '#fbfaf8'}
            roughness={0.55}
            transparent={!built}
            opacity={built ? 1 : 0.92}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

const FOV = 32;
const BOX_W = 1.5;

/** Keep the whole map in view at any aspect ratio. */
function FitCamera({ halfWidth, halfHeight }: { halfWidth: number; halfHeight: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  useMemo(() => {
    const tanV = Math.tan((FOV * Math.PI) / 360);
    const dist = Math.max(halfHeight / tanV, halfWidth / (tanV * aspect));
    const tilt = 0.28; // look slightly up at the board
    camera.position.set(0, -dist * Math.sin(tilt), dist * Math.cos(tilt));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspect, halfWidth, halfHeight]);
  return null;
}

/** Pins each DOM label to its node every frame (follows the hover lift too). */
function LabelProjector({
  groups,
  labels,
}: {
  groups: RefObject<Map<string, Group>>;
  labels: RefObject<Map<string, HTMLDivElement>>;
}) {
  const v = useMemo(() => new Vector3(), []);
  const edge = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const [id, g] of groups.current) {
      const el = labels.current.get(id);
      if (!el) continue;
      g.getWorldPosition(v);
      // Label width = the box's on-screen width, so text can never spill past it.
      edge.copy(v).setX(v.x + (BOX_W / 2) * g.scale.x).project(camera);
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      const halfPx = ((edge.x - v.x) / 2) * size.width;
      el.style.width = `${Math.max(0, halfPx * 2 - 12)}px`;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }
  });
  return null;
}

export function HubScene({ labs, positions, done, hovered, selected, onHover, onOpen }: Props) {
  const groups = useRef(new Map<string, Group>());
  const labels = useRef(new Map<string, HTMLDivElement>());
  const halfWidth = Math.max(...positions.map((p) => Math.abs(p.x))) + 1.1;
  // Extra vertical margin keeps nodes clear of the header and footer overlays.
  const halfHeight = Math.max(...positions.map((p) => Math.abs(p.y))) + 1.6;
  const posById = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);
  const edges = useMemo(
    () =>
      labs.flatMap((l) =>
        l.prerequisites.map((pre) => {
          const a = posById.get(pre)!;
          const b = posById.get(l.id)!;
          // Leave from the side of the box that faces the next lab.
          const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
          const [ox, oy] = horizontal ? [0.75 * Math.sign(b.x - a.x), 0] : [0, 0.45 * Math.sign(b.y - a.y)];
          return {
            key: `${pre}->${l.id}`,
            from: [a.x + ox, a.y + oy, -0.1],
            to: [b.x - ox, b.y - oy, -0.1],
          } as const;
        }),
      ),
    [labs, posById],
  );

  return (
    <div className="relative h-full w-full">
    <Canvas
      camera={{ fov: FOV }}
      dpr={[1, 2]}
      onPointerMissed={() => onHover(null)}
      aria-hidden
    >
      <FitCamera halfWidth={halfWidth} halfHeight={halfHeight} />
      <LabelProjector groups={groups} labels={labels} />
      <color attach="background" args={['#f7f6f3']} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, -4, 8]} intensity={1.4} />
      {edges.map((e) => (
        <Line key={e.key} points={[e.from, e.to]} color="#c9c6be" lineWidth={2} />
      ))}
      {labs.map((lab) => (
        <LabNode
          key={lab.id}
          lab={lab}
          pos={posById.get(lab.id)!}
          active={hovered === lab.id || selected === lab.id}
          onHover={onHover}
          onOpen={onOpen}
          groups={groups}
        />
      ))}
    </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {labs.map((lab) => {
          const built = lab.status === 'ready';
          return (
            <div
              key={lab.id}
              ref={(el) => {
                if (el) labels.current.set(lab.id, el);
                else labels.current.delete(lab.id);
              }}
              className="absolute top-0 left-0 text-center select-none"
              style={{ transform: 'translate(-9999px, 0)' }}
            >
              <div className={`truncate text-sm font-semibold ${built ? 'text-white' : 'text-ink'}`}>{lab.title}</div>
              <div className={`truncate text-[11px] ${built ? 'text-white/80' : 'text-muted'}`}>
                {built ? `${done[lab.id] ?? 0}/${lab.missionCount} missions` : 'not built yet'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
