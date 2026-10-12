import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Line } from '@react-three/drei';
import { Vector3, type Group, type OrthographicCamera } from 'three';
import clsx from 'clsx';
import type { LabMeta } from '../labs/registry';
import { CLAY, EMBLEMS } from './Emblems';
import type { NodePosition } from './layout';

interface Props {
  /** Pixels at the top covered by an overlay (the hub header). */
  reserveTop: number;
  labs: LabMeta[];
  positions: NodePosition[];
  done: Record<string, number>;
  hovered: string | null;
  selected: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}

const R = 1.05; // pedestal radius
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Layout (x, y) → ground plane (x, -y): the map lies on a table seen from the front and above. */
const ground = (p: NodePosition) => [p.x, 0, -p.y] as const;

function Station({
  lab,
  pos,
  active,
  onHover,
  onOpen,
  anchors,
}: {
  lab: LabMeta;
  pos: NodePosition;
  active: boolean;
  onHover: Props['onHover'];
  onOpen: Props['onOpen'];
  anchors: RefObject<Map<string, Group>>;
}) {
  const lift = useRef<Group>(null);
  const t = useRef(0);
  const built = lab.status === 'ready';
  const Emblem = EMBLEMS[lab.id];

  useFrame((_, dt) => {
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 12);
    t.current += ((active ? 1 : 0) - t.current) * k;
    if (lift.current) lift.current.position.y = 0.18 * t.current;
  });

  return (
    <group position={ground(pos)}>
      <group
        ref={lift}
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
        {/* pedestal */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[R, R * 1.04, 0.28, 64]} />
          <meshStandardMaterial color={built ? '#ffffff' : '#f1ede4'} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.285, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[R * 0.92, R * 0.95, 64]} />
          <meshBasicMaterial color={built ? '#3355e0' : CLAY} />
        </mesh>
        <group position={[0, 0.29, 0]} scale={1.3}>
          {Emblem && <Emblem t={t} painted={built} />}
        </group>
        {/* label anchor at the pedestal's front edge */}
        <group
          position={[0, 0, R + 0.15]}
          ref={(g) => {
            if (g) anchors.current.set(lab.id, g);
            else anchors.current.delete(lab.id);
          }}
        />
      </group>
    </group>
  );
}

/** Fit the whole table in view at any aspect ratio; drift slightly with the pointer. */
function Rig({ halfW, halfD, reserveTop }: { halfW: number; halfD: number; reserveTop: number }) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const size = useThree((s) => s.size);
  const look = useMemo(() => new Vector3(0, 0, 0), []);
  const drift = useRef({ x: 0, y: 0 });
  useFrame(({ pointer }, dt) => {
    // Seen from 50° above: depth shrinks by sin(50°), and pedestals add a little height.
    const visW = halfW * 2 + 0.6;
    const visH = halfD * 2 * Math.sin((50 * Math.PI) / 180) + 1.4;
    const usableH = size.height - reserveTop;
    camera.zoom = Math.min(size.width / visW, usableH / visH);
    // Push the table down so the header overlay never sits on a pedestal.
    camera.setViewOffset(size.width, size.height, 0, -reserveTop / 2, size.width, size.height);
    const k = reduceMotion ? 0 : 1 - Math.exp(-dt * 3);
    drift.current.x += (pointer.x * 0.5 - drift.current.x) * k;
    drift.current.y += (pointer.y * 0.3 - drift.current.y) * k;
    const el = (50 * Math.PI) / 180;
    camera.position.set(drift.current.x, 20 * Math.sin(el), 20 * Math.cos(el) - drift.current.y);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  });
  return null;
}

