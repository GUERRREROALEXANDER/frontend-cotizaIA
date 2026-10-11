import { Suspense, createElement, lazy } from "react";
import { AgentSceneFallback } from "./AgentSceneFallback.jsx";

const AgentSceneRaw = lazy(() => import("./AgentScene.jsx"));

export function AgentSceneLazy(props) {
  return createElement(
    Suspense,
    { fallback: createElement(AgentSceneFallback, null) },
    createElement(AgentSceneRaw, props),
  );
}

export { AgentSceneFallback, AgentSceneRaw };
export default AgentSceneLazy;
