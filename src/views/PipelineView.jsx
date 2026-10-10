import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Activity, ListChecks, Search } from "lucide-react";
import { get } from "../api.js";
import AgentCity from "../components/AgentCity.jsx";
import { LimitedInput } from "../components/fields.jsx";
import { StageStepper } from "../components/pipeline/StageStepper.jsx";
import { agentStages, executionDurationMs, formatDuration, isFlagged, stepsByHandler } from "../components/pipeline/stages.js";
import { Button, EmptyState, Panel, SectionHeading, StatusBadge, formatDateTime } from "../components/ui.jsx";

const LAST_STAGE = agentStages.length - 1;

function Meta({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-faint">{label}</dt>
      <dd className={`mt-0.5 text-[13px] text-fg ${mono ? "tabular font-mono" : ""}`}>{value}</dd>
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
  // Only a fresh run without verified steps gets the illustrative stepper; a
  // real RUNNING execution with steps is driven by API data alone.
  const illustrative = loading || isProcessing || (execution?.status === "RUNNING" && executionSteps.length === 0);

  // Illustrative progress: while the agent runs, the stepper lights up in
  // order. Real API steps always override the simulation.
  useEffect(() => {
    if (!illustrative) return undefined;
    const timer = window.setInterval(() => setSimulationStep((current) => Math.min(current + 1, LAST_STAGE)), 1600);
    return () => window.clearInterval(timer);
  }, [illustrative]);

  const mergedStages = useMemo(() => {
    const byHandler = stepsByHandler(executionSteps);
    return agentStages.map((stage) => ({ ...stage, result: byHandler.get(stage.handler.toLowerCase()) || null }));
  }, [executionSteps]);

  // Keep the search field pointing at the brief whose execution is on screen.
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
      <SectionHeading
        title="El agente, paso a paso."
        description="Observa el recorrido de cada brief y revisa el registro real de la ejecución."
        action={
          <form onSubmit={loadTimeline} className="flex w-full items-end gap-2 sm:w-auto">
            <LimitedInput
              label="ID del brief"
              limit={12}
              inputMode="numeric"
              placeholder="4"
              value={briefId}
              onChange={(event) => setBriefId(event.target.value.replace(/\D/g, ""))}
              className="w-full sm:w-36"
              fieldClassName="w-full font-mono sm:w-28"
            />
            <Button type="submit" variant="primary" icon={Search} loading={loading}>
              Buscar
            </Button>
          </form>
        }
      />

      {loadError && (
        <Panel role="alert" className="mb-4 border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-xs text-danger">{loadError}</p>
        </Panel>
      )}

      <Panel className="mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={execution?.status || (isLive ? "RUNNING" : "PENDING")} />
              <span className="font-mono text-[13px] text-fg">
                {execution?.briefId != null ? `Brief #${execution.briefId}` : "Sin brief"}
              </span>
              {execution?.id != null && <span className="font-mono text-[11px] text-faint">Ejecución #{execution.id}</span>}
            </div>
            <p className="mt-2 max-w-[68ch] text-xs text-muted">
              Siete handlers encadenados. Cada etapa deja evidencia verificable en la API.
            </p>
            {execution?.errorMessage && (
              <p role="alert" className="mt-2 max-w-[68ch] text-xs text-danger">
                {execution.errorMessage}
              </p>
            )}
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
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
            <Meta label="Duración" value={formatDuration(totalMs) || (isLive ? "En curso" : "Sin datos")} mono />
          </dl>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel className="p-5 sm:p-6 xl:col-span-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-fg">Cadena de procesamiento</h2>
              <p className="mt-0.5 text-xs text-muted">Responsabilidad encadenada, evidencia por etapa</p>
            </div>
            <span className="rounded-full border border-accent/25 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
              Agente IA
            </span>
          </div>

          {showStepper ? (
            <StageStepper
              stages={mergedStages}
              expanded={expanded}
              onToggle={(handler) => setExpanded((current) => (current === handler ? null : handler))}
              live={illustrative}
              simulationStep={simulationStep}
              reduce={reduce}
            />
          ) : (
            <EmptyState
              icon={execution ? ListChecks : Activity}
              title={execution ? "Sin pasos registrados" : "Aún no hay ejecuciones"}
              description={
                execution
                  ? "El backend devolvió la ejecución pero todavía sin etapas. Vuelve a consultar en unos segundos."
                  : "Procesa un brief desde Bandeja para que el agente recorra las siete etapas, o busca un ID de brief en el formulario superior."
              }
            />
          )}

          {illustrative && (
            <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-muted">
              <span className="motion-safe:h-1.5 motion-safe:w-1.5 motion-safe:animate-pulse motion-safe:rounded-full bg-accent" aria-hidden="true" />
              Progreso ilustrativo. Los pasos verificados aparecen al responder la API.
            </p>
          )}
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
