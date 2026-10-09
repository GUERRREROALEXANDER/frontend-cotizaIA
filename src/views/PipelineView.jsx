import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowDown, Check, Circle, Clock3, FileSearch2, ListFilter, RotateCw, WandSparkles, X } from "lucide-react";
import { get } from "../api.js";
import { EmptyState, Panel, SectionHeading, StatusBadge, buttonClass } from "../components/ui.jsx";

const agentStages = [
  { handler: "ExtractHandler", label: "Extracción", description: "Lectura del brief", icon: FileSearch2 },
  { handler: "ClassifyHandler", label: "Clasificación", description: "Tipo de proyecto", icon: ListFilter },
  { handler: "EstimateHandler", label: "Estimación", description: "Alcance y esfuerzo", icon: Clock3 },
  { handler: "PriceHandler", label: "Precio", description: "Estrategia comercial", icon: WandSparkles },
  { handler: "ComposeHandler", label: "Composición", description: "Propuesta final", icon: Activity },
];

const simulatedLogs = [
  "Preparando el contexto del brief…",
  "Identificando servicios y alcance inicial…",
  "Calculando una estimación de esfuerzo…",
  "Aplicando la estrategia de precios configurada…",
  "Organizando la propuesta para revisión…",
];

export default function PipelineView({ activeExecution, recentExecution, onExecutionChange, isProcessing = false }) {
  const execution = activeExecution || recentExecution;
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [simulationStep, setSimulationStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const [briefId, setBriefId] = useState(execution?.briefId ? String(execution.briefId) : "");
  const executionSteps = execution?.steps || [];
  const isRunning = loading || isProcessing || execution?.status === "RUNNING";

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setInterval(() => setSimulationStep((current) => Math.min(current + 1, simulatedLogs.length - 1)), 1900);
    return () => window.clearInterval(timer);
  }, [loading, isProcessing]);

  const mergedStages = useMemo(() => {
    const completedByHandler = new Map(executionSteps.map((step) => [step.handler, step]));
    return agentStages.map((stage, index) => ({ ...stage, result: completedByHandler.get(stage.handler), index }));
  }, [executionSteps]);

  async function loadTimeline(event) {
    event.preventDefault();
    if (!briefId.trim()) return;
    setLoading(true);
    setLoadError("");
    setSimulationStep(0);
    try {
      const executions = await get(`/api/executions?briefId=${encodeURIComponent(briefId.trim())}`);
      const latest = executions[0];
      if (!latest) throw new Error("Este brief todavía no tiene ejecuciones del agente.");
      const detail = await get(`/api/executions/${latest.id}`);
      onExecutionChange(detail);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-in">
      <SectionHeading
        eyebrow="Motor autónomo · Cadena de handlers"
        title="El agente, paso a paso."
        description="Observa el recorrido de cada brief y revisa el registro real de ejecución."
        action={
          <form onSubmit={loadTimeline} className="flex w-full gap-2 sm:w-auto">
            <input value={briefId} onChange={(event) => setBriefId(event.target.value)} inputMode="numeric" placeholder="ID del brief" aria-label="ID del brief" className="w-full rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2.5 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60 sm:w-28" />
            <button type="submit" className={buttonClass}><RotateCw size={13} /> Consultar</button>
          </form>
        }
      />

      {loadError && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-300">{loadError}</div>}

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <Panel className="p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Cadena de procesamiento</p>
              <p className="mt-1 text-xs text-slate-500">Responsabilidad encadenada, evidencia por etapa</p>
            </div>
            <span className="rounded-lg border border-indigo-400/15 bg-indigo-400/[.07] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-300">Agente IA</span>
          </div>

          <div className="space-y-0">
            {mergedStages.map(({ handler, label, description, icon: Icon, result, index }) => {
              const state = result?.status?.toUpperCase();
              const pendingVisual = isRunning && index <= simulationStep;
              const complete = ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(state);
              const failed = ["FAILED", "ERROR"].includes(state);
              const current = pendingVisual && !result && index === simulationStep;
              const pathComplete = complete || (isRunning && index < simulationStep);
              const color = failed ? "text-rose-300 border-rose-400/30 bg-rose-400/10" : complete ? "text-emerald-300 border-emerald-400/25 bg-emerald-400/[.07]" : current ? "text-indigo-300 border-indigo-400/35 bg-indigo-400/10" : "text-slate-500 border-slate-800 bg-slate-950/40";
              return (
                <div key={handler} className="relative flex gap-4 pb-5 last:pb-0">
                  {index !== mergedStages.length - 1 && (
                    <span className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-px bg-slate-200">
                      <motion.span
                        className={`absolute inset-x-0 top-0 block h-full origin-top ${complete || (isRunning && index < simulationStep) ? "bg-indigo-400" : "bg-emerald-400"}`}
                        initial={false}
                        animate={{ scaleY: pathComplete ? 1 : 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                  )}
                  <span className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${color}`}>
                    {current && !prefersReducedMotion && (
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl border border-indigo-400/70"
                        initial={{ opacity: 0.65, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.38 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                    {complete ? <Check size={15} /> : failed ? <X size={15} /> : current ? <span className={`h-2 w-2 rounded-full bg-indigo-400 ${prefersReducedMotion ? "" : "animate-pulse"}`} /> : <Icon size={15} />}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div>
                        <p className="text-xs font-medium text-slate-200">{label}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">{handler}</p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{result?.durationMs != null ? `${result.durationMs} ms` : current ? "procesando…" : "—"}</span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-500">{result?.outputSummary || description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {!execution && !loading && <p className="mt-6 rounded-xl border border-slate-800/70 bg-slate-950/35 px-3.5 py-3 text-[10px] leading-5 text-slate-500">Para consultar una ejecución, procesa un brief desde «Briefs» o ingresa el ID de un brief existente.</p>}
        </Panel>

        <Panel className="flex min-h-[400px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-100">Registro de transacción</p>
              <p className="mt-1 text-[10px] text-slate-500">Mensajes y resultados devueltos por la API</p>
            </div>
            {execution && <StatusBadge status={execution.status === "SUCCEEDED" ? "COMPLETED" : execution.status} />}
          </div>
          <div className="scrollbar-subtle flex-1 space-y-3 overflow-y-auto bg-slate-950/30 px-5 py-5 font-mono text-[10px] leading-5 sm:px-6">
            {isRunning && simulatedLogs.slice(0, simulationStep + 1).map((log, index) => (
              <motion.div
                key={log}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className="flex gap-3 text-indigo-700"
              >
                <span className="shrink-0 text-slate-500">{new Date().toLocaleTimeString("es-CO", { hour12: false })}</span>
                <span><span className="mr-2 text-indigo-500">~</span>{log}</span>
                {index === simulationStep && <span className="ml-auto h-1.5 w-1.5 self-center rounded-full bg-indigo-500" />}
              </motion.div>
            ))}
            {executionSteps.map((step) => (
              <div key={step.id || `${step.stepOrder}-${step.handler}`} className="border-l border-slate-700 pl-3 text-slate-300">
                <p className="text-[9px] text-slate-500">PASO {String(step.stepOrder).padStart(2, "0")} · {step.handler} · {step.durationMs ?? "—"} ms</p>
                <p className={`mt-0.5 ${String(step.status).includes("FAIL") ? "text-rose-300" : "text-emerald-200/90"}`}>{step.outputSummary || step.inputSummary || "Etapa registrada por el backend."}</p>
              </div>
            ))}
            {execution?.errorMessage && <p className="rounded-lg border border-rose-400/20 bg-rose-400/[.05] p-3 text-rose-300">{execution.errorMessage}</p>}
            {execution && !executionSteps.length && !loading && <EmptyState icon={Circle} title="No hay pasos disponibles" description="El backend aún no ha almacenado pasos para esta ejecución." />}
            {!execution && !isRunning && <div className="grid flex-1 place-items-center"><EmptyState icon={Activity} title="Esperando un brief" description="Los registros aparecerán aquí cuando el agente procese una solicitud." /></div>}
            {!loading && !execution && <p className="text-slate-600"><span className="mr-2 text-indigo-400">›</span>Consola lista · esperando actividad</p>}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-800/70 px-5 py-3 text-[9px] text-slate-600 sm:px-6">
            <span className="h-1 w-1 rounded-full bg-indigo-400" />
            {loading ? "Vista de progreso ilustrativa; los pasos verificados aparecen al responder la API." : `Brief ${execution?.briefId ?? "—"} · Ejecución ${execution?.id ?? "—"}`}
            {loading && <ArrowDown size={12} className="ml-auto animate-bounce text-indigo-400" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
