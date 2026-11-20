import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BellRing, CheckCircle2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { del, get, patch, post } from "../api.js";
import { FormPanel } from "../components/settings/FormPanel.jsx";
import { HoldToConfirm } from "../components/settings/HoldToConfirm.jsx";
import { LimitedInput } from "../components/fields.jsx";
import { Badge, Button, PageHeader, Panel, Skeleton, buttonSizes, buttonVariants, formatDateTime } from "../components/ui.jsx";
import {
  CODE_LENGTH,
  RESEND_SECONDS,
  chatLink,
  cleanCode,
  formatPhone,
  normalizePhone,
  phoneError,
  whatsappErrorMessage,
} from "../whatsapp.js";

const BASE = "/api/auth/me/whatsapp";

// Link a WhatsApp number with a six-digit code; once linked, writing "cotizar" to the CotizaIA
// number builds a quotation from the chat.
export default function WhatsappView() {
  const [contact, setContact] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [changing, setChanging] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const [current, details] = await Promise.all([
        get(BASE).catch((error) => {
          if (error.status === 404) return null;
          throw error;
        }),
        get(`${BASE}/info`).catch(() => null),
      ]);
      setContact(current);
      setInfo(details);
    } catch {
      setLoadError("No pudimos cargar tu WhatsApp. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Disabled while saving: a second click would race the first PATCH and flip the switch back.
  async function toggleNotices() {
    setSaving(true);
    try {
      const updated = await patch(BASE, { enabled: !contact.enabled });
      setContact(updated);
      toast.success(updated.enabled ? "Avisos activados." : "Avisos pausados.");
    } catch {
      toast.error("No se pudieron cambiar los avisos. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await del(BASE);
      setContact(null);
      toast.success("Número desvinculado.");
    } catch {
      toast.error("No se pudo desvincular el número. Intenta de nuevo.");
    }
  }

  function linked(updated) {
    setContact(updated);
    setChanging(false);
    toast.success("¡Número verificado! Ya puedes cotizar desde WhatsApp.");
  }

  const link = chatLink(info?.botNumber);

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Vincula tu número y crea cotizaciones escribiendo al número de CotizaIA."
      />

      {info && !info.serviceConfigured && (
        <Panel className="mb-4 p-4 text-sm text-muted" role="status">
          El servicio de WhatsApp todavía no está conectado. Los códigos se enviarán apenas se active.
        </Panel>
      )}

      {loading ? (
        <Panel className="space-y-3 p-5">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-full" />
        </Panel>
      ) : loadError ? (
        <Panel className="p-5">
          <p role="alert" className="text-sm text-danger">{loadError}</p>
          <Button className="mt-3" onClick={() => void load()}>Intentar de nuevo</Button>
        </Panel>
      ) : contact && !changing ? (
        <div className="space-y-4">
          <Panel className="flex flex-wrap items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-brand">
              <CheckCircle2 size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="tabular text-sm font-semibold text-fg">{formatPhone(contact.phone)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone="success">Verificado</Badge>
                {contact.verifiedAt && <span>{formatDateTime(contact.verifiedAt)}</span>}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setChanging(true)}>Cambiar número</Button>
            <HoldToConfirm compact label="Mantén para desvincular" onConfirm={remove} />
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start gap-3">
              <MessageCircle size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">Cotiza desde WhatsApp</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                  <li>
                    Escribe <strong className="text-fg">cotizar</strong> al número de CotizaIA
                    {info?.botNumber ? ` (${formatPhone(info.botNumber)})` : ""}.
                  </li>
                  <li>Responde el nombre y el correo del cliente.</li>
                  <li>Cuenta el proyecto. Si falta un dato, el agente te lo pregunta.</li>
                  <li>La propuesta queda en Propuestas para que la revises antes de enviarla.</li>
                </ol>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex items-center rounded-full border font-medium transition-colors duration-200 ease-out ${buttonVariants.primary} ${buttonSizes.md}`}
                  >
                    <Send size={16} aria-hidden /> Abrir el chat
                  </a>
                )}
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-wrap items-center gap-3 p-5">
            <BellRing size={20} className="shrink-0 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Avisos de propuestas</p>
              <p className="text-xs text-muted">Te escribimos cuando una propuesta cambia de estado.</p>
            </div>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                role="switch"
                aria-label="Avisos de propuestas"
                checked={Boolean(contact.enabled)}
                disabled={saving}
                onChange={() => void toggleNotices()}
                className="h-5 w-5 accent-[var(--brand)]"
              />
              {contact.enabled ? "Activados" : "Pausados"}
            </label>
          </Panel>
        </div>
      ) : (
        <LinkForm onLinked={linked} onCancel={contact ? () => setChanging(false) : null} />
      )}
    </div>
  );
}

function LinkForm({ onLinked, onCancel }) {
  const [phone, setPhone] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [sentTo, setSentTo] = useState(null);
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef(null);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  useEffect(() => {
    if (sentTo) codeRef.current?.focus();
  }, [sentTo]);

  async function sendCode(event) {
    event?.preventDefault();
    const problem = phoneError(phone);
    if (problem) {
      setPhoneMessage(problem);
      return;
    }
    setBusy(true);
    setPhoneMessage("");
    try {
      const sent = await post(`${BASE}/verification`, { phone: normalizePhone(phone) });
      setSentTo(sent?.phone || formatPhone(normalizePhone(phone)));
      setCode("");
      setCodeMessage("");
      setWait(RESEND_SECONDS);
      toast.success("Te enviamos un código por WhatsApp.");
    } catch (error) {
      const message = whatsappErrorMessage(error, "send");
      if (sentTo) setCodeMessage(message);
      else setPhoneMessage(message);
      if (error.status === 429) setWait(RESEND_SECONDS);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setCodeMessage(`El código tiene ${CODE_LENGTH} dígitos.`);
      return;
    }
    setBusy(true);
    setCodeMessage("");
    try {
      onLinked(await post(`${BASE}/verify`, { code }));
    } catch (error) {
      setCodeMessage(whatsappErrorMessage(error, "verify"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {!sentTo ? (
        <FormPanel
          key="phone"
          title="Vincula tu número"
          subtitle="Te enviaremos un código de 6 dígitos por WhatsApp para confirmar que es tuyo."
          onSubmit={sendCode}
          footer={
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" icon={Send} loading={busy}>Enviar código</Button>
              {onCancel && <Button onClick={onCancel}>Cancelar</Button>}
            </div>
          }
        >
          <LimitedInput
            label="Número de WhatsApp"
            hint="Con indicativo. Si es de Colombia puedes escribir solo los 10 dígitos."
            error={phoneMessage}
            limit={20}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+57 300 123 4567"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setPhoneMessage("");
            }}
          />
        </FormPanel>
      ) : (
        <FormPanel
          key="code"
          title="Escribe el código"
          subtitle={`Lo enviamos por WhatsApp a ${sentTo}. Vence en 10 minutos.`}
          onSubmit={verify}
          footer={
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary" icon={ShieldCheck} loading={busy}>Verificar</Button>
              <Button className="tabular" onClick={() => void sendCode()} disabled={busy || wait > 0}>
                {wait > 0 ? `Reenviar en ${wait} s` : "Reenviar código"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSentTo(null);
                  setCodeMessage("");
                }}
              >
                Cambiar número
              </Button>
            </div>
          }
        >
          <LimitedInput
            ref={codeRef}
            label="Código de verificación"
            error={codeMessage}
            // Room for a pasted "123 456" or "Código: 123456": cleanCode keeps the six digits.
            limit={CODE_LENGTH * 4}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="123456"
            fieldClassName="font-mono tracking-[0.4em]"
            value={code}
            onChange={(event) => {
              setCode(cleanCode(event.target.value));
              setCodeMessage("");
            }}
          />
        </FormPanel>
      )}
    </AnimatePresence>
  );
}
