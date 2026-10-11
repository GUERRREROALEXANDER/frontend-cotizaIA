import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  COLORS,
  createRoundedPlane,
  easeInCubic,
  easeOutCubic,
  smoothstep,
} from "./sceneUtils.js";

const CARD_COUNT = 6;
const ORBIT_RADIUS = 2.6;
const TILT = 0.26;
const ORBIT_SPEED = 0.14;
const CYCLE_SPEED = 0.2;
const FACE = new THREE.Vector3(0, 0.1, 1.15);

export function BriefCards({ animate = true, absorbTarget = 0 }) {
  const cardRefs = useRef([]);
  const timeRef = useRef(0);
  const absorbRef = useRef(absorbTarget);

  const geometry = useMemo(
    () => ({
      edge: createRoundedPlane(0.7, 0.9, 0.12, 0.03, 0.006),
      body: createRoundedPlane(0.63, 0.83, 0.09, 0.03, 0.005),
      bar: createRoundedPlane(0.3, 0.07, 0.03, 0.02, 0.004),
      line: createRoundedPlane(0.38, 0.04, 0.02, 0.02, 0.004),
    }),
    [],
  );

  const materials = useMemo(
    () =>
      Array.from({ length: CARD_COUNT }, () => ({
        edge: new THREE.MeshStandardMaterial({
          color: COLORS.lime,
          roughness: 0.45,
          metalness: 0,
          transparent: true,
          opacity: 1,
        }),
        body: new THREE.MeshStandardMaterial({
          color: COLORS.white,
          roughness: 0.62,
          metalness: 0,
          transparent: true,
          opacity: 1,
        }),
        bar: new THREE.MeshStandardMaterial({
          color: COLORS.lime,
          roughness: 0.45,
          metalness: 0,
          transparent: true,
          opacity: 1,
        }),
        line: new THREE.MeshStandardMaterial({
          color: COLORS.line,
          roughness: 0.85,
          metalness: 0,
          transparent: true,
          opacity: 1,
        }),
      })),
    [],
  );

  useEffect(
    () => () => {
      materials.forEach((set) => {
        Object.values(set).forEach((material) => material.dispose());
      });
    },
    [materials],
  );

  useEffect(
    () => () => {
      Object.values(geometry).forEach((item) => item.dispose());
    },
    [geometry],
  );

  const place = (time, absorb) => {
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);
    for (let i = 0; i < CARD_COUNT; i += 1) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const phase = animate
        ? (time * CYCLE_SPEED + i / CARD_COUNT) % 1
        : 0.5;
      const amount = absorb * (animate ? easeInCubic(phase) : 0.55);
      const angle = (i / CARD_COUNT) * Math.PI * 2 + time * ORBIT_SPEED;
      const bob = animate ? Math.sin(time * 0.85 + i * 1.7) * 0.13 : 0;
      const ox = Math.cos(angle) * ORBIT_RADIUS;
      const oz = Math.sin(angle) * ORBIT_RADIUS;
      const oy = bob * cosT - oz * sinT;
      const ozz = bob * sinT + oz * cosT;
      card.position.set(
        ox + (FACE.x - ox) * amount,
        oy + (FACE.y - oy) * amount,
        ozz + (FACE.z - ozz) * amount,
      );
      card.scale.setScalar(Math.max(1 - amount * 0.9, 0.05));
      card.rotation.set(
        animate ? Math.sin(time * 0.5 + i) * 0.12 : 0,
        animate ? Math.sin(time * 0.37 + i * 2.1) * 0.18 : 0,
        animate ? Math.sin(time * 0.62 + i) * 0.07 : 0,
      );
      const spawn = !animate || absorb < 0.02 ? 1 : smoothstep(0, 0.12, phase);
      const opacity = Math.max((1 - amount * 0.92) * spawn, 0);
      const set = materials[i];
      set.edge.opacity = opacity;
      set.body.opacity = opacity;
      set.bar.opacity = opacity;
      set.line.opacity = opacity;
      card.visible = opacity > 0.01;
    }
  };

  useLayoutEffect(() => {
    if (!animate) place(0, absorbTarget);
  });

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    absorbRef.current = THREE.MathUtils.damp(
      absorbRef.current,
      absorbTarget,
      1.8,
      step,
    );
    if (!animate) return;
    timeRef.current += step;
    place(timeRef.current, absorbRef.current);
  });

  return (
    <group>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <group
          key={i}
          ref={(node) => {
            cardRefs.current[i] = node;
          }}
        >
          <mesh geometry={geometry.edge} material={materials[i].edge} />
          <mesh
            geometry={geometry.body}
            material={materials[i].body}
            position={[0, 0, 0.022]}
          />
          <mesh
            geometry={geometry.bar}
            material={materials[i].bar}
            position={[-0.1, 0.28, 0.045]}
          />
          <mesh
            geometry={geometry.line}
            material={materials[i].line}
            position={[-0.03, 0.16, 0.045]}
          />
          <mesh
            geometry={geometry.line}
            material={materials[i].line}
            position={[-0.11, 0.06, 0.045]}
          />
        </group>
      ))}
    </group>
  );
}

