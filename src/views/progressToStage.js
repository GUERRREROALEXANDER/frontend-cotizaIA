// The backend reports the agent run as a list of steps, each SUCCEEDED or FAILED.
// The Inbox ladder is a fixed list of human labels, so the current rung is derived
// from how far the real run got instead of from a decorative timer.
//
// - no steps yet (run just started)      -> first rung
// - N steps succeeded                    -> rung N (the one in flight)
// - a step failed                        -> the failed rung, so the ladder stops there
// - run finished                         -> last rung
export function progressToStage(steps, stages) {
  const rungs = Array.isArray(stages) ? stages : [];
  if (rungs.length === 0) return 0;

  const list = (Array.isArray(steps) ? steps : []).filter(Boolean);
  if (list.length === 0) return 0;

  const status = (step) => String(step.status || "").toUpperCase();
  const failedIndex = list.findIndex((step) => status(step) === "FAILED");
  const succeeded = list.filter((step) => status(step) === "SUCCEEDED").length;
  const index = failedIndex >= 0 ? failedIndex : succeeded;

  return Math.max(0, Math.min(index, rungs.length - 1));
}
