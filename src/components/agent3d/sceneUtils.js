import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const HANDLERS = [
  "Classify",
  "Extract",
  "Estimate",
  "Price",
  "AmbiguityCheck",
  "Generate",
  "Compose",
];

export const COLORS = {
  frameTop: "#ffffff",
  frameBottom: "#cdebda",
  face: "#1b3b3a",
  ear: "#225643",
  eye: "#a9e697",
  lime: "#9fe870",
  forest: "#163300",
  coral: "#d25a43",
  pending: "#5c7161",
  skipped: "#8fa48f",
  line: "#d7ddd2",
  white: "#ffffff",
};

const SUCCEEDED = new Set(["SUCCEEDED", "SUCCESS", "COMPLETED", "DONE", "OK"]);
const FAILED = new Set(["FAILED", "ERROR", "CRASHED", "EXCEPTION"]);
const RUNNING = new Set(["RUNNING", "IN_PROGRESS", "STARTED", "EXECUTING"]);
const SKIPPED = new Set(["SKIPPED", "SKIPPED_STEP", "IGNORED", "CANCELLED", "CANCELED"]);

export function normalizeHandler(name) {
  if (!name) return "";
  const clean = String(name).trim().replace(/Handler$/i, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function toState(status) {
  const value = String(status || "").toUpperCase();
  if (SUCCEEDED.has(value)) return "succeeded";
  if (FAILED.has(value)) return "failed";
  if (RUNNING.has(value)) return "running";
  if (SKIPPED.has(value)) return "skipped";
  return "pending";
}

export function handlerStates(steps = [], isProcessing = false) {
  const list = Array.isArray(steps) ? steps : [];
  const map = new Map();
  for (const step of list) {
    if (!step) continue;
    map.set(normalizeHandler(step.handler ?? step.handlerName), step.status);
  }
  const states = HANDLERS.map((name) => toState(map.get(name)));
  if (isProcessing && !states.includes("running")) {
    const index = states.findIndex((state) => state === "pending");
    if (index >= 0) states[index] = "running";
  }
  return states;
}

export function createRoundedPlane(width, height, radius, thickness, bevel = 0.01) {
  const bound = thickness / 2 - 0.0015;
  const b = Math.max(0, Math.min(bevel, bound));
  const w = width / 2 - b;
  const h = height / 2 - b;
  const r = Math.max(0.004, Math.min(radius - b, w, h));
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, thickness - b * 2),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 10,
    steps: 1,
  });
  geometry.center();
  return toCreasedNormals(geometry, Math.PI / 4);
}

export function blinkScale(time, animate) {
  if (!animate) return 1;
  const period = 3.9;
  const window = 0.055;
  const p = ((time + 1.4) % period) / period;
  if (p >= window) return 1;
  const u = p / window;
  return 1 - Math.sin(u * Math.PI) * 0.9;
}

export function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(t) {
  const k = Math.max(0, Math.min(1, t));
  return 1 - (1 - k) ** 3;
}

export function easeInCubic(t) {
  const k = Math.max(0, Math.min(1, t));
  return k ** 3;
}
