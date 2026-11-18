import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock, FileText, Loader2, MessageSquare, Send, ShieldCheck, XCircle } from "lucide-react";
import { Panel, SectionHeading, Button, EmptyState, InkPanel, Badge, statusLabels } from "../../components/ui.jsx";
import { formatCurrency, formatDate } from "../../components/ui.jsx";
import { CountUp } from "../../motion/Motion.jsx";
import { availableActions } from "./proposalActions.js";
import { StatusTimeline } from "./StatusTimeline.jsx";
import { ProposalItemsTable } from "./ProposalItemsTable.jsx";
import { ProposalDocumentsList } from "./ProposalDocumentsList.jsx";
import { duration, ease, staggerDelay } from "../../motion/presets.js";

const pricingLabels = { FIXED: "Precio fijo", HOURLY: "Por horas", PHASED: "Por fases" };
const draftOriginLabels = { AI: "Redactado por IA", TEMPLATE: "Plantilla segura" };

// Which moves are offered comes from the proposal's own state (proposalActions.js);
// this only maps each move to its icon.
const actionIcons = {
  approve: ShieldCheck,
  send: Send,
  accept: CheckCircle2,
  negotiate: MessageSquare,
  reject: XCircle,
  expire: Clock,
};


// On the forest panel the quiet pill needs lime ink instead of the forest
// border the light secondary variant uses.
const inkPillClass =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-ink-fg/40 px-5 text-[15px] font-medium text-ink-fg transition-colors duration-200 hover:bg-ink-fg/10 disabled:cursor-not-allowed disabled:opacity-50";

