import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Toaster } from "sonner";
import { get, getSession, logout } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import NotificationsDrawer from "./components/NotificationsDrawer.jsx";
import Sidebar from "./components/shell/Sidebar.jsx";
import Topbar from "./components/shell/Topbar.jsx";
import { Button, Panel } from "./components/ui.jsx";
import { useHashView } from "./hooks/useHashView.js";
import { useLocalFlag } from "./hooks/useLocalFlag.js";
import { useNotifications } from "./hooks/useNotifications.js";
import { reducedFade, viewTransition } from "./motion/presets.js";
import { viewById, views } from "./navigation.js";
import { useTheme } from "./theme/theme.js";
import CatalogView from "./views/CatalogView.jsx";
import ClientsView from "./views/ClientsView.jsx";
import DashboardView from "./views/DashboardView.jsx";
import InboxView from "./views/InboxView.jsx";
import PipelineView from "./views/PipelineView.jsx";
import PricingView from "./views/PricingView.jsx";
import ProposalsView from "./views/ProposalsView.jsx";
import RatesView from "./views/RatesView.jsx";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeView, setActiveView] = useHashView();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalFlag("cotizaia.sidebarCollapsed", false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [focusProposalId, setFocusProposalId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [queue, setQueue] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricingModel, setPricingModel] = useState("FIXED");
  const [briefs, setBriefs] = useState([]);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [activeExecution, setActiveExecution] = useState(null);
  const [recentExecution, setRecentExecution] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetSession = useCallback(() => {
    setAuthenticated(false);
    setUser(null);
    setAnalytics(null);
    setProposals([]);
    setQueue([]);
    setClients([]);
    setBriefs([]);
    setSelectedBrief(null);
    setActiveExecution(null);
    setRecentExecution(null);
    setPricingModel("FIXED");
    setWorkspaceError("");
    setLoadingWorkspace(false);
    setRefreshing(false);
  }, []);

  const loadWorkspace = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    setWorkspaceError("");
    try {
      const [
        identity,
        nextAnalytics,
        nextProposals,
        nextQueue,
        nextClients,
        pricing,
        nextBriefs,
        nextExecutions,
      ] = await Promise.all([
        get("/api/auth/me"),
        get("/api/analytics"),
        get("/api/proposals"),
        get("/api/proposals/queue"),
        get("/api/clients"),
        get("/api/agency/pricing-model"),
        get("/api/briefs?limit=35").catch(() => []),
        get("/api/executions?limit=1").catch(() => []),
      ]);
      setUser(identity);
      setAnalytics(nextAnalytics);
      setProposals(nextProposals);
      setQueue(nextQueue);
      setClients(nextClients);
      setPricingModel(pricing.pricingModel);
      setBriefs(Array.isArray(nextBriefs) ? nextBriefs : []);
      const latestExecution = Array.isArray(nextExecutions) ? nextExecutions[0] || null : nextExecutions || null;
      setRecentExecution(latestExecution);
    } catch (error) {
      if (error.status === 401) {
        resetSession();
      } else {
        setWorkspaceError(error.message);
      }
    } finally {
      setLoadingWorkspace(false);
      setRefreshing(false);
    }
  }, [resetSession]);

  // The session lives in HttpOnly cookies: ask the backend who we are.
  useEffect(() => {
    let active = true;
    getSession()
      .then((identity) => {
        if (!active || !identity) return;
        setUser(identity);
        setLoadingWorkspace(true);
        setAuthenticated(true);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated) void loadWorkspace();
  }, [authenticated, loadWorkspace]);

  // A refused refresh means the cookies are gone: back to the auth screen.
  useEffect(() => {
    const handleExpired = () => resetSession();
    window.addEventListener("cotizaia:session-expired", handleExpired);
    return () => window.removeEventListener("cotizaia:session-expired", handleExpired);
  }, [resetSession]);

  // 1-8 jump between views; Ctrl/Cmd+K opens the command palette.
  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || document.activeElement?.isContentEditable) return;
      const target = views.find((view) => view.shortcut === event.key);
      if (target) setActiveView(target.id);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [setActiveView]);

  const handleAuthenticated = useCallback(() => {
    setLoadingWorkspace(true);
    setAuthenticated(true);
  }, []);

  const handleBriefCreated = useCallback((brief) => {
    if (!brief?.id) return;
    setBriefs((current) => [brief, ...current.filter((item) => item.id !== brief.id)].slice(0, 35));
  }, []);

  const handleClientCreated = useCallback((client) => {
    setClients((current) => [client, ...current.filter((item) => item.id !== client.id)]);
  }, []);

  const handleExecution = useCallback((execution) => {
    if (!execution) return;
    setActiveExecution(execution);
    setRecentExecution(execution);
  }, []);

  const handleQuotation = useCallback(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const openProposal = useCallback((proposalId) => {
    setFocusProposalId(proposalId);
    setActiveView("proposals");
  }, [setActiveView]);

  const openBrief = useCallback((brief) => {
    setSelectedBrief(brief);
    setActiveView("inbox");
  }, [setActiveView]);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // The cookies may already be gone; still return to the auth screen.
    }
    resetSession();
  }, [resetSession]);

  const notifications = useNotifications({ enabled: authenticated && !loadingWorkspace });

  const toaster = <Toaster theme={theme} position="bottom-right" closeButton toastOptions={{ className: "font-sans" }} />;

  const loadingScreen = (
    <main className="grid min-h-dvh place-items-center bg-bg text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-fg">
          <Sparkles className="animate-pulse" size={20} aria-hidden />
        </span>
        <p className="mt-4 text-xs text-muted">Preparando tu centro de operaciones…</p>
      </div>
    </main>
  );

  if (checkingSession || (authenticated && loadingWorkspace)) {
    return <>{loadingScreen}{toaster}</>;
  }

  if (!authenticated) return <>{<AuthScreen onAuthenticated={handleAuthenticated} theme={theme} onToggleTheme={toggleTheme} />}{toaster}</>;

  const currentView = viewById[activeView] || viewById.dashboard;
  const transition = reduceMotion ? reducedFade : viewTransition;

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        counts={{ proposals: queue.length }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={currentView.label}
          group={currentView.group}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={notifications.unreadCount}
          onRefresh={() => void loadWorkspace(true)}
          refreshing={refreshing}
          onSignOut={signOut}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-20 pt-8 sm:px-8 sm:pt-10">
          {workspaceError && (
            <Panel className="mb-5 flex flex-wrap items-center justify-between gap-3 border-danger/30 bg-danger/5 px-4 py-3">
              <p role="alert" className="text-xs text-danger">No se pudo cargar toda la información: {workspaceError}</p>
              <Button size="sm" variant="ghost" onClick={() => void loadWorkspace(true)}>Intentar de nuevo</Button>
            </Panel>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeView} {...transition}>
              {activeView === "dashboard" && <DashboardView analytics={analytics} proposals={proposals} clients={clients} queue={queue} briefs={briefs} activeExecution={activeExecution} recentExecution={recentExecution} onNavigate={setActiveView} onOpenProposal={openProposal} onOpenBrief={openBrief} />}
              {activeView === "pipeline" && <PipelineView activeExecution={activeExecution} recentExecution={recentExecution} onExecutionChange={handleExecution} isProcessing={isProcessing} />}
              {activeView === "inbox" && <InboxView clients={clients} briefs={briefs} selectedBrief={selectedBrief} onBriefCreated={handleBriefCreated} onBriefSelected={setSelectedBrief} onQuotation={handleQuotation} onExecution={handleExecution} isProcessing={isProcessing} onProcessing={setIsProcessing} onClientCreated={handleClientCreated} onNavigate={setActiveView} />}
              {activeView === "pricing" && <PricingView pricingModel={pricingModel} proposals={proposals} onPricingModel={setPricingModel} onRefresh={() => loadWorkspace()} />}
              {activeView === "proposals" && <ProposalsView proposals={proposals} queue={queue} onRefresh={() => loadWorkspace()} focusProposalId={focusProposalId} onFocusHandled={() => setFocusProposalId(null)} />}
              {activeView === "clients" && <ClientsView clients={clients} onClientsChange={setClients} onRefresh={() => loadWorkspace()} />}
              {activeView === "catalog" && <CatalogView />}
              {activeView === "rates" && <RatesView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={setActiveView}
        clients={clients}
        briefs={briefs}
        proposals={proposals}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenBrief={openBrief}
        onOpenProposal={openProposal}
        onSignOut={signOut}
      />
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications.notifications}
        lastSeenId={notifications.lastSeenId}
        onMarkAllRead={notifications.markAllRead}
        onOpenProposal={(id) => { setNotificationsOpen(false); openProposal(id); }}
      />
      {toaster}
    </div>
  );
}