export function ProposalCard({ animate = true, ready = false }) {
  const cardRef = useRef(null);
  const timeRef = useRef(0);
  const emergeRef = useRef(ready ? 1 : 0);

  const geometry = useMemo(
    () => ({
      plate: createRoundedPlane(0.95, 1.18, 0.16, 0.05, 0.012),
      head: createRoundedPlane(0.5, 0.09, 0.04, 0.02, 0.005),
      line: createRoundedPlane(0.6, 0.05, 0.025, 0.02, 0.005),
      seal: createRoundedPlane(0.2, 0.2, 0.06, 0.02, 0.005),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      plate: new THREE.MeshStandardMaterial({
        color: COLORS.lime,
        emissive: COLORS.lime,
        emissiveIntensity: 0.85,
        roughness: 0.35,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
      mark: new THREE.MeshStandardMaterial({
        color: COLORS.forest,
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      Object.values(geometry).forEach((item) => item.dispose());
      Object.values(materials).forEach((item) => item.dispose());
    },
    [geometry, materials],
  );

  const place = (time, emerge) => {
    const card = cardRef.current;
    if (!card) return;
    const k = easeOutCubic(emerge);
    const bob = animate ? Math.sin(time * 0.8) * 0.05 * emerge : 0;
    card.position.set(0, -1 + k * 1.9 + bob, 1.55);
    card.scale.setScalar(0.35 + k * 0.65);
    card.rotation.set(0.05, -0.16, 0.04);
    materials.plate.opacity = emerge;
    materials.mark.opacity = emerge;
    materials.plate.emissiveIntensity =
      0.75 + (animate ? Math.sin(time * 2.4) * 0.18 * emerge : 0.15 * emerge);
    card.visible = emerge > 0.01;
  };

  useLayoutEffect(() => {
    if (!animate) place(0, ready ? 1 : 0);
  });

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    emergeRef.current = THREE.MathUtils.damp(
      emergeRef.current,
      ready ? 1 : 0,
      2.4,
      step,
    );
    if (!animate) return;
    timeRef.current += step;
    place(timeRef.current, emergeRef.current);
  });

  return (
    <group ref={cardRef} visible={false}>
      <mesh geometry={geometry.plate} material={materials.plate} />
      <mesh
        geometry={geometry.head}
        material={materials.mark}
        position={[-0.12, 0.38, 0.03]}
      />
      <mesh
        geometry={geometry.line}
        material={materials.mark}
        position={[-0.05, 0.18, 0.03]}
      />
      <mesh
        geometry={geometry.line}
        material={materials.mark}
        position={[0, 0.02, 0.03]}
      />
      <mesh
        geometry={geometry.seal}
        material={materials.mark}
        position={[0.28, -0.38, 0.03]}
      />
    </group>
  );
}
