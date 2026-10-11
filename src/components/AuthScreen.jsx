import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Logo from "./brand/Logo.jsx";
import { Bot, Eye, EyeOff, FileCheck2, MessageCircle, Moon, Sun } from "lucide-react";
import { post, tokenStorageKey } from "../api.js";
import { LIMITS } from "../limits.js";
import { duration, ease } from "../motion/presets.js";
import { LimitedInput } from "./fields.jsx";
import { Button, IconButton } from "./ui.jsx";

const brandCards = [
  {
    id: "brief",
    Icon: MessageCircle,
    eyebrow: "Paso 1",
    title: "Brief de WhatsApp",
    description: "El cliente escribe lo que necesita, sin formatos ni plantillas.",
  },
  {
    id: "agent",
    Icon: Bot,
    eyebrow: "Paso 2",
    title: "Agente procesando",
    description: "CotizaIA analiza el brief y arma la propuesta en minutos.",
  },
  {
    id: "proposal",
    Icon: FileCheck2,
    eyebrow: "Paso 3",
    title: "Propuesta lista · $12.400.000",
    description: "Precios claros para enviar al cliente esta noche.",
  },
];

function BrandLoop() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const timer = setInterval(() => setActive((index) => (index + 1) % brandCards.length), 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  if (reduce) {
    return (
      <div className="flex flex-col gap-3">
        {brandCards.map((card) => (
          <article key={card.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-brand">
              <card.Icon size={16} aria-hidden />
            </span>
            <span>
              <span className="block text-[11px] font-medium text-faint">{card.eyebrow}</span>
              <span className="block text-sm font-semibold text-fg">{card.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{card.description}</span>
            </span>
          </article>
        ))}
      </div>
    );
  }

  const card = brandCards[active];
  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: duration.state, ease: ease.out }}
          className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-brand">
            <card.Icon size={16} aria-hidden />
          </span>
          <span>
            <span className="block text-[11px] font-medium text-faint">{card.eyebrow}</span>
            <span className="block text-sm font-semibold text-fg">{card.title}</span>
            <span className="mt-0.5 block text-xs text-muted">{card.description}</span>
          </span>
        </motion.article>
      </AnimatePresence>
      <div className="mt-4 flex items-center gap-1.5" aria-hidden>
        {brandCards.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 rounded-full transition-colors duration-200 ${index === active ? "w-5 bg-accent" : "w-1.5 bg-line-strong"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthScreen({ onAuthenticated, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ agencyName: "", ownerFullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  const modes = [
    { id: "login", label: "Iniciar sesión" },
    { id: "register", label: "Crear cuenta" },
  ];

  return (
    <main className="relative grid min-h-dvh bg-bg text-fg lg:grid-cols-2">
      <div className="absolute right-4 top-4">
        <IconButton
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onClick={onToggleTheme}
        />
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <Logo size={52} />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            {mode === "register" ? "Crea tu cuenta" : "Qué bueno verte"}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            {mode === "register"
              ? "Configura tu centro de operaciones en minutos."
              : "Ingresa para continuar con tus propuestas."}
          </p>

          <div role="tablist" aria-label="Modo de acceso" className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1">
            {modes.map((item) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => switchMode(item.id)}
                  className={`relative rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${selected ? "text-fg" : "text-muted hover:text-fg"}`}
                >
                  {selected && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      transition={{ duration: duration.state, ease: ease.fluid }}
                      className="absolute inset-0 rounded-md bg-surface shadow-card"
                      aria-hidden
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <LimitedInput
                  label="Nombre de la agencia"
                  name="agencyName"
                  autoComplete="organization"
                  value={form.agencyName}
                  onChange={updateField}
                  limit={LIMITS.agencyName}
                  required
                />
                <LimitedInput
                  label="Nombre completo"
                  name="ownerFullName"
                  autoComplete="name"
                  value={form.ownerFullName}
                  onChange={updateField}
                  limit={LIMITS.ownerName}
                  required
                />
              </>
            )}
            <LimitedInput
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              limit={LIMITS.email}
              required
            />
            <div className="relative">
              <LimitedInput
                label="Contraseña"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={form.password}
                onChange={updateField}
                minLength={LIMITS.passwordMin}
                limit={LIMITS.password}
                hint={mode === "register" ? "Mínimo 8 caracteres." : undefined}
                fieldClassName="pr-11"
                required
              />
              <span className="absolute right-1 top-6">
                <IconButton
                  icon={showPassword ? EyeOff : Eye}
                  label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((value) => !value)}
                />
              </span>
            </div>
            {error && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs leading-5 text-danger">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" loading={busy} className="w-full">
              {busy ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>

      <aside className="hidden flex-col justify-between gap-10 bg-surface-2 px-10 py-12 lg:flex" aria-hidden={false}>
        <div>
          <p className="text-xs font-medium text-muted">Briefs, análisis y propuestas en un solo lugar.</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Menos tiempo cotizando, más foco en tu negocio.
          </h2>
        </div>
        <BrandLoop />
        <p className="text-xs text-faint">Tus datos viajan cifrados.</p>
      </aside>
    </main>
  );
}
