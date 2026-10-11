import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, HANDLERS } from "./sceneUtils.js";

const RING_RADIUS = 1.95;
const RING_Y = -1.55;

const TONE = {
  succeeded: { color: COLORS.lime, emissive: COLORS.lime, intensity: 1.6 },
  failed: { color: COLORS.coral, emissive: COLORS.coral, intensity: 1.35 },
  running: { color: COLORS.lime, emissive: COLORS.lime, intensity: 1.4 },
  skipped: { color: COLORS.skipped, emissive: COLORS.skipped, intensity: 0.12 },
  pending: { color: COLORS.pending, emissive: COLORS.pending, intensity: 0.15 },
};

export function ProgressRing({ states, animate = true }) {
  const orbRefs = useRef([]);
  const timeRef = useRef(0);
  const count = states.length;

  const materials = useMemo(
    () =>
      states.map((state) => {
        const tone = TONE[state] ?? TONE.pending;
        return new THREE.MeshStandardMaterial({
          color: tone.color,
          emissive: tone.emissive,
          emissiveIntensity: tone.intensity,
          roughness: 0.4,
          metalness: 0,
        });
      }),
    [states],
  );

  useEffect(
    () => () => {
      materials.forEach((material) => material.dispose());
    },
    [materials],
  );

  const place = (time) => {
    for (let i = 0; i < count; i += 1) {
      const orb = orbRefs.current[i];
      if (!orb) continue;
      const running = states[i] === "running";
      if (running && animate) {
        const wave = Math.sin(time * 5.5 + i * 0.7);
        orb.scale.setScalar(1 + wave * 0.28);
        orb.material.emissiveIntensity = 1.3 + wave * 0.8;
      } else if (running) {
        orb.scale.setScalar(1.22);
      } else {
        orb.scale.setScalar(1);
      }
    }
  };

  useLayoutEffect(() => {
    if (!animate) place(0);
  });

  useFrame((_, delta) => {
    if (!animate) return;
    timeRef.current += Math.min(delta, 0.05);
    place(timeRef.current);
  });

  return (
    <group position={[0, RING_Y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.014, 6, 80]} />
        <meshBasicMaterial
          color={COLORS.skipped}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
      {states.map((state, index) => {
        const angle = Math.PI / 2 + (index / count) * Math.PI * 2;
        return (
          <mesh
            key={HANDLERS[index] ?? index}
            ref={(node) => {
              orbRefs.current[index] = node;
            }}
            material={materials[index]}
            position={[
              Math.cos(angle) * RING_RADIUS,
              0,
              Math.sin(angle) * RING_RADIUS,
            ]}
          >
            <sphereGeometry args={[0.11, 20, 14]} />
          </mesh>
        );
      })}
    </group>
  );
}
