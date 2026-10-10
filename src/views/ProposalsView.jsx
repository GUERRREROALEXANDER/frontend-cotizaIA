import { useEffect, useRef, useState, useCallback } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, LayoutDashboard, List } from "lucide-react";
import { get, post } from "../api.js";
import { toast } from "sonner";
import { Panel, SectionHeading, formatRelative } from "../components/ui.jsx";
import { ProposalKanban } from "../components/proposals/ProposalKanban.jsx";
import { ProposalTable } from "../components/proposals/ProposalTable.jsx";
import { ProposalDetailPanel } from "../components/proposals/ProposalDetailPanel.jsx";
import { duration, ease, viewTransition } from "../motion/presets.js";

const STORAGE_KEY = "cotizaia.proposalsMode";

export default function ProposalsView({ proposals, queue, onRefresh, focusProposalId, onFocusHandled }) {
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
  const detailRef = useRef(null);

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

  const queueCount = queue.length;

  return (
    <div className="portal-in">
      <SectionHeading
        title="Propuestas"
        description="Revisa, aprueba y gestiona el ciclo de vida de tus propuestas comerciales."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-mono text-muted">
              {queueCount} en cola
            </span>
            <div className="relative inline-flex h-9 w-[160px] items-center rounded-lg border border-line bg-surface">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "list"}
                onClick={() => { setMode("list"); persistMode("list"); }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === "list" ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                <List size={14} aria-hidden /> Lista
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "board"}
                onClick={() => { setMode("board"); persistMode("board"); }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === "board" ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                <LayoutDashboard size={14} aria-hidden /> Tablero
              </button>
              <motion.div
                layoutId="mode-indicator"
                className="absolute left-0.5 top-0.5 h-[calc(100%-4px)] w-1/2 origin-center rounded-md bg-accent transition-transform duration-200 ease-fluid"
                initial={false}
                animate={{ x: mode === "board" ? "100%" : 0 }}
              />
            </div>
          </div>
        }
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
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
              <Panel>
                <ProposalDetailPanel
                  ref={detailRef}
                  detail={detail}
                  proposals={proposals}
                  onAction={handleAction}
                  onClose={handleCloseDetail}
                  working={working}
                  onDownload={handleDownload}
                />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}