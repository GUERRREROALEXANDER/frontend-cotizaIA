import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { BriefCards, ProposalCard } from "./BriefCards.jsx";
import { ProgressRing } from "./ProgressRing.jsx";
import { Robot } from "./Robot.jsx";
import { COLORS, handlerStates } from "./sceneUtils.js";

function CameraRig({ animate }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const timeRef = useRef(0);
  const aspect = size.height > 0 ? size.width / size.height : 1.7;
  const distance = Math.max(7.5, 9.8 / Math.max(aspect, 0.35));

  const place = (time) => {
    camera.position.set(
      animate ? Math.sin(time * 0.21) * 0.3 : 0,
      animate ? 0.45 + Math.sin(time * 0.17) * 0.1 : 0.45,
      animate ? distance + Math.sin(time * 0.13) * 0.15 : distance,
    );
    camera.lookAt(0, -0.15, 0);
  };

  useLayoutEffect(() => {
    place(0);
  }, [animate, distance]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    if (animate) timeRef.current += step;
    place(timeRef.current);
  });

  return null;
}

function Scene({ animate, states, absorbTarget, proposalReady, processing }) {
  return (
    <>
      <hemisphereLight args={["#ffffff", COLORS.frameBottom, 0.9]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[4.5, 6, 5]} intensity={1.9} />
      <directionalLight
        position={[-5, 1.5, 3.5]}
        intensity={0.55}
        color="#dff3e6"
      />
      <pointLight
        position={[0, 1.6, -4]}
        intensity={14}
        distance={0}
        decay={2}
        color={COLORS.lime}
      />
      <CameraRig animate={animate} />
      <Robot animate={animate} processing={processing} />
      <BriefCards animate={animate} absorbTarget={absorbTarget} />
      <ProposalCard animate={animate} ready={proposalReady} />
      <ProgressRing states={states} animate={animate} />
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.35}
        scale={8}
        blur={2.6}
        far={3}
        color="#163300"
      />
    </>
  );
}

export default function AgentScene({
  steps = [],
  isProcessing = false,
  className = "",
}) {
  const reduced = useReducedMotion();
  const prefersReduced = reduced === true;
  const containerRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState !== "hidden",
  );

  const states = useMemo(
    () => handlerStates(steps, isProcessing),
    [steps, isProcessing],
  );

  const succeeded = states.filter((state) => state === "succeeded").length;
  const proposalReady = states[states.length - 1] === "succeeded";
  const progressAbsorb =
    succeeded === 0
      ? 0
      : Math.min(1, 0.4 + (succeeded / states.length) * 0.6);
  const absorbTarget = proposalReady ? 1 : progressAbsorb;

  const processing =
    isProcessing || states.some((state) => state === "running");
  const animate = pageVisible && inView && !prefersReduced;
  const frameloop = !pageVisible || !inView
    ? "never"
    : prefersReduced
      ? "demand"
      : "always";

  const cameraProps = useMemo(
    () => ({ position: [0, 0.45, 7.5], fov: 35, near: 0.1, far: 60 }),
    [],
  );
  const glProps = useMemo(() => ({ alpha: true, antialias: true }), []);
  const dprProps = useMemo(() => [1, 1.5], []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(Boolean(entry && entry.isIntersecting));
      },
      { threshold: 0, rootMargin: "0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const read = () => {
      setPageVisible(
        typeof document === "undefined"
          ? true
          : document.visibilityState !== "hidden",
      );
    };
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, []);

  return (
    <div ref={containerRef} className={"relative h-full w-full " + className}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        dpr={dprProps}
        frameloop={frameloop}
        camera={cameraProps}
        gl={glProps}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        role="img"
        aria-label="Animación del agente procesando el brief"
      >
        <Scene
          animate={animate}
          states={states}
          absorbTarget={absorbTarget}
          proposalReady={proposalReady}
          processing={processing}
        />
      </Canvas>
    </div>
  );
}
