import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Circle,
  FilePlus2,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  Send,
  UserRound,
} from "lucide-react";
import { downloadBriefAttachment, get, post, upload } from "../api.js";
import {
  Badge,
  Button,
  EmptyState,
  InkPanel,
  PageHeader,
  Panel,
  StatusBadge,
  formatCurrency,
  formatDate,
  formatRelative,
} from "../components/ui.jsx";
import { ComboSelect, LimitedInput, LimitedTextarea } from "../components/fields.jsx";
import { LIMITS } from "../limits.js";
import { duration, ease } from "../motion/presets.js";
import { StaggerItem } from "../motion/Motion.jsx";
import AnimatedLink from "../components/motion/AnimatedLink.jsx";
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
  const reduce = useReducedMotion();
  const lift = reduce ? undefined : { y: -2 };

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
  const clientOptions = (clients || []).map((client) => ({
    value: String(client.id),
    label: client.name,
    description: client.company || client.email || "",
  }));
  const isPdfDetail = detail?.source === "PDF";
  const showSuccess = pipelineReady && !busy && !isProcessing && detail?.proposalId;

  return (
    <div>
      <PageHeader
        title="Bandeja"
        description="Pega lo que te mandó el cliente o sube su PDF. El agente hace el resto."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between gap-4 p-6 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-fg">Bandeja de entrada</h2>
              <p className="mt-1 text-sm text-muted">Solicitudes guardadas recientemente</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
              <FilePlus2 size={20} aria-hidden />
            </span>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto p-4">
            {sortedBriefs.map((brief, index) => {
              const selected = String(detail?.id) === String(brief.id);
              const channel = channels.find((item) => item.id === brief.source);
              const Icon = brief.source === "PDF" ? FileText : channel?.icon || FilePlus2;
              return (
                <StaggerItem key={brief.id} index={index} whileHover={lift}>
                  <button
                    type="button"
                    onClick={() => selectBrief(brief)}
                    aria-current={selected || undefined}
                    className={`w-full rounded-xl p-4 text-left transition-colors duration-200 ${
                      selected ? "bg-accent-soft" : "hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
                        <Icon size={19} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-base font-bold text-fg">Brief {brief.id}</span>
                          <span className="shrink-0 text-xs text-faint">
                            {formatRelative(brief.receivedAt)}
                          </span>
                        </span>
                        <span className="mt-1.5 line-clamp-2 overflow-hidden break-words text-sm leading-6 text-muted">
                          {brief.rawText || brief.source || "Solicitud recibida"}
                        </span>
                        <span className="mt-2 block">
                          {brief.source === "PDF" ? (
                            <Badge tone="accent">
                              <FileText size={12} aria-hidden /> PDF
                            </Badge>
                          ) : (
                            <Badge>{channel?.label || brief.source}</Badge>
                          )}
                        </span>
                      </span>
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
            {!sortedBriefs.length && (
              <EmptyState
                icon={Mail}
                title="Tu bandeja está vacía"
                description="Cuando proceses tu primer brief, aparecerá en esta lista."
              />
            )}
          </div>
          <p className="px-6 py-4 text-xs leading-5 text-faint">
            El historial de este espacio se guarda en este navegador.
          </p>
        </Panel>

        <div className="space-y-6 xl:col-span-7">
          <Panel className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold tracking-tight text-fg">Nuevo brief</h2>
              <p className="mt-1 text-sm text-muted">Elige cómo llega la solicitud del cliente</p>
            </div>

            <div
              role="tablist"
              aria-label="Modo de entrada del brief"
              className="mb-6 grid h-12 grid-cols-2 gap-1 rounded-full bg-surface-2 p-1"
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
                    className={`relative h-10 rounded-full px-3 text-sm font-semibold transition-colors duration-200 ${
                      active ? "text-accent-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="inbox-mode-pill"
                        transition={{ duration: duration.state, ease: ease.fluid }}
                        className="absolute inset-0 rounded-full bg-accent"
                        aria-hidden
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {mode === "typed" ? (
                <motion.div
                  key="typed"
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                  transition={{ duration: duration.state, ease: ease.out }}
                >
                  <form onSubmit={submitBrief} className="space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="brief-client" className="block text-sm font-semibold text-fg">
                          Cliente asociado
                        </label>
                        <AnimatedLink onClick={() => setClientFormOpen((open) => !open)} className="text-sm">
                          Crear cliente
                        </AnimatedLink>
                      </div>
                      <ComboSelect
                        id="brief-client"
                        aria-label="Cliente asociado"
                        value={clientId}
                        onChange={setClientId}
                        options={clientOptions}
                        placeholder="Selecciona un cliente"
                        emptyText="Sin clientes registrados"
                        emptyAction={{ label: "Crear cliente", onClick: () => setClientFormOpen(true) }}
                        required
                      />
                      {!clients.length && (
                        <p className="mt-2 text-sm text-warning">
                          Registra un cliente antes de enviar un brief.
                        </p>
                      )}
                    </div>

                    {clientFormOpen && (
                      <div className="rounded-xl bg-surface-2 p-5">
                        <p className="mb-4 text-sm font-semibold text-fg">Nuevo cliente</p>
                        <div className="space-y-4">
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
                            <p role="alert" className="text-sm text-danger">
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
                          className={`flex items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
                            source === id
                              ? "border-transparent bg-accent text-accent-fg"
                              : "border-line-strong text-muted hover:border-brand hover:text-fg"
                          }`}
                        >
                          <Icon size={16} aria-hidden />
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
                      rows={8}
                      required
                      value={briefText}
                      onChange={(event) => setBriefText(event.target.value)}
                    />
                    {error && (
                      <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm leading-6 text-danger">
                        {error}
                      </p>
                    )}
                    {message && (
                      <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm leading-6 text-success">
                        {message}
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      icon={Send}
                      loading={busy}
                      disabled={busy || !clients.length}
                      className="w-full"
                    >
                      {busy ? "El agente está procesando" : "Procesar brief"}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                  transition={{ duration: duration.state, ease: ease.out }}
                >
                  <form onSubmit={submitPdf} className="space-y-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="pdf-client" className="block text-sm font-semibold text-fg">
                          Cliente asociado
                        </label>
                        <AnimatedLink onClick={() => setClientFormOpen((open) => !open)} className="text-sm">
                          Crear cliente
                        </AnimatedLink>
                      </div>
                      <ComboSelect
                        id="pdf-client"
                        aria-label="Cliente asociado"
                        value={clientId}
                        onChange={setClientId}
                        options={clientOptions}
                        placeholder="Selecciona un cliente"
                        emptyText="Sin clientes registrados"
                        emptyAction={{ label: "Crear cliente", onClick: () => setClientFormOpen(true) }}
                        required
                      />
                    </div>

                    {clientFormOpen && (
                      <div className="rounded-xl bg-surface-2 p-5">
                        <p className="mb-4 text-sm font-semibold text-fg">Nuevo cliente</p>
                        <div className="space-y-4">
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
                            <p role="alert" className="text-sm text-danger">
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
                        className="h-2.5 overflow-hidden rounded-full bg-surface-2"
                      >
                        <div
                          className="h-full w-full origin-left rounded-full bg-accent"
                          style={{ transform: `scaleX(${uploadProgress})` }}
                        />
                      </div>
                    )}

                    {pdfResult && (
                      <div role="status" className="rounded-xl bg-surface-2 px-4 py-3 text-sm leading-6 text-muted">
                        <p className="font-semibold text-fg">
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
                      <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm leading-6 text-danger">
                        {error}
                      </p>
                    )}
                    {message && (
                      <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm leading-6 text-success">
                        {message}
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      icon={Send}
                      loading={busy}
                      disabled={busy || !clients.length || !pdfFile}
                      className="w-full"
                    >
                      {busy ? "Subiendo y procesando" : "Procesar brief"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          {showSuccess && (
            <InkPanel className="p-6 sm:p-8">
              <p role="status" className="display text-4xl leading-none text-ink-fg">
                Propuesta #{detail.proposalId} lista
              </p>
              <p className="mt-3 text-base text-ink-text/80">
                El agente armó la cotización. Revísala con el cliente.
              </p>
              {proposalDetail?.total != null && (
                <p className="display mt-4 text-5xl leading-none text-ink-fg">
                  {formatCurrency(proposalDetail.total)}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button variant="primary" icon={ArrowRight} onClick={() => onNavigate?.("pipeline")}>
                  Ver al agente trabajando
                </Button>
                <AnimatedLink onClick={() => onNavigate?.("proposals")} className="text-ink-fg! text-base">
                  Abrir propuestas
                </AnimatedLink>
              </div>
            </InkPanel>
          )}

          {isProcessing && (
            <Panel className="overflow-hidden">
              <div className="flex items-center gap-4 border-b border-line px-6 py-5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-brand">
                  <Circle size={14} fill="currentColor" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-fg">Análisis en curso</h2>
                  <p className="mt-0.5 text-sm text-muted">Progreso en vivo del análisis</p>
                </div>
              </div>
              <div role="status" className="space-y-4 px-6 py-5">
                {intakeStages.slice(0, stage + 1).map((label, index) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className={index < stage ? "text-success" : "text-brand"}>
                      {index < stage ? (
                        <Check size={15} aria-hidden />
                      ) : (
                        <span className="block h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
                      )}
                    </span>
                    <span className={index === stage ? "font-semibold text-fg" : "text-muted"}>{label}</span>
                    {index === stage && <ArrowRight className="ml-auto text-brand" size={15} aria-hidden />}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {detail && !isProcessing && (
            <Panel className="overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-fg">Detalle del brief {detail.id}</h2>
                  <p className="mt-1 text-sm text-muted">
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
              <div className="space-y-6 p-6">
                {pdfOpenError && (
                  <p role="alert" className="text-sm text-danger">
                    {pdfOpenError}
                  </p>
                )}
                <div>
                  <p className="mb-2 text-sm font-semibold text-fg">Entrada original</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-2 p-4 font-sans text-sm leading-6 text-fg">
                    {detail.rawText || "Texto original no disponible."}
                  </pre>
                </div>
                {!!proposalDetail?.items?.length && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-fg">Requisitos cotizados</p>
                      <span className="font-mono text-xs text-faint">
                        {proposalDetail.items.length} ítems · propuesta {proposalDetail.id}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {proposalDetail.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 rounded-xl bg-surface-2 px-4 py-3"
                        >
                          <div className="flex min-w-0 gap-3">
                            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs text-brand">
                              {item.requirementId}
                            </span>
                            <p className="text-sm leading-6 text-fg">{item.description}</p>
                          </div>
                          <span className="shrink-0 text-right font-mono text-xs leading-5 text-faint">
                            {item.hours} h<br />
                            <span className="text-warning">{formatCurrency(item.lineTotal)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {proposalDetailError && (
                  <p role="alert" className="text-sm text-danger">
                    No fue posible cargar el alcance cotizado: {proposalDetailError}
                  </p>
                )}
                {!!detail.questions?.length && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-fg">
                      Aclaraciones del agente
                    </p>
                    <div className="space-y-3">
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
                  <p role="status" className="flex items-center gap-2 text-sm font-semibold text-success">
                    <Check size={15} aria-hidden /> Propuesta {detail.proposalId} vinculada al brief{" "}
                    <ArrowRight size={14} aria-hidden />
                  </p>
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
    <div className="rounded-xl bg-surface-2 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/12 text-warning" aria-hidden>
          <Circle size={14} fill={question.blocking ? "currentColor" : "none"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-6 text-fg">{question.question}</p>
          {isResolved ? (
            <p role="status" className="mt-2 text-sm text-success">Respuesta: {question.answer}</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onAnswer(answer);
                setAnswer("");
              }}
              className="mt-4 space-y-3"
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
                <Button type="submit" variant="secondary" icon={Send} disabled={disabled} aria-label="Enviar respuesta">
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
