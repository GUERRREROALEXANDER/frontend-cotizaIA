import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Loader2, ShieldCheck, Send } from "lucide-react";
import { Panel, SectionHeading, StatusBadge, Button } from "../../components/ui.jsx";
import { formatCurrency, formatDate, formatRelative } from "../../components/ui.jsx";
import { downloadProposalDocument, post } from "../../api.js";
import { StatusTimeline } from "./StatusTimeline.jsx";
import { ProposalItemsTable } from "./ProposalItemsTable.jsx";
import { ProposalDocumentsList } from "./ProposalDocumentsList.jsx";
import { toast } from "sonner";
import { duration, ease } from "../../motion/presets.js";

export function ProposalDetailPanel({ detail, proposals, onAction, onClose, working, onDownload }) {
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    documents: true,
    history: true,
    deposit: true,
    schedule: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const awaitingReview = proposals.some((item) => item.id === detail?.id);

  const handleAction = async (action) => {
    if (!detail) return;
    try {
      const updated = await post(`/api/proposals/${detail.id}/${action}`);
      onAction(updated);
      toast.success(
        action === "approve"
          ? "Propuesta aprobada para continuar con el envío."
          : "Propuesta enviada al cliente."
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDownload = async (type, fileName) => {
    onDownload?.(type, fileName);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={detail?.id || "empty"}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: duration.panel, ease: ease.fluid }}
        className="flex flex-col h-full"
      >
        {!detail && (
          <div className="flex flex-1 items-center justify-center text-center p-8">
            <FileText size={48} className="text-muted" aria-hidden />
            <p className="mt-4 text-muted">Selecciona una propuesta para ver el detalle</p>
          </div>
        )}

        {detail && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                  <FileText size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">Propuesta comercial</p>
                  <p className="text-xs text-muted">
                    Documento #{detail.id} · Brief asociado #{detail.briefId}
                  </p>
                </div>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <motion.section
                layout
                className="rounded-xl border border-line bg-surface"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.state, ease: ease.out }}
              >
                <SectionHeading
                  title="Detalle de la propuesta"
                  action={
                    <button
                      type="button"
                      onClick={() => toggleSection("items")}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
                      aria-expanded={expandedSections.items}
                    >
                      {expandedSections.items ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                    </button>
                  }
                />
                <AnimatePresence>
                  {expandedSections.items && (
                    <motion.div
                      key="items-open"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: duration.state, ease: ease.out }}
                      className="px-5 pb-5"
                    >
                      <div className="flex items-start justify-between border-b border-line pb-4">
                        <div>
                          <p className="text-sm font-medium text-fg">
                            Propuesta #{detail.id}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            Generada el {formatDate(
                              proposals.find((item) => item.id === detail.id)?.createdAt
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-xs text-muted uppercase">
                          {detail.pricingModel}
                        </span>
                      </div>
                      <ProposalItemsTable
                        items={detail.items}
                        extras={detail.extras}
                        subtotal={detail.subtotal}
                        total={detail.total}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {detail.schedule?.phases?.length > 0 && (
                <motion.section
                  layout
                  className="rounded-xl border border-line bg-surface"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.state, ease: ease.out, delay: 0.04 }}
                >
                  <SectionHeading
                    title="Fases estimadas"
                    action={
                      <button
                        type="button"
                        onClick={() => toggleSection("schedule")}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
                        aria-expanded={expandedSections.schedule}
                      >
                        {expandedSections.schedule ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                      </button>
                    }
                  />
                  <AnimatePresence>
                    {expandedSections.schedule && (
                      <motion.div
                        key="schedule-open"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: duration.state, ease: ease.out }}
                        className="px-5 pb-5 space-y-2"
                      >
                        {detail.schedule.phases.map((phase) => (
                          <div
                            key={`${phase.name}-${phase.startWeek}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-fg">{phase.name}</span>
                            <span className="font-mono text-muted tabular-nums">
                              Sem. {phase.startWeek}–{phase.endWeek}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )}

              <motion.section
                layout
                className="rounded-xl border border-line bg-surface"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.state, ease: ease.out, delay: 0.08 }}
              >
                <SectionHeading
                  title="Documentos"
                  action={
                    <button
                      type="button"
                      onClick={() => toggleSection("documents")}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
                      aria-expanded={expandedSections.documents}
                    >
                      {expandedSections.documents ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                    </button>
                  }
                />
                <AnimatePresence>
                  {expandedSections.documents && (
                    <motion.div
                      key="documents-open"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: duration.state, ease: ease.out }}
                      className="px-5 pb-5"
                    >
                      <ProposalDocumentsList
                        documents={detail.documents}
                        proposalId={detail.id}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {detail.statusHistory?.length > 0 && (
                <motion.section
                  layout
                  className="rounded-xl border border-line bg-surface"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.state, ease: ease.out, delay: 0.12 }}
                >
                  <SectionHeading
                    title="Historial de estados"
                    action={
                      <button
                        type="button"
                        onClick={() => toggleSection("history")}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
                        aria-expanded={expandedSections.history}
                      >
                        {expandedSections.history ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                      </button>
                    }
                  />
                  <AnimatePresence>
                    {expandedSections.history && (
                      <motion.div
                        key="history-open"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: duration.state, ease: ease.out }}
                        className="px-5 pb-5"
                      >
                        <StatusTimeline history={detail.statusHistory} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )}

              {detail.deposit && (
                <motion.section
                  layout
                  className="rounded-xl border border-line bg-surface"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: duration.state, ease: ease.out, delay: 0.16 }}
                >
                  <SectionHeading
                    title="Información de depósito"
                    action={
                      <button
                        type="button"
                        onClick={() => toggleSection("deposit")}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
                        aria-expanded={expandedSections.deposit}
                      >
                        {expandedSections.deposit ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                      </button>
                    }
                  />
                  <AnimatePresence>
                    {expandedSections.deposit && (
                      <motion.div
                        key="deposit-open"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: duration.state, ease: ease.out }}
                        className="px-5 pb-5 space-y-3"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-muted">Monto</p>
                            <p className="font-mono text-lg text-fg tabular-nums">
                              {formatCurrency(detail.deposit.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted">Estado</p>
                            <p className="font-medium text-fg">{detail.deposit.status}</p>
                          </div>
                          {detail.deposit.dueDate && (
                            <div>
                              <p className="text-xs text-muted">Fecha límite</p>
                              <p className="font-medium text-fg">{formatDate(detail.deposit.dueDate)}</p>
                            </div>
                          )}
                          {detail.deposit.reference && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-muted">Referencia</p>
                              <p className="font-mono text-sm text-fg">{detail.deposit.reference}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/50 px-5 py-4 rounded-b-xl">
              <div className="flex items-center gap-2 text-xs text-muted">
                <ShieldCheck size={12} className="text-success" aria-hidden />
                Revisión humana habilitada
              </div>
              <div className="flex gap-2">
                {awaitingReview && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ShieldCheck}
                    loading={working === "approve"}
                    onClick={() => handleAction("approve")}
                    disabled={!!working}
                  >
                    Aprobar
                  </Button>
                )}
                {detail.status === "APPROVED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    loading={working === "send"}
                    onClick={() => handleAction("send")}
                    disabled={!!working}
                  >
                    Enviar al cliente
                  </Button>
                )}
                {!awaitingReview && detail.status !== "APPROVED" && detail.status !== "SENT" && (
                  <span className="self-center text-xs text-muted">Sin acciones pendientes</span>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}