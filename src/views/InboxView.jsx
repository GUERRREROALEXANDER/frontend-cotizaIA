import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  FilePlus2,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  Plus,
  Send,
  UserRound,
} from "lucide-react";
import { downloadBriefAttachment, get, post, upload } from "../api.js";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  formatCurrency,
  formatDate,
} from "../components/ui.jsx";
import { LimitedInput, LimitedTextarea, Select } from "../components/fields.jsx";
import { LIMITS } from "../limits.js";
import { duration, ease } from "../motion/presets.js";
import { StaggerItem } from "../motion/Motion.jsx";
import PdfDropzone from "../components/inbox/PdfDropzone.jsx";

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

const briefLabel = {
  WHATSAPP: "Mensaje del cliente",
  EMAIL: "Contenido del correo",
  WEB_FORM: "Descripción del proyecto",
};

function channelLabel(source) {
  if (source === "PDF") return "PDF";
  return channels.find((item) => item.id === source)?.label || source;
}

function reportError(setInline, message) {
  setInline(message);
  toast.error(message);
}

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
  onNavigate,
}) {
  const [mode, setMode] = useState("typed");
  const [source, setSource] = useState("WHATSAPP");
  const [clientId, setClientId] = useState("");
  const [briefText, setBriefText] = useState("");
  const [subject, setSubject] = useState("");
  const [projectType, setProjectType] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfNote, setPdfNote] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfResult, setPdfResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pipelineReady, setPipelineReady] = useState(false);
  const [detail, setDetail] = useState(selectedBrief || null);
  const [proposalDetail, setProposalDetail] = useState(null);
  const [proposalDetailError, setProposalDetailError] = useState("");
  const [pdfOpenError, setPdfOpenError] = useState("");
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
      .then((result) => {
        if (!cancelled) setProposalDetail(result);
      })
      .catch((requestError) => {
        if (!cancelled) setProposalDetailError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.proposalId]);

  useEffect(() => {
    if (!isProcessing) return undefined;
    const timer = window.setInterval(
      () => setStage((current) => Math.min(current + 1, intakeStages.length - 1)),
      1900,
    );
    return () => window.clearInterval(timer);
  }, [isProcessing]);

  async function selectBrief(brief) {
    setError("");
    onBriefSelected?.(brief);
    try {
      const result = await get(`/api/briefs/${brief.id}`);
      setDetail(result);
      onBriefSelected?.(result);
    } catch (requestError) {
      setDetail(brief);
      reportError(setError, requestError.message);
    }
  }

  async function addClient() {
    setClientError("");
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      const validation = "Completa el nombre y el correo del cliente.";
      setClientError(validation);
      toast.error(validation);
      return;
    }
    try {
      const client = await post("/api/clients", clientForm);
      onClientCreated?.(client);
      setClientId(String(client.id));
      setClientForm({ name: "", email: "", company: "" });
      setClientFormOpen(false);
    } catch (requestError) {
      reportError(setClientError, requestError.message);
    }
  }

  // Single processing pipeline used by both the typed form and the PDF flow.
  async function runProcessing(briefId) {
    const quotation = await post(`/api/briefs/${briefId}/process`);
    onQuotation?.(quotation);
    if (quotation.executionId) {
      const execution = await get(`/api/executions/${quotation.executionId}`);
      onExecution?.(execution);
    }
    const updatedDetail = await get(`/api/briefs/${briefId}`);
    setDetail(updatedDetail);
    onBriefSelected?.(updatedDetail);
    return quotation;
  }

  function buildPayload() {
    const client = clients.find((item) => String(item.id) === String(clientId));
    if (source === "WHATSAPP") return { message: briefText };
    if (source === "EMAIL") {
      return { subject: subject || "Solicitud de cotización", from: client?.email || "", body: briefText };
    }
    return { projectType, description: briefText };
  }

  async function submitBrief(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPipelineReady(false);
    setBusy(true);
    setStage(0);
    onProcessing?.(true);
    try {
      const brief = await post("/api/briefs", {
        source,
        clientId: Number(clientId),
        payload: buildPayload(),
      });
      onBriefCreated?.(brief);
      onBriefSelected?.(brief);
      setDetail(brief);
      setMessage(`Brief ${brief.id} recibido. Iniciando procesamiento autónomo.`);
      const quotation = await runProcessing(brief.id);
      setMessage(
        quotation.halted
          ? `Brief ${brief.id} procesado. El agente requiere aclaraciones antes de cotizar.`
          : `Propuesta ${quotation.proposalId} creada para el brief ${brief.id}.`,
      );
      setPipelineReady(true);
      setBriefText("");
      setSubject("");
      setProjectType("");
    } catch (requestError) {
      reportError(setError, requestError.message);
    } finally {
      setBusy(false);
      onProcessing?.(false);
    }
  }

  function handlePdfReject(rejectMessage) {
    setError(rejectMessage);
    toast.error(rejectMessage);
  }

  async function submitPdf(event) {
    event.preventDefault();
    if (!pdfFile) {
      handlePdfReject("Selecciona un archivo PDF antes de subir.");
      return;
    }
    if (!clientId) {
      handlePdfReject("Selecciona un cliente antes de subir el PDF.");
      return;
    }
    setError("");
    setMessage("");
    setPdfResult(null);
    setPipelineReady(false);
    setBusy(true);
    setStage(0);
    setUploadProgress(0);
    onProcessing?.(true);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("clientId", String(clientId));
      if (pdfNote.trim()) formData.append("note", pdfNote.trim());
      const result = await upload("/api/briefs/upload", formData, {
        onProgress: (ratio) => setUploadProgress(ratio),
      });
      setUploadProgress(1);
      onBriefCreated?.(result.brief);
      onBriefSelected?.(result.brief);
      setDetail(result.brief);
      setPdfResult({
        fileName: result.fileName,
        pages: result.pages,
        truncated: result.truncated,
        unreadablePages: result.unreadablePages || [],
      });
      setMessage(`PDF procesado. Brief ${result.brief.id} creado. Iniciando análisis del agente.`);
      const quotation = await runProcessing(result.brief.id);
      setMessage(
        quotation.halted
          ? `Brief ${result.brief.id} procesado. El agente requiere aclaraciones antes de cotizar.`
          : `Propuesta ${quotation.proposalId} creada para el brief ${result.brief.id}.`,
      );
      setPipelineReady(true);
      setPdfFile(null);
      setPdfNote("");
    } catch (requestError) {
      reportError(setError, requestError.message);
    } finally {
      setBusy(false);
      onProcessing?.(false);
    }
  }

  async function openOriginalPdf() {
    if (!detail?.id) return;
    setPdfOpenError("");
    try {
      const blob = await downloadBriefAttachment(detail.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
    } catch (requestError) {
      reportError(setPdfOpenError, requestError.message);
    }
  }

  async function submitAnswer(questionId, answer) {
    if (!answer.trim()) return;
    setError("");
    setBusy(true);
    onProcessing?.(true);
    try {
      const result = await post(`/api/briefs/${detail.id}/questions/${questionId}/answer`, { answer });
      onQuotation?.(result);
      if (result.executionId) onExecution?.(await get(`/api/executions/${result.executionId}`));
      const updatedDetail = await get(`/api/briefs/${detail.id}`);
      setDetail(updatedDetail);
      onBriefSelected?.(updatedDetail);
      setMessage("Aclaración guardada. El agente volvió a evaluar la propuesta.");
    } catch (requestError) {
      reportError(setError, requestError.message);
    } finally {
      setBusy(false);
      onProcessing?.(false);
    }
  }

  const sortedBriefs = [...(briefs || [])].sort(
    (a, b) => new Date(b.receivedAt) - new Date(a.receivedAt),
  );
  const isPdfDetail = detail?.source === "PDF";

  return (
    <div>
      <PageHeader
        title="Bandeja"
        description="Centraliza las solicitudes de cada canal y envíalas al agente para su análisis."
        actions={
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-muted">
            {briefs?.length || 0} recibidos en este espacio
          </span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-fg">Bandeja de entrada</p>
              <p className="mt-1 text-xs text-faint">Solicitudes guardadas recientemente</p>
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-brand">
              <FilePlus2 size={16} aria-hidden />
            </span>
          </div>
          <div className="max-h-[520px] divide-y divide-line overflow-y-auto">
            {sortedBriefs.map((brief, index) => {
              const selected = String(detail?.id) === String(brief.id);
              const channel = channels.find((item) => item.id === brief.source);
              const Icon = brief.source === "PDF" ? FileText : channel?.icon || FilePlus2;
              return (
                <StaggerItem key={brief.id} index={index}>
                  <button
                    type="button"
                    onClick={() => selectBrief(brief)}
                    aria-current={selected || undefined}
                    className={`w-full px-5 py-4 text-left transition-colors duration-200 ${
                      selected ? "bg-accent-soft" : "hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                          selected
                            ? "border-brand/25 bg-accent-soft text-brand"
                            : "border-line bg-surface-2 text-muted"
                        }`}
                      >
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-medium text-fg">Brief {brief.id}</span>
                          <span className="shrink-0 text-[11px] text-faint">
                            {formatDate(brief.receivedAt)}
                          </span>
                        </span>
                        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-muted">
                          {brief.rawText || brief.source || "Solicitud recibida"}
                        </span>
                        <span className="mt-2">
                          {brief.source === "PDF" ? (
                            <Badge tone="accent">
                              <FileText size={11} aria-hidden /> PDF
                            </Badge>
                          ) : (
                            <Badge>{channel?.label || brief.source}</Badge>
                          )}
                        </span>
                      </span>
                      <ChevronRight size={14} className="mt-2 shrink-0 text-faint" aria-hidden />
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
            {!sortedBriefs.length && (
              <EmptyState
                icon={Mail}
                title="Tu bandeja está vacía"
                description="Los briefs procesados desde este espacio aparecerán aquí. El backend aún no expone un listado histórico de briefs."
              />
            )}
          </div>
          <div className="border-t border-line px-5 py-3 text-[11px] leading-5 text-faint">
            El historial de briefs se mantiene en este navegador. Su consulta directa usa la API del backend.
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-fg">Nuevo brief</p>
                <p className="mt-1 text-xs text-faint">Elige cómo llega la solicitud del cliente</p>
              </div>
              <span className="font-mono text-[11px] uppercase text-faint">Entrada 01</span>
            </div>

            <div
              role="tablist"
              aria-label="Modo de entrada del brief"
              className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1"
            >
              {[
                { id: "typed", label: "Escribir brief" },
                { id: "pdf", label: "Subir PDF" },
              ].map((option) => {
                const active = mode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setMode(option.id);
                      setError("");
                    }}
                    className={`relative rounded-md px-3 py-2 text-xs font-medium transition-colors duration-200 ${
                      active ? "text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="inbox-mode-indicator"
                        transition={{ duration: duration.state, ease: ease.fluid }}
                        className="absolute inset-0 rounded-md border border-brand/25 bg-accent-soft"
                        aria-hidden
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>

            {mode === "typed" ? (
              <form onSubmit={submitBrief} className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Cliente asociado</span>
                    <button
                      type="button"
                      onClick={() => setClientFormOpen((open) => !open)}
                      className="flex items-center gap-1 text-xs text-brand hover:text-fg"
                    >
                      <Plus size={12} aria-hidden /> Crear cliente
                    </button>
                  </div>
                  <Select
                    aria-label="Cliente asociado"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.company ? ` · ${client.company}` : ""}
                      </option>
                    ))}
                  </Select>
                  {!clients.length && (
                    <p className="mt-2 text-xs text-warning">
                      Registra un cliente antes de enviar un brief.
                    </p>
                  )}
                </div>

                {clientFormOpen && (
                  <div className="rounded-xl border border-line bg-surface-2 p-4">
                    <p className="mb-3 text-xs font-medium text-fg">Nuevo cliente</p>
                    <div className="space-y-3">
                      <LimitedInput
                        label="Nombre completo"
                        placeholder="Nombre completo"
                        limit={LIMITS.clientName}
                        value={clientForm.name}
                        onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })}
                      />
                      <LimitedInput
                        label="Correo electrónico"
                        placeholder="Correo electrónico"
                        type="email"
                        limit={LIMITS.email}
                        value={clientForm.email}
                        onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })}
                      />
                      <LimitedInput
                        label="Empresa (opcional)"
                        placeholder="Empresa (opcional)"
                        limit={LIMITS.company}
                        value={clientForm.company}
                        onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })}
                      />
                      {clientError && (
                        <p role="alert" className="text-xs text-danger">
                          {clientError}
                        </p>
                      )}
                      <Button type="button" icon={UserRound} onClick={addClient}>
                        Guardar cliente
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {channels.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSource(id)}
                      aria-pressed={source === id}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-xs transition-colors duration-200 ${
                        source === id
                          ? "border-brand/25 bg-accent-soft text-brand"
                          : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-fg"
                      }`}
                    >
                      <Icon size={13} aria-hidden />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label === "Formulario web" ? "Web" : label}</span>
                    </button>
                  ))}
                </div>

                {source === "EMAIL" && (
                  <LimitedInput
                    label="Asunto del correo"
                    placeholder="Solicitud de propuesta"
                    limit={LIMITS.subject}
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                )}
                {source === "WEB_FORM" && (
                  <LimitedInput
                    label="Tipo de proyecto"
                    placeholder="Ej. Sitio web corporativo"
                    limit={LIMITS.projectType}
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value)}
                  />
                )}
                <LimitedTextarea
                  label={briefLabel[source]}
                  placeholder="Cuéntanos qué necesita el cliente, el contexto, alcance o fechas importantes."
                  limit={LIMITS.briefText}
                  alwaysShowCounter
                  rows={5}
                  required
                  value={briefText}
                  onChange={(event) => setBriefText(event.target.value)}
                />
                {error && (
                  <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-xs leading-5 text-danger">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className="rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-xs leading-5 text-success">
                    {message}
                  </p>
                )}
                {pipelineReady && !busy && !isProcessing && (
                  <Button variant="primary" icon={ArrowRight} onClick={() => onNavigate?.("pipeline")}>
                    Ver al agente trabajando
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  loading={busy}
                  disabled={busy || !clients.length}
                  className="w-full"
                >
                  {busy ? "El agente está procesando" : "Recibir y procesar brief"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitPdf} className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Cliente asociado</span>
                    <button
                      type="button"
                      onClick={() => setClientFormOpen((open) => !open)}
                      className="flex items-center gap-1 text-xs text-brand hover:text-fg"
                    >
                      <Plus size={12} aria-hidden /> Crear cliente
                    </button>
                  </div>
                  <Select
                    aria-label="Cliente asociado"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.company ? ` · ${client.company}` : ""}
                      </option>
                    ))}
                  </Select>
                </div>

                {clientFormOpen && (
                  <div className="rounded-xl border border-line bg-surface-2 p-4">
                    <p className="mb-3 text-xs font-medium text-fg">Nuevo cliente</p>
                    <div className="space-y-3">
                      <LimitedInput
                        label="Nombre completo"
                        placeholder="Nombre completo"
                        limit={LIMITS.clientName}
                        value={clientForm.name}
                        onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })}
                      />
                      <LimitedInput
                        label="Correo electrónico"
                        placeholder="Correo electrónico"
                        type="email"
                        limit={LIMITS.email}
                        value={clientForm.email}
                        onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })}
                      />
                      <LimitedInput
                        label="Empresa (opcional)"
                        placeholder="Empresa (opcional)"
                        limit={LIMITS.company}
                        value={clientForm.company}
                        onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })}
                      />
                      {clientError && (
                        <p role="alert" className="text-xs text-danger">
                          {clientError}
                        </p>
                      )}
                      <Button type="button" icon={UserRound} onClick={addClient}>
                        Guardar cliente
                      </Button>
                    </div>
                  </div>
                )}

                <PdfDropzone
                  file={pdfFile}
                  onFileChange={setPdfFile}
                  onReject={handlePdfReject}
                  disabled={busy}
                />

                <LimitedTextarea
                  label="Nota opcional"
                  placeholder="Contexto adicional sobre este PDF, si hace falta."
                  limit={LIMITS.pdfNote}
                  rows={3}
                  value={pdfNote}
                  onChange={(event) => setPdfNote(event.target.value)}
                />

                {busy && (
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(uploadProgress * 100)}
                    aria-label="Progreso de subida del PDF"
                    className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                  >
                    <div
                      className="h-full w-full origin-left rounded-full bg-accent"
                      style={{ transform: `scaleX(${uploadProgress})` }}
                    />
                  </div>
                )}

                {pdfResult && (
                  <div role="status" className="rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-xs leading-5 text-muted">
                    <p className="font-medium text-fg">
                      {pdfResult.fileName || "PDF"} · {pdfResult.pages ?? 0} páginas
                    </p>
                    {pdfResult.truncated && (
                      <p className="mt-1">Se usaron los primeros 20.000 caracteres del PDF.</p>
                    )}
                    {!!pdfResult.unreadablePages?.length && (
                      <p className="mt-1">
                        Páginas sin texto legible: {pdfResult.unreadablePages.join(", ")}. Pueden estar
                        escaneadas.
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-xs leading-5 text-danger">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className="rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-xs leading-5 text-success">
                    {message}
                  </p>
                )}
                {pipelineReady && !busy && !isProcessing && (
                  <Button variant="primary" icon={ArrowRight} onClick={() => onNavigate?.("pipeline")}>
                    Ver al agente trabajando
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  loading={busy}
                  disabled={busy || !clients.length || !pdfFile}
                  className="w-full"
                >
                  {busy ? "Subiendo y procesando" : "Subir y procesar"}
                </Button>
              </form>
            )}
          </Panel>

          {isProcessing && (
            <Panel className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-brand">
                  <Circle size={12} fill="currentColor" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-medium text-fg">Análisis en curso</p>
                  <p className="mt-1 text-[11px] text-faint">Vista de progreso mientras responde el backend</p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                {intakeStages.slice(0, stage + 1).map((label, index) => (
                  <div key={label} className="flex items-center gap-2.5 text-xs">
                    <span className={index < stage ? "text-success" : "text-brand"}>
                      {index < stage ? (
                        <Check size={13} aria-hidden />
                      ) : (
                        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                      )}
                    </span>
                    <span className={index === stage ? "text-fg" : "text-muted"}>{label}</span>
                    {index === stage && <ArrowRight className="ml-auto text-brand" size={13} aria-hidden />}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {detail && !isProcessing && (
            <Panel className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-fg">Detalle del brief {detail.id}</p>
                  <p className="mt-1 text-xs text-faint">
                    {channelLabel(detail.source)} · {formatDate(detail.receivedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {detail.proposalStatus && <StatusBadge status={detail.proposalStatus} />}
                  {isPdfDetail && (
                    <Button size="sm" icon={FileText} onClick={openOriginalPdf}>
                      Ver PDF original
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-5">
                {pdfOpenError && (
                  <p role="alert" className="text-xs text-danger">
                    {pdfOpenError}
                  </p>
                )}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase text-faint">Entrada original</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-surface-2 p-3.5 font-sans text-xs leading-5 text-fg">
                    {detail.rawText || "Texto original no disponible."}
                  </pre>
                </div>
                {!!proposalDetail?.items?.length && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase text-faint">Requisitos cotizados</p>
                      <span className="font-mono text-[11px] text-faint">
                        {proposalDetail.items.length} ítems · propuesta {proposalDetail.id}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {proposalDetail.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-2 px-3.5 py-3"
                        >
                          <div className="flex min-w-0 gap-2.5">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent-soft font-mono text-[10px] text-brand">
                              {item.requirementId}
                            </span>
                            <p className="text-xs leading-5 text-fg">{item.description}</p>
                          </div>
                          <span className="shrink-0 text-right font-mono text-[11px] leading-4 text-faint">
                            {item.hours} h<br />
                            <span className="text-warning">{formatCurrency(item.lineTotal)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {proposalDetailError && (
                  <p className="text-xs text-danger">
                    No fue posible cargar el alcance cotizado: {proposalDetailError}
                  </p>
                )}
                {!!detail.questions?.length && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase text-faint">
                      Aclaraciones del agente
                    </p>
                    <div className="space-y-2">
                      {detail.questions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          disabled={busy}
                          onAnswer={(answer) => submitAnswer(question.id, answer)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {detail.proposalId && (
                  <p className="flex items-center gap-2 text-xs text-success">
                    <Check size={13} aria-hidden /> Propuesta {detail.proposalId} vinculada al brief{" "}
                    <ArrowRight size={12} aria-hidden />
                  </p>
                )}
                {pipelineReady && (
                  <Button variant="primary" icon={ArrowRight} onClick={() => onNavigate?.("pipeline")}>
                    Ver al agente trabajando
                  </Button>
                )}
                {detail.rawPayload && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-muted transition-colors hover:text-fg">
                      Ver payload original del canal
                    </summary>
                    <pre className="mt-2 max-h-32 overflow-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-[11px] leading-4 text-muted">
                      {typeof detail.rawPayload === "string"
                        ? detail.rawPayload
                        : JSON.stringify(detail.rawPayload, null, 2)}
                    </pre>
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
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-warning" aria-hidden>
          <Circle size={11} fill={question.blocking ? "currentColor" : "none"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-5 text-fg">{question.question}</p>
          {isResolved ? (
            <p className="mt-2 text-xs text-success">Respuesta: {question.answer}</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onAnswer(answer);
                setAnswer("");
              }}
              className="mt-3 space-y-2"
            >
              <LimitedTextarea
                label="Tu respuesta"
                placeholder="Escribe una respuesta."
                limit={LIMITS.answer}
                rows={2}
                required
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" icon={Send} disabled={disabled} aria-label="Enviar respuesta">
                  Responder
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
