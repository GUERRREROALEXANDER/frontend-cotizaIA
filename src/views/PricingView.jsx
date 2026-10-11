import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Check, Clock3, Coins, Layers3, Save, Sparkles } from "lucide-react";
import { get, put } from "../api.js";
import { toast } from "sonner";
import { PageHeader, Panel, SectionHeading, Button, InkPanel, statusLabels, formatCurrency } from "../components/ui.jsx";
import { ComboSelect } from "../components/fields.jsx";
import { CountUp } from "../motion/Motion.jsx";
import { duration, ease, reducedFade, staggerDelay, viewTransition } from "../motion/presets.js";

const pricingModels = [
  { id: "FIXED", title: "Precio fijo", description: "Una inversión cerrada para el alcance acordado.", icon: Coins },
  { id: "HOURLY", title: "Por horas", description: "Tarifa transparente ligada al esfuerzo estimado.", icon: Clock3 },
  { id: "PHASED", title: "Por fases", description: "Pagos y alcance ordenados por entregables.", icon: Layers3 },
];

// Wise input styling at row width, so the hours field matches the design
// system without fighting the full-width field class.
const hoursFieldClass =
  "tabular w-24 rounded-lg border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-faint hover:border-brand/60 focus:border-brand focus:ring-4 focus:ring-accent-soft";

