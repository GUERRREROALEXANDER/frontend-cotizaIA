import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BadgePercent, Check, Clock3, Coins, FileText, Layers3, Save, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { get, put } from "../api.js";
import { formatCurrency, inputClass, Panel, SectionHeading, StatusBadge, buttonClass } from "../components/ui.jsx";

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
  const [saved, setSaved] = useState("");
  const [hoursDraft, setHoursDraft] = useState({});
  const [urgency, setUrgency] = useState(false);
  const [discount, setDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState(5);

  useEffect(() => {
    if (!selectedProposalId) {
      setProposal(null);
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

  async function saveModel(model) {
    setSavingModel(true);
    setError("");
    setSaved("");
    try {
      const result = await put("/api/agency/pricing-model", { pricingModel: model });
      onPricingModel(result.pricingModel);
      setSaved("Estrategia de precios actualizada.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingModel(false);
    }
  }

  async function saveHours(item) {
    const hours = Number(hoursDraft[item.id]);
    if (!Number.isFinite(hours) || hours <= 0) {
      setError("Ingresa una cantidad de horas mayor que cero.");
      return;
    }
    setSavingItem(item.id);
    setError("");
    setSaved("");
    try {
      const result = await put(`/api/proposals/${proposal.id}/items/${item.id}`, { hours });
      setProposal(result);
      setHoursDraft(Object.fromEntries((result.items || []).map((line) => [line.id, String(line.hours)])));
      await onRefresh();
      setSaved("Horas guardadas; el backend recalculó los importes.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingItem(null);
    }
  }

  return (
    <div className="portal-in">
      <SectionHeading
        eyebrow="Configuración comercial · Estrategia de precios"
        title="El precio también es estrategia."
        description="Define el modelo por defecto y afina las horas de una propuesta real."
        action={<span className="rounded-full border border-amber-400/15 bg-amber-400/[.06] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-300">{pricingModel || "FIXED"}</span>}
      />

      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-300">{error}</div>}
      {saved && <div role="status" className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] px-4 py-3 text-xs text-emerald-200">{saved}</div>}

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-100">Modelo de cotización predeterminado</p>
            <p className="mt-1 text-xs text-slate-500">El agente utilizará esta estrategia al preparar nuevos presupuestos.</p>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-slate-500"><ShieldCheck size={13} /> Se guarda en tu agencia</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {pricingModels.map(({ id, title, description, icon: Icon }) => {
            const active = pricingModel === id;
            return (
              <button key={id} type="button" disabled={savingModel} onClick={() => saveModel(id)} className={`relative min-h-36 rounded-xl border p-4 text-left transition ${active ? "border-indigo-400/35 bg-indigo-400/[.07]" : "border-slate-800/80 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/45"}`}>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-indigo-400/15 text-indigo-300" : "bg-slate-800 text-slate-400"}`}><Icon size={16} /></span>
                {active && <span className="absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full bg-indigo-400/15 text-indigo-300"><Check size={12} /></span>}
                <span className="mt-4 block text-xs font-semibold text-slate-100">{title}</span>
                <span className="mt-1.5 block max-w-[220px] text-[10px] leading-4 text-slate-500">{description}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-slate-800/70 px-5 py-5 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-100">Ajuste de alcance</p>
              <p className="mt-1 text-xs text-slate-500">Edita horas de ítems en una cotización procesada.</p>
            </div>
            <SlidersHorizontal size={17} className="text-slate-500" />
          </div>
          <div className="p-5 sm:p-6">
            <label className="block text-xs text-slate-400">Propuesta
              <select className={`${inputClass} mt-2`} value={selectedProposalId} onChange={(event) => setSelectedProposalId(event.target.value)}>
                <option value="">Selecciona una propuesta…</option>
                {proposals.map((item) => <option key={item.id} value={item.id}>#{item.id} · Brief #{item.briefId} · {formatCurrency(item.total)}</option>)}
              </select>
            </label>
            {loading && <p className="mt-5 text-xs text-slate-500">Cargando detalle de propuesta…</p>}
            {proposal && !loading && (
              <>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/35 px-4 py-3">
                  <span className="text-xs text-slate-400">Propuesta #{proposal.id} <span className="mx-1 text-slate-700">·</span> <StatusBadge status={proposal.status} /></span>
                  <span className="font-mono text-sm text-amber-300">{formatCurrency(proposal.total)}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {proposal.items?.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/50 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-200">{item.description}</p>
                        <p className="mt-1 text-[9px] font-mono text-slate-500">{formatCurrency(item.unitPrice)} / hora</p>
                      </div>
                      <label className="flex items-center gap-2 text-[9px] text-slate-500">
                        Horas
                        <input type="number" min="0.1" step="0.1" value={hoursDraft[item.id] ?? ""} onChange={(event) => setHoursDraft({ ...hoursDraft, [item.id]: event.target.value })} className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 font-mono text-xs text-slate-200 outline-none focus:border-indigo-400/50" />
                      </label>
                      <span className="w-24 text-right font-mono text-[10px] text-slate-300">{formatCurrency(item.lineTotal)}</span>
                      <button type="button" disabled={savingItem === item.id} onClick={() => saveHours(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-indigo-400/25 hover:text-indigo-300 disabled:opacity-50" aria-label="Guardar horas"><Save size={13} /></button>
                    </div>
                  ))}
                  {!proposal.items?.length && <p className="text-xs text-slate-500">Esta propuesta no incluye ítems editables.</p>}
                </div>
              </>
            )}
            {!proposals.length && <p className="mt-5 rounded-xl border border-slate-800/60 px-4 py-5 text-center text-xs text-slate-500">Aún no hay propuestas para ajustar.</p>}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-slate-800/70 px-5 py-5 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-100">Simulador de modificadores</p>
              <p className="mt-1 text-xs text-slate-500">Previsualiza ajustes sobre el total actual.</p>
            </div>
            <BadgePercent size={17} className="text-amber-300" />
          </div>
          <div className="space-y-3 p-5 sm:p-6">
            <ToggleRow icon={ArrowUpRight} title="Entrega prioritaria" description="Recargo ilustrativo del 20%" active={urgency} onToggle={() => setUrgency(!urgency)} accent="amber" />
            <ToggleRow icon={ArrowDownRight} title="Descuento comercial" description="Descuento de referencia configurable" active={discount} onToggle={() => setDiscount(!discount)} accent="indigo" />
            {discount && <label className="block pl-12 text-[10px] text-slate-500">Porcentaje del descuento
              <span className="mt-2 flex items-center gap-2">
                <input type="number" min="0" max="100" value={discountRate} onChange={(event) => setDiscountRate(event.target.value)} className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-indigo-400/50" />
                <span>%</span>
              </span>
            </label>}
            <div className="mt-5 rounded-2xl border border-amber-400/15 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,.08),transparent_65%)] p-5">
              <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-amber-300/80"><Sparkles size={12} /> Estimación dinámica</div>
              <p className="mt-4 font-mono text-3xl tracking-tight text-amber-300">{formatCurrency(previewTotal)}</p>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">{proposal ? "Vista previa calculada a partir del total de la propuesta." : "Selecciona una propuesta para ver una referencia."}</p>
            </div>
            <p className="text-[9px] leading-4 text-slate-600">Los modificadores son una vista previa local; no se envían al backend. La estrategia y las horas sí se guardan mediante la API.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, active, onToggle, accent }) {
  const activeColor = accent === "amber" ? "bg-amber-400" : "bg-indigo-400";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3.5">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent === "amber" ? "bg-amber-400/10 text-amber-300" : "bg-indigo-400/10 text-indigo-300"}`}><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-[9px] text-slate-500">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={active} aria-label={title} onClick={onToggle} className={`relative h-5 w-9 rounded-full transition ${active ? activeColor : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
