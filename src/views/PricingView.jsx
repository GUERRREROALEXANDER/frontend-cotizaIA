import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock3, Layers3, Check, Save, SlidersHorizontal, ArrowUpRight, ArrowDownRight, BadgePercent, Sparkles } from "lucide-react";
import { get, put } from "../api.js";
import { toast } from "sonner";
import { Panel, SectionHeading, StatusBadge, Button, formatCurrency } from "../components/ui.jsx";
import { LimitedInput } from "../components/fields.jsx";
import { CountUp } from "../motion/Motion.jsx";
import { duration, ease, staggerDelay } from "../motion/presets.js";

const pricingModels = [
  { id: "FIXED", title: "Precio fijo", description: "Una inversión cerrada para el alcance acordado.", icon: Coins },
  { id: "HOURLY", title: "Por horas", description: "Tarifa transparente ligada al esfuerzo estimado.", icon: Clock3 },
  { id: "PHASED", title: "Por fases", description: "Pagos y alcance ordenados por entregables.", icon: Layers3 },
];

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
      setSuccess("Horas guardadas; el backend recalculó los importes.");
      toast.success("Horas guardadas; el backend recalculó los importes.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSavingItem(null);
    }
  }

  const activeModel = pricingModels.find((m) => m.id === pricingModel) || pricingModels[0];

  return (
    <div className="portal-in">
      <SectionHeading
        title="Estrategia de precios"
        description="Define el modelo por defecto y afina las horas de una propuesta real."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-mono text-muted">
            <SlidersHorizontal size={10} /> {activeModel.title}
          </span>
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
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-success/25 bg-success/5 px-4 py-3 text-sm text-success"
          role="status"
        >
          {success}
        </motion.div>
      )}

      <Panel className="overflow-hidden">
        <div className="flex items-start justify-between border-b border-line px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-fg">Modelo de cotización predeterminado</p>
            <p className="mt-1 text-xs text-muted">El agente utilizará esta estrategia al preparar nuevos presupuestos.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-2">
            {pricingModels.map(({ id, title, description, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                disabled={savingModel}
                onClick={() => saveModel(id)}
                className="relative flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors group"
                style={{ zIndex: pricingModel === id ? 10 : 0 }}
              >
                {pricingModel === id && (
                  <motion.div
                    layoutId="pricing-model-active"
                    className="absolute inset-0 rounded-lg bg-accent-soft border border-brand/40"
                    initial={false}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  />
                )}
                <span className={`relative grid h-11 w-11 place-items-center rounded-lg ${pricingModel === id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}>
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="relative text-sm font-medium">{title}</span>
                <span className="relative text-[11px] leading-4 max-w-[180px] text-muted">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-line px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-fg">Ajuste de alcance</p>
              <p className="mt-1 text-xs text-muted">Edita horas de ítems en una cotización procesada.</p>
            </div>
          </div>
          <div className="p-5">
            <label className="block text-xs text-muted">
              Propuesta
              <select
                className="mt-2 w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-faint hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-accent-soft"
                value={selectedProposalId}
                onChange={(event) => setSelectedProposalId(event.target.value)}
              >
                <option value="">Selecciona una propuesta…</option>
                {proposals.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} · Brief #{item.briefId} · {formatCurrency(item.total)}
                  </option>
                ))}
              </select>
            </label>
            {loading && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 text-sm text-muted"
              >
                Cargando detalle de propuesta…
              </motion.p>
            )}
            {proposal && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
                  <span className="flex items-center gap-2 text-sm">
                    Propuesta #{proposal.id}
                    <span className="mx-1 text-muted" aria-hidden>·</span>
                    <StatusBadge status={proposal.status} />
                  </span>
                  <span className="font-mono text-base text-fg tabular-nums">
                    <CountUp value={proposal.total} format={formatCurrency} />
                  </span>
                </div>
                <AnimatePresence mode="popLayout">
                  {proposal.items?.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.2, ease: ease.out, delay: staggerDelay(0) }}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-fg truncate">{item.description}</p>
                        <p className="mt-1 font-mono text-xs text-muted tabular-nums">
                          {formatCurrency(item.unitPrice)} / hora
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        Horas
                        <input
                          type="number"
                          min="0.1"
                          max="9999"
                          step="0.1"
                          value={hoursDraft[item.id] ?? ""}
                          onChange={(event) => setHoursDraft({ ...hoursDraft, [item.id]: event.target.value })}
                          className="w-20 rounded-md border border-line bg-surface-2 px-2.5 py-2 font-mono text-xs text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-faint hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-accent-soft"
                        />
                      </label>
                      <span className="w-24 text-right font-mono text-sm text-muted tabular-nums">
                        <CountUp value={item.lineTotal} format={formatCurrency} />
                      </span>
                      <Button
                        variant="ghost"
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
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted text-center py-8"
                  >
                    Esta propuesta no incluye ítems editables.
                  </motion.p>
                )}
              </motion.div>
            )}
            {!proposals.length && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-xl border border-line bg-surface p-5 text-center text-sm text-muted"
              >
                Aún no hay propuestas para ajustar.
              </motion.p>
            )}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-line px-5 py-5">
            <div>
              <p className="text-sm font-semibold text-fg">Simulador de modificadores</p>
              <p className="mt-1 text-xs text-muted">Previsualiza ajustes sobre el total actual.</p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <ToggleRow
              icon={ArrowUpRight}
              title="Entrega prioritaria"
              description="Recargo ilustrativo del 20%"
              active={urgency}
              onToggle={() => setUrgency(!urgency)}
              tone="warning"
            />
            <ToggleRow
              icon={ArrowDownRight}
              title="Descuento comercial"
              description="Descuento de referencia configurable"
              active={discount}
              onToggle={() => setDiscount(!discount)}
              tone="info"
            />
            {discount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-12"
              >
                <label className="block text-[11px] text-muted">
                  Porcentaje del descuento
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountRate}
                      onChange={(event) => setDiscountRate(event.target.value)}
                      className="w-24 rounded-md border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-fg outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-faint hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-accent-soft"
                    />
                    <span className="text-muted">%</span>
                  </div>
                </label>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-5 rounded-2xl border border-brand/15 bg-accent/5 p-5"
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand">
                <Sparkles size={12} aria-hidden />
                Estimación dinámica
              </div>
              <p className="mt-4 font-mono text-3xl tracking-tight text-fg tabular-nums">
                <CountUp value={previewTotal} format={formatCurrency} />
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                {proposal ? "Vista previa calculada a partir del total de la propuesta." : "Selecciona una propuesta para ver una referencia."}
              </p>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="text-[10px] leading-5 text-muted"
            >
              Los modificadores son una vista previa local; no se envían al backend. La estrategia y las horas sí se guardan mediante la API.
            </motion.p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, active, onToggle, tone }) {
  const toneClasses = {
    warning: "bg-warning/12 text-warning border-warning/25",
    info: "bg-info/12 text-info border-info/25",
    success: "bg-success/12 text-success border-success/25",
    danger: "bg-danger/10 text-danger border-danger/25",
    accent: "bg-accent-soft text-brand border-brand/25",
    neutral: "bg-surface-2 text-muted border-line",
  };
  const iconBgClasses = {
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent-soft text-brand",
    neutral: "bg-surface-2 text-muted",
  };
  const activeColors = {
    warning: "bg-warning",
    info: "bg-info",
    success: "bg-success",
    danger: "bg-danger",
    accent: "bg-accent",
    neutral: "bg-muted",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${iconBgClasses[tone]}`}>
        <Icon size={14} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-1 text-[10px] text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={title}
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${active ? activeColors[tone] : "bg-surface-2 border border-line"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-fg shadow transition-transform ${active ? "translate-x-[20px]" : "translate-x-0"}`} />
      </button>
    </div>
  );
}