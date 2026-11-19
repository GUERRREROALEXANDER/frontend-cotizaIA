import { useEffect, useState } from "react";
import { CheckCircle2, MailWarning } from "lucide-react";
import { post } from "../api.js";
import {
  VERIFY_MESSAGES,
  authErrorMessage,
  getVerifyTokenFromLocation,
  isInvalidTokenError,
} from "../authVerification.js";
import { LIMITS } from "../limits.js";
import Logo from "../components/brand/Logo.jsx";
import { LimitedInput } from "../components/fields.jsx";
import { Button, Panel } from "../components/ui.jsx";

// Public route #/verify-email?token=... : POSTs /api/auth/verify-email and
// never logs the token. Success shows the login button; an expired link shows
// the resend form instead.
export default function VerifyEmailView({ onGoToLogin }) {
  const [token] = useState(() =>
    getVerifyTokenFromLocation({ hash: window.location.hash, search: window.location.search }),
  );
  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatus("verifying");
    setError("");
    post("/api/auth/verify-email", { token })
      .then(() => {
        if (active) setStatus("verified");
      })
      .catch((requestError) => {
        if (!active) return;
        if (isInvalidTokenError({ status: requestError.status, message: requestError.message })) {
          setStatus("invalid");
        } else {
          setStatus("failed");
          setError(authErrorMessage(requestError));
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function resend(event) {
    event.preventDefault();
    setResendBusy(true);
    setResendError("");
    try {
      await post("/api/auth/resend-verification", { email: resendEmail });
      setResendDone(true);
    } catch (requestError) {
      setResendError(requestError.message);
    } finally {
      setResendBusy(false);
    }
  }

  const needsResendForm = status === "invalid" || status === "missing";

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-14 text-fg">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo size={52} />
        </div>
        <Panel className="mt-8 px-6 py-8 text-center">
          {status === "verifying" && (
            <>
              <p className="text-base font-semibold">Verificando tu correo…</p>
              <p className="mt-2 text-sm text-muted">Un momento, estamos activando tu cuenta.</p>
            </>
          )}
          {status === "verified" && (
            <>
              <CheckCircle2 size={40} aria-hidden className="mx-auto text-success" />
              <h1 className="mt-4 text-2xl font-bold tracking-tight">{VERIFY_MESSAGES.verified}</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Tu cuenta ya está activa. Inicia sesión para continuar con tus propuestas.
              </p>
              <Button variant="primary" size="lg" className="mt-6 w-full" onClick={onGoToLogin}>
                Ir a iniciar sesión
              </Button>
            </>
          )}
          {needsResendForm && (
            <>
              <MailWarning size={40} aria-hidden className="mx-auto text-warning" />
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                {status === "missing" ? "Enlace incompleto" : VERIFY_MESSAGES.expired}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                {status === "missing"
                  ? VERIFY_MESSAGES.missing
                  : "Pide un nuevo correo de activación y abre el enlace más reciente."}
              </p>
              {resendDone ? (
                <p role="status" className="mt-5 rounded-lg border border-success/25 bg-success/10 px-3 py-2.5 text-xs leading-5 text-success">
                  {VERIFY_MESSAGES.resent}
                </p>
              ) : (
                <form onSubmit={resend} className="mt-5 flex flex-col gap-4 text-left">
                  <LimitedInput
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                    limit={LIMITS.email}
                    required
                  />
                  {resendError && (
                    <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs leading-5 text-danger">
                      {resendError}
                    </p>
                  )}
                  <Button type="submit" variant="primary" size="lg" loading={resendBusy} className="w-full">
                    {resendBusy ? "Enviando…" : "Reenviar correo"}
                  </Button>
                </form>
              )}
              <Button variant="ghost" size="sm" className="mt-4" onClick={onGoToLogin}>
                Volver a iniciar sesión
              </Button>
            </>
          )}
          {status === "failed" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">No se pudo verificar</h1>
              <p role="alert" className="mt-3 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2.5 text-xs leading-5 text-danger">
                {error}
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={onGoToLogin}>
                Volver a iniciar sesión
              </Button>
            </>
          )}
        </Panel>
      </div>
    </main>
  );
}
