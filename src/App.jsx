import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bot, LogOut, RotateCw } from "lucide-react";
import { get, tokenStorageKey } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import NavigationDock from "./components/NavigationDock.jsx";
import { buttonClass, Panel } from "./components/ui.jsx";
import DashboardView from "./views/DashboardView.jsx";
import InboxView from "./views/InboxView.jsx";
import PipelineView from "./views/PipelineView.jsx";
import PricingView from "./views/PricingView.jsx";
import ProposalsView from "./views/ProposalsView.jsx";

const briefStorageKey = "cotizaia.briefs";
const executionStorageKey = "cotizaia.recentExecution";

const viewTitles = {
  dashboard: ["Centro de operaciones", "Resumen ejecutivo"],
  pipeline: ["Inteligencia autónoma", "Monitor del agente"],
  inbox: ["Recepción multicanal", "Bandeja de briefs"],
  pricing: ["Configuración comercial", "Estrategia de precios"],
  proposals: ["Control de calidad", "Propuestas y aprobación"],
};

function readStoredBriefs() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(briefStorageKey) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function readStoredExecution() {
  try {
    return JSON.parse(window.localStorage.getItem(executionStorageKey) || "null");
  } catch {
    return null;
  }
}

function getAuthToken() {
  return window.localStorage.getItem(tokenStorageKey);
}

