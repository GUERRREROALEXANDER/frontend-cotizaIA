import { useEffect, useState } from "react";
import { ArrowDownToLine, Check, FileText, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { downloadProposalDocument, get, post } from "../api.js";
import { EmptyState, formatCurrency, formatDate, Panel, SectionHeading, StatusBadge } from "../components/ui.jsx";

export default function ProposalsView({ proposals, queue, onRefresh }) {
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    get(`/api/proposals/${selectedId}`)
      .then((result) => { if (!cancelled) setDetail(result); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  async function proposalAction(action) {
    if (!detail) return;
    setWorking(action);
    setError("");
    setNotice("");
    try {
      const updated = await post(`/api/proposals/${detail.id}/${action}`);
      setDetail(updated);
      await onRefresh();
      setNotice(action === "approve" ? "Propuesta aprobada para continuar con el envío." : "Propuesta enviada al cliente.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  }

  async function downloadDocument(type, fileName) {
    setWorking(`download-${type}`);
    setError("");
    try {
      const blob = await downloadProposalDocument(detail.id, type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `propuesta-${detail.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  }

  const awaitingReview = queue.some((item) => item.id === detail?.id);

  return (
    <div className="portal-in">
      <SectionHeading
        eyebrow="Aprobación · Revisión humana"
        title="Calidad antes de enviar."
        description="Revisa importes, aprueba y descarga documentos listos para compartir."
        action={<span className="rounded-full border border-amber-400/15 bg-amber-400/[.06] px-3 py-2 text-[10px] text-amber-300">{queue.length} por revisar</span>}
      />

      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-300">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] px-4 py-3 text-xs text-emerald-200">{notice}</div>}

      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-slate-800/70 px-5 py-4">
            <p className="text-sm font-semibold text-slate-100">Cola de propuestas</p>
            <p className="mt-1 text-[10px] text-slate-500">Selecciona una propuesta para revisar.</p>
          </div>
          <div className="scrollbar-subtle max-h-[680px] divide-y divide-slate-800/50 overflow-y-auto">
            {proposals.map((proposal) => {
              const isQueueItem = queue.some((item) => item.id === proposal.id);
              const active = String(selectedId) === String(proposal.id);
              return (
                <button key={proposal.id} type="button" onClick={() => setSelectedId(String(proposal.id))} className={`w-full px-5 py-4 text-left transition ${active ? "bg-indigo-400/[.06]" : "hover:bg-slate-800/30"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200">Propuesta #{proposal.id}</p>
                      <p className="mt-1 text-[10px] text-slate-500">Brief #{proposal.briefId} · {formatDate(proposal.createdAt)}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-amber-300">{formatCurrency(proposal.total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={proposal.status} />
                    {isQueueItem && <span className="text-[9px] uppercase tracking-wider text-amber-300/80">Revisión requerida</span>}
                  </div>
                </button>
              );
            })}
            {!proposals.length && <EmptyState icon={FileText} title="Aún no hay propuestas" description="Cuando el agente procese briefs, las propuestas estarán disponibles en esta lista." />}
          </div>
        </Panel>

        <Panel className="min-h-[500px] overflow-hidden">
          {loading && <div className="grid min-h-[500px] place-items-center"><span className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Cargando propuesta…</span></div>}
          {!loading && !detail && <EmptyState icon={FileText} title="Selecciona una propuesta" description="El documento y su historial de revisión aparecerán en este panel." />}
          {detail && !loading && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/70 px-5 py-5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><FileText size={15} /></span>
                    <p className="text-sm font-semibold text-slate-100">Propuesta comercial</p>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Documento #{detail.id} <span className="mx-1 text-slate-700">·</span> brief asociado #{detail.briefId}</p>
                </div>
                <StatusBadge status={detail.status} />
              </div>
              <div className="max-h-[600px] overflow-y-auto p-5 sm:p-7">
                <div className="mx-auto max-w-xl rounded-[20px] border border-slate-800/70 bg-slate-50 p-5 shadow-sm shadow-slate-900/5 sm:p-8">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-indigo-300">CotizaIA · Propuesta</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">Propuesta #{detail.id}</h3>
                      <p className="mt-1 text-[10px] text-slate-500">Generada el {formatDate(proposals.find((item) => item.id === detail.id)?.createdAt)}</p>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{detail.pricingModel}</span>
                  </div>
                  <div className="py-5">
                    <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Alcance y entregables</p>
                    <div className="space-y-3">
                      {detail.items?.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-800/60 pb-3">
                          <div>
                            <p className="text-xs text-slate-200">{item.description}</p>
                            <p className="mt-1 font-mono text-[9px] text-slate-500">{item.hours} h × {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <p className="shrink-0 font-mono text-xs text-slate-300">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      ))}
                      {!detail.items?.length && <p className="text-xs text-slate-500">La propuesta no tiene ítems detallados.</p>}
                    </div>
                    {detail.extras?.length > 0 && <div className="mt-4 space-y-2">{detail.extras.map((extra) => <div key={extra.id} className="flex justify-between text-[10px] text-slate-400"><span>{extra.type}</span><span className="font-mono">{formatCurrency(extra.amount)}</span></div>)}</div>}
                    <div className="mt-5 space-y-2 border-t border-slate-700 pt-4">
                      <div className="flex justify-between text-[10px] text-slate-500"><span>Subtotal</span><span className="font-mono text-slate-300">{formatCurrency(detail.subtotal)}</span></div>
                      <div className="flex justify-between text-sm font-semibold text-slate-100"><span>Total de la propuesta</span><span className="font-mono text-amber-300">{formatCurrency(detail.total)}</span></div>
                    </div>
                  </div>
                  {detail.schedule?.phases?.length > 0 && (
                    <div className="border-t border-slate-800 pt-4">
                      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Fases estimadas</p>
                      <div className="space-y-2">{detail.schedule.phases.map((phase) => <div key={`${phase.name}-${phase.startWeek}`} className="flex justify-between text-[10px]"><span className="text-slate-300">{phase.name}</span><span className="font-mono text-slate-500">Sem. {phase.startWeek}–{phase.endWeek}</span></div>)}</div>
                    </div>
                  )}
                </div>

                {!!detail.documents?.length && (
                  <div className="mx-auto mt-5 max-w-xl space-y-2">
                    {detail.documents.map((document) => (
                      <button key={document.type} type="button" onClick={() => downloadDocument(document.type, document.fileName)} disabled={working === `download-${document.type}`} className="flex w-full items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/30 px-4 py-3 text-left transition hover:border-slate-700 disabled:opacity-50">
                        <span className="flex items-center gap-2.5"><FileText size={14} className="text-indigo-300" /><span><span className="block text-[10px] font-medium text-slate-200">{document.fileName}</span><span className="mt-1 block text-[9px] text-slate-500">PDF · {Math.max(1, Math.round(document.sizeBytes / 1024))} KB</span></span></span>
                        <ArrowDownToLine size={15} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}

                {detail.statusHistory?.length > 0 && (
                  <div className="mx-auto mt-5 max-w-xl rounded-xl border border-slate-800/60 bg-slate-950/20 p-4">
                    <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Historial de estados</p>
                    <div className="space-y-2">{detail.statusHistory.map((entry, index) => <p key={`${entry.changedAt}-${index}`} className="flex justify-between gap-3 text-[9px] text-slate-500"><span>{entry.from || "CREADA"} <span className="mx-1 text-indigo-400">→</span> <span className="text-slate-300">{entry.to}</span></span><span>{formatDate(entry.changedAt)}</span></p>)}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 bg-slate-950/30 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2 text-[9px] text-slate-500"><ShieldCheck size={13} className="text-emerald-300" /> Revisión humana habilitada</div>
                <div className="flex gap-2">
                  {awaitingReview && (
                    <button type="button" disabled={!!working} onClick={() => proposalAction("approve")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[.08] px-3.5 py-2.5 text-[10px] font-medium text-emerald-200 transition hover:bg-emerald-400/[.14] disabled:opacity-50">
                      {working === "approve" ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Aprobar
                    </button>
                  )}
                  {detail.status === "APPROVED" && (
                    <button type="button" disabled={!!working} onClick={() => proposalAction("send")} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50">
                      {working === "send" ? <LoaderCircle size={13} className="animate-spin" /> : <Send size={13} />} Enviar al cliente
                    </button>
                  )}
                  {!awaitingReview && detail.status !== "APPROVED" && detail.status !== "SENT" && <span className="self-center text-[9px] text-slate-600">Sin acciones pendientes</span>}
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