// On the forest panel the tone-based StatusBadge loses its contrast, so the
// status reads as a lime chip instead.
export function InkStatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const label = statusLabels[normalized] || normalized.replaceAll("_", " ").toLowerCase();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink-fg/30 px-3 py-1.5 text-xs font-semibold text-ink-fg">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-fg" aria-hidden />
      {label}
    </span>
  );
}

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

  // The parent owns the request, the working state and the toast.
  const runAction = (action) => {
    if (detail) onAction(action);
  };

  if (!detail) {
    return (
      <Panel className="p-6">
        <EmptyState
          icon={FileText}
          title="Selecciona una propuesta"
          description="El detalle, los documentos y el historial aparecerán aquí."
        />
      </Panel>
    );
  }

  const createdAt = proposals.find((item) => item.id === detail.id)?.createdAt;
  const createdLabel = createdAt ? `Generada el ${formatDate(createdAt)}` : "Recién generada";
  const transitions = availableActions(detail).map((transition) => ({
    ...transition,
    icon: actionIcons[transition.action],
  }));

  const sections = [
    {
      key: "items",
      title: "Detalle de la propuesta",
      body: (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="tabular text-base font-semibold text-fg">Propuesta #{detail.id}</p>
              <p className="mt-1 text-sm text-muted">{createdLabel}</p>
            </div>
            <p className="text-sm font-semibold text-brand">{pricingLabels[detail.pricingModel] || detail.pricingModel}</p>
          </div>
          <ProposalItemsTable
            items={detail.items}
            extras={detail.extras}
            subtotal={detail.subtotal}
            total={detail.total}
          />
        </>
      ),
    },
    detail.draft
      ? {
          key: "draft",
          title: "Borrador de la propuesta",
          body: (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start gap-3">
                <Badge tone={detail.draft.origin === "AI" ? "accent" : "neutral"}>
                  {draftOriginLabels[detail.draft.origin] || draftOriginLabels.TEMPLATE}
                </Badge>
                {detail.draft.summary && (
                  <p className="min-w-[240px] flex-1 text-sm leading-6 text-muted">{detail.draft.summary}</p>
                )}
              </div>
              {detail.draft.sections?.length > 0 && (
                <div className="space-y-4">
                  {detail.draft.sections.map((draftSection, sectionIndex) => (
                    <div key={`${draftSection.title}-${sectionIndex}`}>
                      {draftSection.title && (
                        <h3 className="text-[15px] font-semibold text-fg">{draftSection.title}</h3>
                      )}
                      {(draftSection.paragraphs || []).map((paragraph, paragraphIndex) => (
                        <p
                          key={`${sectionIndex}-${paragraphIndex}`}
                          className="mt-1.5 text-sm leading-6 text-muted"
                        >
                          {paragraph.text}
                          {paragraph.sources?.length > 0 && (
                            <sup className="ml-1 font-mono text-[10px] text-faint">
                              [{paragraph.sources.join(", ")}]
                            </sup>
                          )}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {detail.draft.sources?.length > 0 && (
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-medium text-faint">Fuentes</p>
                  <ol className="mt-2 space-y-1">
                    {detail.draft.sources.map((source) => (
                      <li key={`${source.number}-${source.documentName}`} className="text-sm text-muted">
                        <span className="tabular mr-2 font-mono text-xs text-faint">{source.number}.</span>
                        {source.documentName}
                        {source.page != null ? ` · p. ${source.page}` : ""}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ),
        }
      : null,
    detail.schedule?.phases?.length
      ? {
          key: "schedule",
          title: "Fases estimadas",
          body: (
            <div className="space-y-3">
              {detail.schedule.phases.map((phase) => (
                <div key={`${phase.name}-${phase.startWeek}`} className="flex justify-between gap-4 text-[15px]">
                  <span className="text-fg">{phase.name}</span>
                  <span className="tabular font-mono text-muted">Semanas {phase.startWeek} a {phase.endWeek}</span>
                </div>
              ))}
            </div>
          ),
        }
      : null,
    {
      key: "documents",
      title: "Documentos",
      body: (
        <ProposalDocumentsList
          documents={detail.documents}
          proposalId={detail.id}
          working={working}
          onDownload={onDownload}
        />
      ),
    },
    detail.statusHistory?.length
      ? {
          key: "history",
          title: "Historial de estados",
          body: <StatusTimeline history={detail.statusHistory} />,
        }
      : null,
    detail.deposit
      ? {
          key: "deposit",
          title: "Información de depósito",
          body: (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted">Monto</p>
                <p className="display tabular mt-2 text-2xl text-fg">{formatCurrency(detail.deposit.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Estado</p>
                <p className="mt-2 text-base font-medium text-fg">{detail.deposit.status}</p>
              </div>
              {detail.deposit.dueDate && (
                <div>
                  <p className="text-sm text-muted">Fecha límite</p>
                  <p className="mt-2 text-base text-fg">{formatDate(detail.deposit.dueDate)}</p>
                </div>
              )}
              {detail.deposit.reference && (
                <div>
                  <p className="text-sm text-muted">Referencia</p>
                  <p className="tabular mt-2 font-mono text-[15px] text-fg">{detail.deposit.reference}</p>
                </div>
              )}
            </div>
          ),
        }
      : null,
  ].filter(Boolean);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={detail.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: duration.panel, ease: ease.fluid }}
        className="space-y-6"
      >
        <InkPanel className="p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-ink-text/70">Propuesta comercial</span>
                <InkStatusBadge status={detail.status} />
              </div>
              <p className="display tabular mt-4 text-[clamp(2.75rem,5vw,3.75rem)] text-ink-fg">
                <CountUp value={detail.total} format={formatCurrency} />
              </p>
              <p className="tabular mt-4 text-sm text-ink-text/70">
                #{detail.id} · Brief #{detail.briefId} · {createdLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {transitions.length === 0 && (
                <span className="text-sm text-ink-text/60">Sin acciones pendientes</span>
              )}
              {transitions.map((transition, index) => {
                const pending = working === transition.action;
                const Icon = transition.icon;
                if (index === 0) {
                  return (
                    <Button
                      key={transition.action}
                      variant="primary"
                      icon={Icon}
                      loading={pending}
                      disabled={!!working}
                      onClick={() => runAction(transition.action)}
                    >
                      {transition.label}
                    </Button>
                  );
                }
                return (
                  <button
                    key={transition.action}
                    type="button"
                    className={inkPillClass}
                    disabled={!!working}
                    aria-busy={pending || undefined}
                    onClick={() => runAction(transition.action)}
                  >
                    {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Icon size={16} aria-hidden />}
                    {transition.label}
                  </button>
                );
              })}
              <button type="button" className={inkPillClass} onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-text/60">
            <ShieldCheck size={14} className="text-ink-fg" aria-hidden />
            Revisión humana habilitada
          </p>
        </InkPanel>

        {sections.map((section, index) => (
          <motion.section
            key={section.key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
          >
            <Panel className="p-6">
              <SectionHeading
                title={section.title}
                action={
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg"
                    aria-expanded={expandedSections[section.key]}
                    aria-label={`${expandedSections[section.key] ? "Contraer" : "Expandir"} ${section.title}`}
                  >
                    <ChevronDown size={16} className={expandedSections[section.key] ? "rotate-180" : ""} aria-hidden />
                  </button>
                }
              />
              <AnimatePresence>
                {expandedSections[section.key] && (
                  <motion.div
                    key={`${section.key}-open`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: duration.state, ease: ease.out }}
                  >
                    {section.body}
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.section>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
