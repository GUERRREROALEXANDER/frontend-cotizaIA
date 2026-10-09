import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, Circle, FilePlus2, Mail, MessageCircle, Plus, Send, UserRound, Globe2 } from "lucide-react";
import { get, post } from "../api.js";
import { EmptyState, formatCurrency, formatDate, inputClass, Panel, SectionHeading, StatusBadge, buttonClass } from "../components/ui.jsx";

const channels = [
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { id: "EMAIL", label: "Correo", icon: Mail },
  { id: "WEB_FORM", label: "Formulario web", icon: Globe2 },
];

const intakeStages = [
  "Preparando el contexto de la solicitud",
  "Extrayendo los requisitos del brief",
  "Clasificando alcance y tipo de proyecto",
  "Estimando esfuerzo y estructura de precio",
  "Componiendo la propuesta para revisión",
];

export default function InboxView({
  clients,
  briefs,
  onClientCreated,
  selectedBrief,
  onBriefCreated,
  onBriefSelected,
  onQuotation,
  onExecution,
  isProcessing,
  onProcessing,
}) {
  const [source, setSource] = useState("WHATSAPP");
  const [clientId, setClientId] = useState("");
  const [briefText, setBriefText] = useState("");
  const [subject, setSubject] = useState("");
  const [projectType, setProjectType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState(selectedBrief || null);
  const [proposalDetail, setProposalDetail] = useState(null);
  const [proposalDetailError, setProposalDetailError] = useState("");
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", company: "" });
  const [clientError, setClientError] = useState("");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setDetail(selectedBrief || null);
  }, [selectedBrief]);

  useEffect(() => {
    if (!detail?.proposalId) {
      setProposalDetail(null);
      setProposalDetailError("");
      return undefined;
    }
    let cancelled = false;
    setProposalDetailError("");
    get(`/api/proposals/${detail.proposalId}`)
      .then((result) => { if (!cancelled) setProposalDetail(result); })
      .catch((requestError) => { if (!cancelled) setProposalDetailError(requestError.message); });
    return () => { cancelled = true; };
  }, [detail?.proposalId]);

  useEffect(() => {
    if (!isProcessing) return undefined;
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, intakeStages.length - 1)), 1900);
    return () => window.clearInterval(timer);
  }, [isProcessing]);

  async function selectBrief(brief) {
    setError("");
    onBriefSelected(brief);
    try {
      const result = await get(`/api/briefs/${brief.id}`);
      setDetail(result);
      onBriefSelected(result);
    } catch (requestError) {
      setDetail(brief);
      setError(requestError.message);
    }
  }

  async function addClient() {
    setClientError("");
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      setClientError("Completa el nombre y el correo del cliente.");
      return;
    }
    try {
      const client = await post("/api/clients", clientForm);
      onClientCreated(client);
      setClientId(String(client.id));
      setClientForm({ name: "", email: "", company: "" });
      setClientFormOpen(false);
    } catch (requestError) {
      setClientError(requestError.message);
    }
  }

  async function submitBrief(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    setStage(0);
    onProcessing(true);
    try {
      const client = clients.find((item) => String(item.id) === String(clientId));
      const payload =
        source === "WHATSAPP"
          ? { message: briefText }
          : source === "EMAIL"
            ? { subject: subject || "Solicitud de cotización", from: client?.email || "", body: briefText }
            : { projectType, description: briefText };
      const brief = await post("/api/briefs", { source, clientId: Number(clientId), payload });
      onBriefCreated(brief);
      onBriefSelected(brief);
      setDetail(brief);
      setMessage(`Brief #${brief.id} recibido. Iniciando procesamiento autónomo…`);

      const quotation = await post(`/api/briefs/${brief.id}/process`);
      onQuotation(quotation);
      if (quotation.executionId) {
        const execution = await get(`/api/executions/${quotation.executionId}`);
        onExecution(execution);
      }
      const updatedDetail = await get(`/api/briefs/${brief.id}`);
      setDetail(updatedDetail);
      onBriefSelected(updatedDetail);
      setMessage(
        quotation.halted
          ? `Brief #${brief.id} procesado; el agente requiere aclaraciones antes de cotizar.`
          : `Propuesta #${quotation.proposalId} creada para el brief #${brief.id}.`,
      );
      setBriefText("");
      setSubject("");
      setProjectType("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      onProcessing(false);
    }
  }

  async function submitAnswer(questionId, answer) {
    if (!answer.trim()) return;
    setError("");
    setBusy(true);
    onProcessing(true);
    try {
      const result = await post(`/api/briefs/${detail.id}/questions/${questionId}/answer`, { answer });
      onQuotation(result);
      if (result.executionId) onExecution(await get(`/api/executions/${result.executionId}`));
      const updatedDetail = await get(`/api/briefs/${detail.id}`);
      setDetail(updatedDetail);
      onBriefSelected(updatedDetail);
      setMessage("Aclaración guardada. El agente volvió a evaluar la propuesta.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      onProcessing(false);
    }
  }

  return (
    <div className="portal-in">
      <SectionHeading
        eyebrow="Recepción multicanal · Captura segura"
        title="Cada conversación, un brief."
        description="Centraliza las solicitudes y envíalas al agente para su análisis."
        action={<span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-[10px] text-slate-400">{briefs.length} recibidos en este espacio</span>}
      />

      <div className="grid gap-4 xl:grid-cols-[.88fr_1.12fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Bandeja de entrada</p>
              <p className="mt-1 text-[10px] text-slate-500">Solicitudes guardadas recientemente</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-400/10 text-indigo-300"><FilePlus2 size={16} /></span>
          </div>
          <div className="scrollbar-subtle max-h-[520px] overflow-y-auto divide-y divide-slate-800/50">
            {[...briefs].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).map((brief) => {
              const selected = String(detail?.id) === String(brief.id);
              const channel = channels.find((item) => item.id === brief.source);
              const Icon = channel?.icon || FilePlus2;
              return (
                <button
                  type="button"
                  key={brief.id}
                  onClick={() => selectBrief(brief)}
                  className={`w-full px-5 py-4 text-left transition ${selected ? "bg-indigo-400/[.06]" : "hover:bg-slate-800/30"}`}
                >
                  <div className="flex gap-3">
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${selected ? "border-indigo-400/20 bg-indigo-400/10 text-indigo-300" : "border-slate-800 bg-slate-900 text-slate-500"}`}><Icon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-slate-200">Brief #{brief.id}</span>
                        <span className="shrink-0 text-[9px] text-slate-500">{formatDate(brief.receivedAt)}</span>
                      </span>
                      <span className="mt-1.5 block line-clamp-2 text-[10px] leading-4 text-slate-500">{brief.rawText || brief.source || "Solicitud recibida"}</span>
                      <span className="mt-2 inline-flex rounded-md border border-slate-800 bg-slate-950/40 px-1.5 py-1 text-[8px] uppercase tracking-wider text-slate-500">{channel?.label || brief.source}</span>
                    </span>
                    <ChevronRight size={14} className="mt-2 shrink-0 text-slate-600" />
                  </div>
                </button>
              );
            })}
            {!briefs.length && <EmptyState icon={Mail} title="Tu bandeja está vacía" description="Los briefs procesados desde este espacio aparecerán aquí. El backend aún no expone un listado histórico de briefs." />}
          </div>
          <div className="border-t border-slate-800/70 px-5 py-3 text-[9px] leading-4 text-slate-600">
            El historial de briefs se mantiene en este navegador; su consulta directa usa la API del backend.
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">Nuevo brief</p>
                <p className="mt-1 text-[10px] text-slate-500">Selecciona el canal original del cliente</p>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">Entrada · 01</span>
            </div>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {channels.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setSource(id)} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 text-[10px] transition ${source === id ? "border-indigo-400/30 bg-indigo-400/[.08] text-indigo-200" : "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                  <Icon size={13} /> <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{label === "Formulario web" ? "Web" : label}</span>
                </button>
              ))}
            </div>
            <form onSubmit={submitBrief} className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="clientId" className="text-xs text-slate-400">Cliente asociado</label>
                  <button type="button" onClick={() => setClientFormOpen((open) => !open)} className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200"><Plus size={12} /> Crear cliente</button>
                </div>
                <select id="clientId" value={clientId} onChange={(event) => setClientId(event.target.value)} required className={inputClass}>
                  <option value="">Selecciona un cliente…</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}
                </select>
                {!clients.length && <p className="mt-2 text-[10px] text-amber-300/80">Registra un cliente antes de enviar un brief.</p>}
              </div>

              {clientFormOpen && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="mb-3 text-xs font-medium text-slate-200">Nuevo cliente</p>
                  <div className="space-y-3">
                    <input className={inputClass} placeholder="Nombre completo" value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} />
                    <input className={inputClass} placeholder="Correo electrónico" type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} />
                    <input className={inputClass} placeholder="Empresa (opcional)" value={clientForm.company} onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })} />
                    {clientError && <p role="alert" className="text-[10px] text-rose-300">{clientError}</p>}
                    <button className={buttonClass} type="button" onClick={addClient}><UserRound size={13} /> Guardar cliente</button>
                  </div>
                </div>
              )}

              {source === "EMAIL" && (
                <label className="block text-xs text-slate-400">Asunto del correo
                  <input className={`${inputClass} mt-2`} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Solicitud de propuesta" />
                </label>
              )}
              {source === "WEB_FORM" && (
                <label className="block text-xs text-slate-400">Tipo de proyecto
                  <input className={`${inputClass} mt-2`} value={projectType} onChange={(event) => setProjectType(event.target.value)} placeholder="Ej. Sitio web corporativo" />
                </label>
              )}
              <label htmlFor="briefText" className="block text-xs text-slate-400">
                {source === "EMAIL" ? "Contenido del correo" : source === "WHATSAPP" ? "Mensaje del cliente" : "Descripción del proyecto"}
                <textarea id="briefText" className={`${inputClass} mt-2 min-h-32 resize-y leading-6`} value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder="Cuéntanos qué necesita el cliente, el contexto, alcance o fechas importantes…" required />
              </label>
              {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-3.5 py-3 text-xs leading-5 text-rose-300">{error}</p>}
              {message && <p role="status" className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] px-3.5 py-3 text-xs leading-5 text-emerald-200">{message}</p>}
              <button type="submit" disabled={busy || !clients.length} className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-950/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "El agente está procesando…" : "Recibir y procesar brief"} <Send size={14} />
              </button>
            </form>
          </Panel>

          {isProcessing && (
            <Panel className="overflow-hidden border-indigo-400/20">
              <div className="flex items-center gap-3 border-b border-slate-800/70 px-5 py-4">
                <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-indigo-400/10 text-indigo-300">
                  <span className="absolute inset-0 animate-ping rounded-xl bg-indigo-400/10" />
                  <span className="relative"><Circle size={12} fill="currentColor" /></span>
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-100">Análisis en curso</p>
                  <p className="mt-1 text-[9px] text-slate-500">Vista de progreso mientras responde el backend</p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                {intakeStages.slice(0, stage + 1).map((label, index) => (
                  <div key={label} className="flex items-center gap-2.5 text-[10px]">
                    <span className={index < stage ? "text-emerald-300" : "text-indigo-300"}>{index < stage ? <Check size={13} /> : <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />}</span>
                    <span className={index === stage ? "text-indigo-200" : "text-slate-500"}>{label}…</span>
                    {index === stage && <ArrowRight className="ml-auto text-indigo-400" size={13} />}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {detail && !isProcessing && (
            <Panel className="overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-800/70 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Detalle del brief #{detail.id}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{channels.find((item) => item.id === detail.source)?.label || detail.source} · {formatDate(detail.receivedAt)}</p>
                </div>
                {detail.proposalStatus && <StatusBadge status={detail.proposalStatus} />}
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Entrada original</p>
                  <pre className="scrollbar-subtle max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800/70 bg-slate-950/45 p-3.5 font-sans text-xs leading-5 text-slate-300">{detail.rawText || "Texto original no disponible."}</pre>
                </div>
                {!!proposalDetail?.items?.length && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Requisitos cotizados</p>
                      <span className="font-mono text-[9px] text-slate-600">{proposalDetail.items.length} ítems · propuesta #{proposalDetail.id}</span>
                    </div>
                    <div className="space-y-2">
                      {proposalDetail.items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-800/70 bg-slate-950/30 px-3.5 py-3">
                          <div className="flex min-w-0 gap-2.5">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-indigo-400/10 font-mono text-[8px] text-indigo-300">{item.requirementId}</span>
                            <p className="text-[10px] leading-4 text-slate-300">{item.description}</p>
                          </div>
                          <span className="shrink-0 text-right font-mono text-[9px] leading-4 text-slate-500">{item.hours} h<br /><span className="text-amber-300/80">{formatCurrency(item.lineTotal)}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {proposalDetailError && <p className="text-[10px] text-rose-300">No fue posible cargar el alcance cotizado: {proposalDetailError}</p>}
                {!!detail.questions?.length && (
                  <div>
                    <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Aclaraciones del agente</p>
                    <div className="space-y-2">
                      {detail.questions.map((question) => <QuestionCard key={question.id} question={question} disabled={busy} onAnswer={(answer) => submitAnswer(question.id, answer)} />)}
                    </div>
                  </div>
                )}
                {detail.proposalId && <p className="flex items-center gap-2 text-[10px] text-emerald-300"><Check size={13} /> Propuesta #{detail.proposalId} vinculada al brief <ArrowRight size={12} /></p>}
                {detail.rawPayload && (
                  <details className="group">
                    <summary className="cursor-pointer text-[10px] text-slate-500 transition hover:text-slate-300">Ver payload original del canal</summary>
                    <pre className="scrollbar-subtle mt-2 max-h-32 overflow-auto rounded-xl border border-slate-800/70 bg-slate-950/45 p-3 font-mono text-[9px] leading-4 text-slate-500">{typeof detail.rawPayload === "string" ? detail.rawPayload : JSON.stringify(detail.rawPayload, null, 2)}</pre>
                  </details>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, disabled, onAnswer }) {
  const [answer, setAnswer] = useState("");
  const isResolved = question.status === "RESOLVED";

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-950/35 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-amber-300">{question.blocking ? <Circle size={11} fill="currentColor" /> : <Circle size={11} />}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-5 text-slate-200">{question.question}</p>
          {isResolved ? (
            <p className="mt-2 text-[10px] text-emerald-300">Respuesta: {question.answer}</p>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); onAnswer(answer); setAnswer(""); }} className="mt-3 flex gap-2">
              <input value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={2000} className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/50" placeholder="Escribe una respuesta…" required />
              <button type="submit" disabled={disabled} aria-label="Enviar respuesta" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300 transition hover:bg-indigo-500/25 disabled:opacity-50"><Send size={13} /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
