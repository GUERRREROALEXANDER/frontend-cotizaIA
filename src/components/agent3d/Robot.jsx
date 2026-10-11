import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { COLORS, blinkScale, createRoundedPlane } from "./sceneUtils.js";

const HEAD_W = 2.24;
const HEAD_H = 1.8;
const HEAD_T = 0.95;
const FACE_W = 1.72;
const FACE_H = 1.16;
const FACE_Z = 0.46;
const EYE_X = 0.36;
const EYE_Y = -0.06;
const EYE_Z = 0.53;

export function Robot({ animate = true, processing = false }) {
  const rootRef = useRef(null);
  const headRef = useRef(null);
  const headMeshRef = useRef(null);
  const eyeLeftRef = useRef(null);
  const eyeRightRef = useRef(null);
  const tipRef = useRef(null);
  const faceMatRef = useRef(null);
  const timeRef = useRef(0);

  const headGeo = useMemo(
    () => createRoundedPlane(HEAD_W, HEAD_H, 0.78, HEAD_T, 0.12),
    [],
  );
  const faceGeo = useMemo(
    () => createRoundedPlane(FACE_W, FACE_H, 0.34, 0.12, 0.03),
    [],
  );

  useEffect(
    () => () => {
      headGeo.dispose();
      faceGeo.dispose();
    },
    [headGeo, faceGeo],
  );

  useLayoutEffect(() => {
    const mesh = headMeshRef.current;
    if (!mesh || !mesh.geometry) return;
    const geo = mesh.geometry;
    const position = geo.attributes.position;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const span = Math.max(maxY - minY, 1e-5);
    const colors = new Float32Array(position.count * 3);
    const top = new THREE.Color(COLORS.frameTop);
    const bottom = new THREE.Color(COLORS.frameBottom);
    const mixed = new THREE.Color();
    for (let i = 0; i < position.count; i += 1) {
      const t = (position.getY(i) - minY) / span;
      mixed.copy(bottom).lerp(top, t);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    mesh.material.vertexColors = true;
    mesh.material.needsUpdate = true;
  }, [headGeo]);

  const place = (time) => {
    const root = rootRef.current;
    if (root) {
      root.position.y = animate ? Math.sin(time * 0.9) * 0.06 : 0;
      root.rotation.y = animate ? Math.sin(time * 0.33) * 0.07 : 0;
      root.rotation.x = animate ? Math.sin(time * 0.5 + 1.2) * 0.02 : 0;
    }
    const head = headRef.current;
    if (head) {
      head.rotation.z = animate ? Math.sin(time * 0.55) * 0.05 : 0;
      head.rotation.y = animate ? Math.sin(time * 0.41 + 0.6) * 0.09 : 0;
    }
    const blink = blinkScale(time, animate);
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = blink;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = blink;
    const tip = tipRef.current;
    if (tip) {
      tip.material.emissiveIntensity = processing
        ? 0.85 + Math.sin(time * 5.2) * 0.65
        : 0.35;
    }
    const faceMat = faceMatRef.current;
    if (faceMat) {
      faceMat.emissiveIntensity = processing
        ? 0.3 + Math.sin(time * 3.4) * 0.12
        : 0.1;
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
    <group ref={rootRef}>
      <group ref={headRef}>
        <mesh ref={headMeshRef} geometry={headGeo}>
          <meshPhysicalMaterial
            color={COLORS.frameTop}
            roughness={0.4}
            metalness={0}
            clearcoat={0.9}
            clearcoatRoughness={0.32}
          />
        </mesh>

        <mesh geometry={faceGeo} position={[0, 0, FACE_Z]}>
          <meshStandardMaterial
            ref={faceMatRef}
            color={COLORS.face}
            roughness={0.35}
            metalness={0.08}
            emissive={COLORS.face}
            emissiveIntensity={0.1}
          />
        </mesh>

        <Eye x={-EYE_X} meshRef={eyeLeftRef} />
        <Eye x={EYE_X} meshRef={eyeRightRef} />

        <Ear direction={-1} />
        <Ear direction={1} />

        <RoundedBox
          args={[0.36, 0.16, 0.36]}
          radius={0.05}
          smoothness={3}
          position={[0, 0.92, 0]}
        >
          <meshStandardMaterial color={COLORS.ear} roughness={0.55} />
        </RoundedBox>

        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.36, 12]} />
          <meshStandardMaterial color={COLORS.ear} roughness={0.55} />
        </mesh>

        <mesh ref={tipRef} position={[0, 1.44, 0]}>
          <sphereGeometry args={[0.14, 24, 16]} />
          <meshStandardMaterial
            color={COLORS.eye}
            emissive={COLORS.eye}
            emissiveIntensity={0.35}
            roughness={0.35}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  );
}

function Eye({ x, meshRef }) {
  return (
    <group ref={meshRef} position={[x, EYE_Y, EYE_Z]}>
      <mesh>
        <torusGeometry args={[0.13, 0.05, 8, 28, Math.PI]} />
        <meshStandardMaterial
          color={COLORS.eye}
          emissive={COLORS.eye}
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[-0.13, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial
          color={COLORS.eye}
          emissive={COLORS.eye}
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0.13, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <meshStandardMaterial
          color={COLORS.eye}
          emissive={COLORS.eye}
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function Ear({ direction }) {
  return (
    <mesh position={[direction * 1.22, -0.04, 0]}>
      <capsuleGeometry args={[0.16, 0.36, 6, 16]} />
      <meshStandardMaterial color={COLORS.ear} roughness={0.55} />
    </mesh>
  );
}
