import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { get } from "../api.js";
import AgentCity from "../components/AgentCity.jsx";
import { LimitedInput } from "../components/fields.jsx";
import { StageStepper } from "../components/pipeline/StageStepper.jsx";
import { agentStages, executionDurationMs, formatDuration, isFlagged, stepsByHandler } from "../components/pipeline/stages.js";
import { Button, InkPanel, Panel, StatusBadge, formatDateTime } from "../components/ui.jsx";
import { MaskedText } from "../motion/Motion.jsx";

const LAST_STAGE = agentStages.length - 1;

function Meta({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-ink-text/70">{label}</dt>
      <dd className={`mt-0.5 text-[13px] text-ink-text ${mono ? "tabular font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

export default function PipelineView({ activeExecution, recentExecution, onExecutionChange, isProcessing = false, onNavigate }) {
  const execution = activeExecution || recentExecution;
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [simulationStep, setSimulationStep] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [briefId, setBriefId] = useState(execution?.briefId != null ? String(execution.briefId) : "");

  const executionSteps = execution?.steps || [];
  const isLive = loading || isProcessing || execution?.status === "RUNNING";
  const illustrative = loading || isProcessing || (execution?.status === "RUNNING" && executionSteps.length === 0);

  useEffect(() => {
    if (!illustrative) return undefined;
    const timer = window.setInterval(() => setSimulationStep((current) => Math.min(current + 1, LAST_STAGE)), 1600);
    return () => window.clearInterval(timer);
  }, [illustrative]);

  const mergedStages = useMemo(() => {
    const byHandler = stepsByHandler(executionSteps);
    return agentStages.map((stage) => ({ ...stage, result: byHandler.get(stage.handler.toLowerCase()) || null }));
  }, [executionSteps]);

  useEffect(() => {
    if (execution?.briefId != null) setBriefId(String(execution.briefId));
  }, [execution?.briefId]);

  const loadTimeline = useCallback(
    async (event) => {
      event.preventDefault();
      const id = briefId.trim();
      if (!id) return;
      setLoading(true);
      setLoadError("");
      setSimulationStep(0);
      setExpanded(null);
      try {
        const executions = await get(`/api/executions?briefId=${encodeURIComponent(id)}`);
        const latest = Array.isArray(executions) ? executions[0] : null;
        if (!latest) throw new Error("Este brief todavía no tiene ejecuciones del agente.");
        const detail = await get(`/api/executions/${latest.id}`);
        onExecutionChange?.(detail);
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [briefId, onExecutionChange],
  );

  const totalMs = executionDurationMs(execution);
  const reviewCount = mergedStages.filter((stage) => isFlagged(stage.result)).length;
  const showStepper = executionSteps.length > 0 || isLive;

  return (
    <div>
      <InkPanel className="p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <MaskedText as="h1" text="El agente, paso a paso" className="display block text-[clamp(2.25rem,4vw,3.5rem)] text-ink-fg" />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={execution?.status || (isLive ? "RUNNING" : "PENDING")} />
              <span className="font-mono text-[15px] text-ink-text/80">
                {execution?.briefId != null ? `Brief #${execution.briefId}` : "Sin brief"}
              </span>
            </div>
            <p className="mt-2 max-w-[68ch] text-sm text-ink-text/70">
              Siete etapas encadenadas. Cada etapa deja su evidencia en el registro.
            </p>
            {execution?.errorMessage && (
              <p role="alert" className="mt-2 max-w-[68ch] text-sm text-accent">
                {execution.errorMessage}
              </p>
            )}
          </div>
          <dl className="flex flex-wrap items-end gap-x-8 gap-y-3 text-right">
            <Meta label="Inicio" value={formatDateTime(execution?.startedAt)} />
            <Meta
              label="Fin"
              value={
                execution?.finishedAt
                  ? formatDateTime(execution.finishedAt)
                  : execution
                  ? isLive
                    ? "En curso"
                    : "Sin fecha"
                  : "Sin fecha"
              }
            />
            <Meta
              label="Duración total"
              value={
                <span className="display text-[clamp(2rem,4vw,3rem)] text-ink-fg tabular font-mono">
                  {formatDuration(totalMs) || (isLive ? "En curso" : "Sin datos")}
                </span>
              }
            />
          </dl>
        </div>
        <form onSubmit={loadTimeline} className="mt-6 flex flex-wrap items-end gap-2">
          <LimitedInput
            label={<span className="text-ink-text">ID del brief</span>}
            limit={12}
            inputMode="numeric"
            placeholder="4"
            value={briefId}
            onChange={(event) => setBriefId(event.target.value.replace(/\D/g, ""))}
            className="w-full sm:w-40"
            fieldClassName="w-full font-mono sm:w-32"
          />
          <Button type="submit" variant="primary" icon={Search} loading={loading}>
            Buscar
          </Button>
        </form>
      </InkPanel>

      {loadError && (
        <Panel role="alert" className="mb-4 border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-sm text-danger">{loadError}</p>
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="p-6 xl:col-span-5">
          <StageStepper
            stages={mergedStages}
            expanded={expanded}
            onToggle={(handler) => setExpanded((current) => (current === handler ? null : handler))}
            live={illustrative}
            simulationStep={simulationStep}
            reduce={reduce}
          />
        </Panel>

        <div className="xl:col-span-7">
          <AgentCity
            briefCount={execution?.briefId != null ? 1 : 0}
            activeAgents={isLive ? 1 : 0}
            reviewCount={reviewCount}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}