import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { post } from "../api.js";
import { LIMITS } from "../limits.js";
import { MaskedText } from "../motion/Motion.jsx";
import { duration, ease } from "../motion/presets.js";
import { LimitedInput } from "./fields.jsx";
import Logo from "./brand/Logo.jsx";
import AnimatedLink from "./motion/AnimatedLink.jsx";
import { Button, IconButton } from "./ui.jsx";
import AuthDemo from "./auth/AuthDemo.jsx";
import { AuthStage, RegisterSteps } from "./auth/AuthStage.jsx";

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
      await post(`/api/auth/${mode === "register" ? "register" : "login"}`, payload);
      onAuthenticated();
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

  const reduce = useReducedMotion();
  const stageMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

  return (
    <main className="relative grid min-h-dvh bg-bg text-fg lg:grid-cols-12">
      <div className="absolute right-4 top-4 z-10">
        <IconButton
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onClick={onToggleTheme}
          className="text-muted hover:bg-surface-2 hover:text-fg"
        />
      </div>

      <aside className="hidden p-4 lg:col-span-6 lg:flex">
        <AuthStage className="w-full flex-col items-center justify-end px-10 pb-12 pt-10">
          <div className="flex w-full flex-col items-center text-center">
            <div className="[&_*]:!text-white">
              <Logo size={40} />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={stageMotion.initial}
                animate={stageMotion.animate}
                exit={stageMotion.exit}
                transition={{ duration: duration.state, ease: ease.out }}
                className="flex w-full flex-col items-center"
              >
                <h2 className="mt-6 text-[2rem] font-medium leading-tight text-white">
                  {mode === "login" ? "Cotiza en minutos, no en días" : "Empieza con CotizaIA"}
                </h2>
                <p className="mt-2 max-w-[34ch] text-sm text-white/70">
                  {mode === "login"
                    ? "Así se ve un brief convertido en propuesta"
                    : "Tres pasos y tu primer brief queda cotizado"}
                </p>

                <div className="mt-8 flex w-full justify-center">
                  {mode === "login" ? <AuthDemo /> : <RegisterSteps active={0} />}
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="mt-8 text-xs text-white/60">Tus datos viajan cifrados</p>
          </div>
        </AuthStage>
      </aside>

      <div className="flex items-center justify-center px-5 py-14 sm:px-8 lg:col-span-6">
        <div className="w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden">
            <Logo size={52} />
          </div>

          <MaskedText
            key={mode}
            as="h1"
            text={mode === "register" ? "Crea tu agencia" : "Qué bueno verte"}
            className="display mt-8 block text-5xl text-fg lg:mt-0"
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
    </main>
  );
}