export default function PricingView({ pricingModel, proposals, onPricingModel, onRefresh }) {
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hoursDraft, setHoursDraft] = useState({});
  const [urgency, setUrgency] = useState(false);
  const [discount, setDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState(5);
  const reduce = useReducedMotion();
  const messageMotion = reduce ? reducedFade : viewTransition;

  useEffect(() => {
    if (!selectedProposalId) {
      setProposal(null);
      setHoursDraft({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    get(`/api/proposals/${selectedProposalId}`)
      .then((detail) => {
        if (!cancelled) {
          setProposal(detail);
          setHoursDraft(Object.fromEntries((detail.items || []).map((item) => [item.id, String(item.hours)])));
        }
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedProposalId]);

  const previewTotal = useMemo(() => {
    const base = Number(proposal?.total || 0);
    return base * (urgency ? 1.2 : 1) * (discount ? 1 - Math.max(0, Number(discountRate) || 0) / 100 : 1);
  }, [proposal?.total, urgency, discount, discountRate]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const proposalOptions = (proposals || []).map((item) => {
    const status = String(item.status || "").toUpperCase();
    return {
      value: String(item.id),
      label: `Propuesta #${item.id}`,
      description: statusLabels[status] || (item.briefId ? `Brief #${item.briefId}` : "Propuesta"),
      meta: formatCurrency(item.total),
    };
  });

  async function saveModel(model) {
    clearMessages();
    setSavingModel(true);
    try {
      const result = await put("/api/agency/pricing-model", { pricingModel: model });
      onPricingModel(result.pricingModel);
      setSuccess("Estrategia de precios actualizada.");
      toast.success("Estrategia de precios actualizada.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSavingModel(false);
    }
  }

  async function saveHours(item) {
    const hours = Number(hoursDraft[item.id]);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError("Ingresa una cantidad de horas mayor que cero.");
      toast.error("Ingresa una cantidad de horas mayor que cero.");
      return;
    }
    clearMessages();
    setSavingItem(item.id);
    try {
      const result = await put(`/api/proposals/${proposal.id}/items/${item.id}`, { hours });
      setProposal(result);
      setHoursDraft(Object.fromEntries((result.items || []).map((line) => [line.id, String(line.hours)])));
      await onRefresh();
      setSuccess("Horas guardadas; los importes se recalcularon.");
      toast.success("Horas guardadas; los importes se recalcularon.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSavingItem(null);
    }
  }

  return (
    <div className="portal-in">
      <PageHeader
        title="Estrategia de precios"
        description="Define el modelo por defecto y afina las horas de una propuesta real."
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
      {success && (
        <motion.div
          {...messageMotion}
          className="mb-6 rounded-2xl bg-accent-soft px-5 py-4 text-sm font-medium text-brand"
          role="status"
        >
          {success}
        </motion.div>
      )}

      <section className="mb-10">
        <SectionHeading
          title="Modelo de cotización predeterminado"
          description="El agente utilizará esta estrategia al preparar nuevos presupuestos."
        />
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {pricingModels.map(({ id, title, description, icon: Icon }) => {
            const active = pricingModel === id;
            return (
              <button
                key={id}
                type="button"
                disabled={savingModel}
                onClick={() => saveModel(id)}
                aria-pressed={active}
                className={`relative min-h-44 overflow-hidden rounded-2xl p-6 text-left transition-shadow duration-300 ${
                  active ? "text-ink-text" : "bg-surface text-fg shadow-card hover:shadow-lift"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pricing-model-active"
                    initial={false}
                    transition={{ duration: duration.panel, ease: ease.fluid }}
                    className="absolute inset-0 rounded-2xl bg-ink"
                    aria-hidden
                  />
                )}
                <span className={`relative grid h-12 w-12 place-items-center rounded-full ${active ? "bg-accent text-accent-fg" : "bg-accent-soft text-brand"}`}>
                  <Icon size={22} strokeWidth={1.8} aria-hidden />
                </span>
                <span className="relative mt-5 block text-xl font-bold tracking-tight">{title}</span>
                <span className={`relative mt-2 block text-sm ${active ? "text-ink-text/75" : "text-muted"}`}>{description}</span>
                {active && (
                  <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-fg">
                    <Check size={16} aria-hidden /> Modelo activo
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="p-6">
          <SectionHeading title="Ajuste de alcance" description="Edita las horas de los ítems en una propuesta procesada." />
          <ComboSelect
            label="Propuesta"
            value={selectedProposalId}
            onChange={setSelectedProposalId}
            options={proposalOptions}
            placeholder="Selecciona una propuesta..."
            emptyText="Sin propuestas disponibles"
          />

          {!proposals.length && (
            <motion.p
              {...messageMotion}
              className="mt-6 rounded-xl bg-surface-2/60 p-6 text-center text-sm text-muted"
            >
              Aún no hay propuestas para ajustar.
            </motion.p>
          )}

          {loading && (
            <motion.p {...messageMotion} className="mt-6 text-sm text-muted">
              Cargando detalle de la propuesta…
            </motion.p>
          )}

          {proposal && !loading && (
            <motion.div
              {...messageMotion}
              className="mt-6 space-y-4"
            >
              <InkPanel className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tabular text-sm font-medium text-ink-text/70">Propuesta #{proposal.id}</span>
                  <InkStatus status={proposal.status} />
                </div>
                <p className="display tabular text-3xl text-ink-fg">
                  <CountUp value={proposal.total} format={formatCurrency} />
                </p>
              </InkPanel>

              <AnimatePresence mode="popLayout">
                {proposal.items?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: duration.state, ease: ease.out, delay: staggerDelay(index) }}
                    className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-2/60 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-fg">{item.description}</p>
                      <p className="tabular mt-1 font-mono text-sm text-muted">{formatCurrency(item.unitPrice)} por hora</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted">
                      Horas
                      <input
                        type="number"
                        min="0.1"
                        max="9999"
                        step="0.1"
                        value={hoursDraft[item.id] ?? ""}
                        onChange={(event) => setHoursDraft({ ...hoursDraft, [item.id]: event.target.value })}
                        className={hoursFieldClass}
                      />
                    </label>
                    <p className="display tabular min-w-36 text-right text-[28px] text-fg">
                      <CountUp value={item.lineTotal} format={formatCurrency} />
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Save}
                      loading={savingItem === item.id}
                      onClick={() => saveHours(item)}
                      disabled={savingItem === item.id}
                      aria-label="Guardar horas"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {!proposal.items?.length && (
                <motion.p {...messageMotion} className="py-10 text-center text-sm text-muted">
                  Esta propuesta no incluye ítems editables.
                </motion.p>
              )}
            </motion.div>
          )}
        </Panel>

        <Panel className="p-6">
          <SectionHeading title="Simulador de modificadores" description="Previsualiza ajustes sobre el total actual." />
          <div className="space-y-3">
            <ToggleRow
              icon={ArrowUpRight}
              title="Entrega prioritaria"
              description="Recargo ilustrativo del 20%"
              active={urgency}
              onToggle={() => setUrgency(!urgency)}
            />
            <ToggleRow
              icon={ArrowDownRight}
              title="Descuento comercial"
              description="Descuento de referencia configurable"
              active={discount}
              onToggle={() => setDiscount(!discount)}
            />
          </div>

          <AnimatePresence>
            {discount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.state, ease: ease.out }}
              >
                <label className="mt-4 block text-sm text-muted">
                  Porcentaje del descuento
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(event) => setDiscountRate(event.target.value)}
                      className={hoursFieldClass}
                    />
                    <span className="text-sm text-muted">%</span>
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            {...(reduce ? reducedFade : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: duration.state, ease: ease.out } })}
            className="mt-6 rounded-2xl bg-accent-soft p-6"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Sparkles size={14} aria-hidden />
              Estimación dinámica
            </p>
            <p className="display tabular mt-4 text-[clamp(2.25rem,4vw,3rem)] text-fg">
              <CountUp value={previewTotal} format={formatCurrency} />
            </p>
            <p className="mt-3 text-sm text-muted">
              {proposal ? "Vista previa calculada a partir del total de la propuesta." : "Selecciona una propuesta para ver una referencia."}
            </p>
          </motion.div>

          <p className="mt-4 text-sm text-faint">
            Simulación: no cambia la propuesta guardada. La estrategia de precios y las horas sí se guardan.
          </p>
        </Panel>
      </div>
    </div>
  );
}

// On the forest panel the tone-based badge loses its contrast, so the status
// reads as a lime chip instead.
function InkStatus({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const label = statusLabels[normalized] || normalized.replaceAll("_", " ").toLowerCase();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink-fg/30 px-3 py-1.5 text-xs font-semibold text-ink-fg">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-fg" aria-hidden />
      {label}
    </span>
  );
}

function ToggleRow({ icon: Icon, title, description, active, onToggle }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-2/60 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-brand" aria-hidden>
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={title}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out ${active ? "bg-accent" : "border border-line-strong bg-surface"}`}
      >
        <motion.span
          className="absolute left-1 top-1 h-4 w-4 rounded-full bg-surface shadow-card"
          animate={{ x: active ? 20 : 0 }}
          transition={{ duration: duration.state, ease: ease.out }}
        />
      </button>
    </div>
  );
}
