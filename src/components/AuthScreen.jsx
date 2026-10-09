import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Bot, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { post, tokenStorageKey } from "../api.js";
import { inputClass } from "./ui.jsx";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ agencyName: "", ownerFullName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };
      const result = await post(`/api/auth/${mode === "register" ? "register" : "login"}`, payload);
      window.localStorage.setItem(tokenStorageKey, result.token);
      onAuthenticated(result.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-5 py-10">
      <div className="ambient-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-amber-500/[.06] blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.75, 0.25, 1] }}
        className="relative grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/65 shadow-2xl shadow-black/40 backdrop-blur-2xl md:grid-cols-[1.05fr_.95fr]"
      >
        <div className="relative hidden min-h-[550px] flex-col justify-between overflow-hidden border-r border-slate-800/70 p-10 md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_0%,rgba(99,102,241,.13),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300">
              <Bot size={18} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-100">cotiza<span className="text-amber-400">IA</span></span>
          </div>
          <div className="relative">
            <div className="mb-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-indigo-300">
              <Sparkles size={13} /> Plataforma comercial autónoma
            </div>
            <h1 className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-.045em] text-slate-100">
              Más foco en tu negocio. Menos tiempo cotizando.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Briefs, análisis y propuestas en un solo centro de operaciones para tu agencia.
            </p>
          </div>
          <div className="relative flex items-center gap-2 text-[10px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Conexión segura al backend de CotizaIA
          </div>
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300"><Bot size={18} /></span>
            <span className="text-sm font-semibold text-slate-100">cotiza<span className="text-amber-400">IA</span></span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-500">
            {mode === "register" ? "Tu agencia, lista para crecer" : "Espacio de trabajo"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            {mode === "register" ? "Crea tu cuenta" : "Qué bueno verte"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "register" ? "Configura tu centro de operaciones en minutos." : "Ingresa para continuar con tus propuestas."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <>
                <label className="block text-xs text-slate-400">
                  Nombre de la agencia
                  <input className={`${inputClass} mt-2`} name="agencyName" autoComplete="organization" value={form.agencyName} onChange={updateField} required />
                </label>
                <label className="block text-xs text-slate-400">
                  Nombre completo
                  <input className={`${inputClass} mt-2`} name="ownerFullName" autoComplete="name" value={form.ownerFullName} onChange={updateField} required />
                </label>
              </>
            )}
            <label className="block text-xs text-slate-400">
              Correo electrónico
              <span className="relative mt-2 block">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input className={`${inputClass} pl-10`} name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
              </span>
            </label>
            <label className="block text-xs text-slate-400">
              Contraseña
              <span className="relative mt-2 block">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input className={`${inputClass} pl-10`} name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : undefined} value={form.password} onChange={updateField} required />
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[.07] px-3.5 py-3 text-xs leading-5 text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/10 transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {busy ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Ingresar al centro"}
              {!busy && <ArrowUpRight size={16} />}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === "register" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
              className="font-medium text-indigo-300 transition hover:text-indigo-200"
            >
              {mode === "register" ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
