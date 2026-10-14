import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { post, tokenStorageKey } from "../api.js";
import { LIMITS } from "../limits.js";
import { MaskedText } from "../motion/Motion.jsx";
import { duration, ease } from "../motion/presets.js";
import { LimitedInput } from "./fields.jsx";
import Logo, { LogoMark } from "./brand/Logo.jsx";
import AnimatedLink from "./motion/AnimatedLink.jsx";
import { Button, IconButton, InkPanel } from "./ui.jsx";
import { ShaderBackground } from "./motion/ShaderBackground.jsx";

const storySteps = [
  { id: "brief", eyebrow: "Paso 1", text: "Llega el brief por WhatsApp" },
  { id: "estimate", eyebrow: "Paso 2", text: "El agente estima horas y precio" },
  { id: "quote", eyebrow: "Paso 3", text: "Propuesta lista:", chip: "$12.400.000" },
];

function StoryCard({ step }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? {} : { opacity: 1, y: 0 }}
      exit={reduce ? {} : { opacity: 0, y: -8 }}
      transition={reduce ? undefined : { duration: duration.state, ease: ease.out }}
      className="rounded-xl bg-surface p-5 text-fg"
    >
      <span className="block text-[11px] font-medium text-faint">{step.eyebrow}</span>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-[15px] font-semibold leading-6">
        {step.text}
        {step.chip && (
          <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-fg tabular">
            {step.chip}
          </span>
        )}
      </p>
    </motion.article>
  );
}

function BrandStory() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const timer = setInterval(() => setActive((index) => (index + 1) % storySteps.length), 2600);
    return () => clearInterval(timer);
  }, [reduce]);

  if (reduce) {
    return (
      <div className="flex flex-col gap-3">
        {storySteps.map((step) => (
          <StoryCard key={step.id} step={step} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-[112px]">
        <AnimatePresence mode="wait" initial={false}>
          <StoryCard key={storySteps[active].id} step={storySteps[active]} />
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {storySteps.map((step, index) => (
          <span
            key={step.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === active ? "w-6 bg-accent" : "w-1.5 bg-ink-text/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Soft lime halo plus the floating robot mark: the brand stage's centerpiece.
function FloatingMark() {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid place-items-center py-4">
      <span
        aria-hidden="true"
        className="absolute h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--ink-fg) 25%, transparent) 0%, transparent 72%)",
        }}
      />
      <motion.div
        initial={false}
        animate={reduce ? undefined : { y: [-10, 10, -10], rotate: [-3, 3, -3] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <LogoMark size={160} title="CotizaIA" />
      </motion.div>
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
    <main className="relative grid min-h-dvh bg-bg text-fg lg:grid-cols-12">
      <div className="absolute right-4 top-4 z-10">
        <IconButton
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onClick={onToggleTheme}
          className="text-ink-text hover:bg-ink-2 hover:text-ink-fg"
        />
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-8 lg:col-span-5">
        <div className="w-full max-w-sm lg:max-w-md">
          <Logo size={52} />

          <MaskedText
            key={mode}
            as="h1"
            text={mode === "register" ? "Crea tu agencia" : "Qué bueno verte"}
            className="display mt-8 block text-5xl text-fg"
          />
          <p className="mt-4 text-base text-muted">
            {mode === "register"
              ? "Configura tu centro de operaciones en minutos."
              : "Ingresa para continuar con tus propuestas."}
          </p>

          <div
            role="tablist"
            aria-label="Modo de acceso"
            className="mt-7 grid h-12 grid-cols-2 gap-1 rounded-full border border-line bg-surface-2 p-1"
          >
            {modes.map((item) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => switchMode(item.id)}
                  className={`relative flex h-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                    selected ? "text-accent-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      initial={false}
                      transition={{ duration: duration.state, ease: ease.fluid }}
                      className="absolute inset-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
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
              <span className="absolute right-1 top-8">
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
            <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
              {busy ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Ingresar"}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <AnimatedLink
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-sm"
            >
              {mode === "login" ? "¿Aún no tienes cuenta? Crear cuenta" : "¿Ya tienes cuenta? Iniciar sesión"}
            </AnimatedLink>
          </div>
        </div>
      </div>

      <aside className="hidden lg:col-span-7 lg:flex" aria-hidden={false}>
        <InkPanel className="m-4 flex w-full flex-col p-8 lg:p-10">
          <ShaderBackground />
          <div className="relative z-10 flex flex-1 flex-col justify-between gap-8">
            <MaskedText
              as="h2"
              text="Cotiza en minutos, no en días."
              className="display block text-[clamp(3rem,5vw,4.75rem)] text-ink-fg"
            />

            <FloatingMark />

            <BrandStory />

            <p className="text-xs text-ink-text/70">Tus datos viajan cifrados.</p>
          </div>
        </InkPanel>
      </aside>
    </main>
  );
}