/** Pins each DOM label under its pedestal every frame. */
function LabelProjector({
  anchors,
  labels,
}: {
  anchors: RefObject<Map<string, Group>>;
  labels: RefObject<Map<string, HTMLDivElement>>;
}) {
  const v = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const [id, g] of anchors.current) {
      const el = labels.current.get(id);
      if (!el) continue;
      g.getWorldPosition(v).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px)`;
    }
  });
  return null;
}

export function HubScene({ reserveTop, labs, positions, done, hovered, selected, onHover, onOpen }: Props) {
  const anchors = useRef(new Map<string, Group>());
  const labels = useRef(new Map<string, HTMLDivElement>());
  const posById = useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);
  const halfW = Math.max(...positions.map((p) => Math.abs(p.x))) + R;
  const halfD = Math.max(...positions.map((p) => Math.abs(p.y))) + R + 0.7;

  const paths = useMemo(
    () =>
      labs.flatMap((l) =>
        l.prerequisites.map((pre) => {
          const a = ground(posById.get(pre)!);
          const b = ground(posById.get(l.id)!);
          const dx = b[0] - a[0];
          const dz = b[2] - a[2];
          const len = Math.hypot(dx, dz);
          const ux = dx / len;
          const uz = dz / len;
          const from: [number, number, number] = [a[0] + ux * R, 0.01, a[2] + uz * R];
          const to: [number, number, number] = [b[0] - ux * R, 0.01, b[2] - uz * R];
          const open = labs.find((x) => x.id === pre)?.status === 'ready';
          return { key: `${pre}->${l.id}`, from, to, open };
        }),
      ),
    [labs, posById],
  );

  return (
    <div className="relative h-full w-full">
      <Canvas orthographic camera={{ position: [0, 15, 13], zoom: 60, near: 0.1, far: 100 }} dpr={[1, 2]} aria-hidden>
        <color attach="background" args={['#e6e1d5']} />
        <Rig halfW={halfW} halfD={halfD} reserveTop={reserveTop} />
        <LabelProjector anchors={anchors} labels={labels} />
        <hemisphereLight args={['#ffffff', '#bfb49c', 1.25]} />
        <directionalLight position={[-6, 9, 7]} intensity={2.3} />
        <ContactShadows position={[0, 0.005, 0]} scale={30} blur={2} opacity={0.4} far={3} resolution={512} color="#5b5140" />
        {paths.map((p) => (
          <Line
            key={p.key}
            points={[p.from, p.to]}
            color={p.open ? '#3355e0' : '#cfc8b8'}
            lineWidth={2.5}
            dashed={!p.open}
            dashSize={0.18}
            gapSize={0.14}
          />
        ))}
        {labs.map((lab) => (
          <Station
            key={lab.id}
            lab={lab}
            pos={posById.get(lab.id)!}
            active={hovered === lab.id || selected === lab.id}
            onHover={onHover}
            onOpen={onOpen}
            anchors={anchors}
          />
        ))}
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {labs.map((lab) => {
          const built = lab.status === 'ready';
          const active = hovered === lab.id || selected === lab.id;
          const n = done[lab.id] ?? 0;
          return (
            <div
              key={lab.id}
              ref={(el) => {
                if (el) labels.current.set(lab.id, el);
                else labels.current.delete(lab.id);
              }}
              className="absolute top-0 left-0 flex max-w-36 flex-col items-center text-center select-none"
              style={{ transform: 'translate(-9999px, 0)' }}
            >
              <span
                className={clsx(
                  'max-w-full truncate rounded-full px-2.5 py-0.5 font-display text-[13px] font-semibold transition-colors duration-150',
                  active ? 'bg-ink text-white' : built ? 'bg-white text-ink shadow-sm' : 'text-muted',
                )}
              >
                <span className="mr-1 opacity-50 tabular-nums">{lab.order}</span>
                {lab.title}
              </span>
              {built ? (
                <span className="mt-1 flex gap-1" aria-label={`${n} of ${lab.missionCount} missions done`}>
                  {Array.from({ length: lab.missionCount }, (_, i) => (
                    <span key={i} className={clsx('size-1.5 rounded-full', i < n ? 'bg-accent' : 'bg-line')} />
                  ))}
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] tracking-wide text-muted uppercase">not built yet</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