export default function App() {
  const [token, setToken] = useState(getAuthToken);
  const [activeView, setActiveView] = useState("dashboard");
  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [queue, setQueue] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricingModel, setPricingModel] = useState("FIXED");
  const [briefs, setBriefs] = useState(readStoredBriefs);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [activeExecution, setActiveExecution] = useState(null);
  const [recentExecution, setRecentExecution] = useState(readStoredExecution);
  const [user, setUser] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(Boolean(token));
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadWorkspace = useCallback(async (showLoading = false) => {
    if (!getAuthToken()) return;
    if (showLoading) setRefreshing(true);
    setWorkspaceError("");
    try {
      const [identity, nextAnalytics, nextProposals, nextQueue, nextClients, pricing] = await Promise.all([
        get("/api/auth/me"),
        get("/api/analytics"),
        get("/api/proposals"),
        get("/api/proposals/queue"),
        get("/api/clients"),
        get("/api/agency/pricing-model"),
      ]);
      setUser(identity);
      setAnalytics(nextAnalytics);
      setProposals(nextProposals);
      setQueue(nextQueue);
      setClients(nextClients);
      setPricingModel(pricing.pricingModel);
    } catch (error) {
      if (error.status === 401) {
        window.localStorage.removeItem(tokenStorageKey);
        setToken(null);
        setUser(null);
      } else {
        setWorkspaceError(error.message);
      }
    } finally {
      setLoadingWorkspace(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (token) void loadWorkspace();
  }, [token, loadWorkspace]);

  useEffect(() => {
    function handleShortcut(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      const views = ["dashboard", "pipeline", "inbox", "pricing", "proposals"];
      const index = Number(event.key) - 1;
      if (index >= 0 && index < views.length) setActiveView(views[index]);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleBriefCreated = useCallback((brief) => {
    if (!brief?.id) return;
    setBriefs((current) => {
      const updated = [brief, ...current.filter((item) => item.id !== brief.id)].slice(0, 35);
      window.localStorage.setItem(briefStorageKey, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClientCreated = useCallback((client) => {
    setClients((current) => [client, ...current.filter((item) => item.id !== client.id)]);
  }, []);

  const handleExecution = useCallback((execution) => {
    if (!execution) return;
    setActiveExecution(execution);
    setRecentExecution(execution);
    window.localStorage.setItem(executionStorageKey, JSON.stringify(execution));
  }, []);

  const handleQuotation = useCallback(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  function signOut() {
    window.localStorage.removeItem(tokenStorageKey);
    setToken(null);
    setUser(null);
    setAnalytics(null);
    setProposals([]);
    setQueue([]);
    setClients([]);
  }

  if (!token) return <AuthScreen onAuthenticated={setToken} />;

  if (loadingWorkspace) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas text-center">
        <div>
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300"><Bot className="animate-pulse" size={20} /></span>
          <p className="mt-4 text-xs text-slate-400">Preparando tu centro de operaciones…</p>
        </div>
      </main>
    );
  }

  const [workspaceTitle, viewTitle] = viewTitles[activeView];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas">
      <div className="ambient-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="pointer-events-none fixed -left-48 top-0 h-[450px] w-[450px] rounded-full bg-indigo-600/[.055] blur-[145px]" />
      <div className="pointer-events-none fixed -right-48 top-1/3 h-[380px] w-[380px] rounded-full bg-amber-500/[.035] blur-[135px]" />

      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/[.08] text-indigo-300"><Bot size={17} /></div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">{workspaceTitle}</p>
              <p className="truncate text-xs font-semibold text-slate-200">{viewTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void loadWorkspace(true)} disabled={refreshing} title="Actualizar información" aria-label="Actualizar información" className={`${buttonClass} h-9 w-9 p-0`}>
              <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button type="button" onClick={() => setActiveView("proposals")} title={`${queue.length} propuestas por revisar`} aria-label={`${queue.length} propuestas por revisar`} className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-700 bg-white text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-100">
              <Bell size={15} />
              {queue.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-white" />}
            </button>
            <span className="mx-1 hidden h-6 w-px bg-slate-800 sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-medium text-slate-300">Agencia #{user?.agencyId ?? "—"}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-600">{user?.role || "Operador"}</p>
            </div>
            <button type="button" onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 bg-white text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-400/5 hover:text-rose-300">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-[68px] z-20 border-b border-slate-800/70 bg-white/75 py-2 backdrop-blur-xl sm:py-2.5">
        <NavigationDock activeView={activeView} onNavigate={setActiveView} />
      </div>
      <main className="relative mx-auto min-h-[calc(100vh-128px)] max-w-[1480px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-9">

        {workspaceError && (
          <Panel className="mb-5 flex flex-wrap items-center justify-between gap-3 border-rose-400/20 bg-rose-400/[.04] px-4 py-3">
            <p role="alert" className="text-xs text-rose-300">No se pudo cargar toda la información: {workspaceError}</p>
            <button type="button" onClick={() => void loadWorkspace(true)} className="text-xs text-rose-200 underline decoration-rose-300/30 underline-offset-4">Intentar de nuevo</button>
          </Panel>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeView} initial={{ opacity: 0, y: 8, scale: 0.99, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: -5, scale: 0.995, filter: "blur(2px)" }} transition={{ duration: 0.3, ease: [0.2, 0.75, 0.25, 1] }}>
            {activeView === "dashboard" && <DashboardView analytics={analytics} proposals={proposals} clients={clients} queue={queue} briefs={briefs} activeExecution={activeExecution} onNavigate={setActiveView} />}
            {activeView === "pipeline" && <PipelineView activeExecution={activeExecution} recentExecution={recentExecution} onExecutionChange={handleExecution} isProcessing={isProcessing} />}
            {activeView === "inbox" && <InboxView clients={clients} briefs={briefs} selectedBrief={selectedBrief} onBriefCreated={handleBriefCreated} onBriefSelected={setSelectedBrief} onQuotation={handleQuotation} onExecution={handleExecution} isProcessing={isProcessing} onProcessing={setIsProcessing} onClientCreated={handleClientCreated} />}
            {activeView === "pricing" && <PricingView pricingModel={pricingModel} proposals={proposals} onPricingModel={setPricingModel} onRefresh={() => loadWorkspace()} />}
            {activeView === "proposals" && <ProposalsView proposals={proposals} queue={queue} onRefresh={() => loadWorkspace()} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 hidden justify-between px-8 pb-2 text-[8px] uppercase tracking-[.17em] text-slate-700 lg:flex">
        <span>CotizaIA · Centro de operaciones</span>
        <span>Diseñado para decisiones con criterio</span>
      </footer>
    </div>
  );
}
