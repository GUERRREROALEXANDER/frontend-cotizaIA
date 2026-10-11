import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LayoutDashboard, List } from "lucide-react";
import { get, post } from "../api.js";
import { toast } from "sonner";
import { PageHeader, Panel, formatCurrency } from "../components/ui.jsx";
import { CountUp, StaggerItem } from "../motion/Motion.jsx";
import { ProposalKanban, summarizeProposals } from "../components/proposals/ProposalKanban.jsx";
import { ProposalTable } from "../components/proposals/ProposalTable.jsx";
import { ProposalDetailPanel } from "../components/proposals/ProposalDetailPanel.jsx";
import { duration, ease, reducedFade, viewTransition } from "../motion/presets.js";

const STORAGE_KEY = "cotizaia.proposalsMode";

const MODES = [
  { id: "list", label: "Lista", icon: List },
  { id: "board", label: "Tablero", icon: LayoutDashboard },
];

export default function ProposalsView({ proposals, onRefresh, focusProposalId, onFocusHandled }) {
  const [mode, setMode] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || "board";
    } catch {
      return "board";
    }
  });
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [detailOpen, setDetailOpen] = useState(false);
  const reduce = useReducedMotion();
  const messageMotion = reduce ? reducedFade : viewTransition;

  const persistMode = useCallback((newMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (focusProposalId) {
      setSelectedId(String(focusProposalId));
      setDetailOpen(true);
      onFocusHandled();
    }
  }, [focusProposalId, onFocusHandled]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailOpen(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    get(`/api/proposals/${selectedId}`)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setDetailOpen(true);
  }, []);

  const handleSort = useCallback((field) => {
    setSortConfig((prev) => ({
      key: field,
      direction: prev.key === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleAction = useCallback(async (action) => {
    if (!detail) return;
    setWorking(action);
    setError("");
    try {
      const updated = await post(`/api/proposals/${detail.id}/${action}`);
      setDetail(updated);
      await onRefresh();
      toast.success(
        action === "approve"
          ? "Propuesta aprobada para continuar con el envío."
          : "Propuesta enviada al cliente."
      );
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setWorking("");
    }
  }, [detail, onRefresh]);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedId("");
  }, []);

  const handleDownload = useCallback(async (type, fileName) => {
    if (!detail) return;
    setWorking(`download-${type}`);
    try {
      const { downloadProposalDocument } = await import("../api.js");
      const blob = await downloadProposalDocument(detail.id, type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `propuesta-${detail.id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Documento descargado");
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setWorking("");
    }
  }, [detail]);

  const summary = useMemo(() => summarizeProposals(proposals), [proposals]);
  const stats = [
    { id: "in-play", label: "Total en juego", value: summary.inPlay, format: formatCurrency },
    { id: "review", label: "Por revisar", value: summary.review },
    { id: "sent", label: "Enviadas", value: summary.sent },
    { id: "won", label: "Ganadas", value: summary.won },
  ];

  return (
    <div className="portal-in">
      <PageHeader
        title="Propuestas"
        description="Revisa, aprueba y gestiona el ciclo de vida de tus propuestas comerciales."
        actions={
          <div role="tablist" aria-label="Vista de propuestas" className="inline-flex h-11 items-center rounded-full border border-line bg-surface p-1">
            {MODES.map((option) => {
              const active = mode === option.id;
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setMode(option.id); persistMode(option.id); }}
                  className={`relative inline-flex h-9 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 ${
                    active ? "text-accent-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="proposals-mode-pill"
                      transition={{ duration: duration.state, ease: ease.fluid }}
                      className="absolute inset-0 rounded-full bg-accent"
                      aria-hidden
                    />
                  )}
                  <Icon size={16} className="relative" aria-hidden />
                  <span className="relative">{option.label}</span>
                </button>
              );
            })}
          </div>
        }
      />

      {error && (
        <motion.div
          {...messageMotion}
          className="mb-6 rounded-2xl bg-danger/10 px-5 py-4 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StaggerItem
            key={stat.id}
            index={index}
            className="rounded-full bg-surface px-6 py-4 shadow-card"
          >
            <span className="whitespace-nowrap text-sm text-muted">{stat.label}</span>
            <span className="display whitespace-nowrap text-2xl tabular-nums">
              <CountUp value={stat.value} format={stat.format} />
            </span>
          </StaggerItem>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {/* The board is its own surface (columns); only the table sits in a Panel. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} {...viewTransition}>
            {mode === "board" ? (
              <ProposalKanban
                proposals={proposals}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ) : (
              <Panel className="overflow-x-auto">
                <ProposalTable
                  proposals={proposals}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                />
              </Panel>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {detailOpen && (
            <motion.div
              key="detail-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: duration.panel, ease: ease.fluid }}
            >
              <ProposalDetailPanel
                detail={detail}
                proposals={proposals}
                onAction={handleAction}
                onClose={handleCloseDetail}
                working={working}
                onDownload={handleDownload}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
