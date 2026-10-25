import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";

export const SUBMIT_BUTTON =
  "w-full border-2 border-ink bg-ink px-4 py-3 text-sm font-bold uppercase tracking-widest text-paper transition hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-60";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from ?? "/"} replace />;

  const bind = (name) => ({
    value: form[name],
    onChange: (e) => setForm((current) => ({ ...current, [name]: e.target.value })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to browse stock and manage purchases."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-bold underline decoration-2 underline-offset-4 hover:text-signal">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <FormField label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <FormField label="Password" type="password" autoComplete="current-password" required {...bind("password")} />
        {error && (
          <p role="alert" className="border-2 border-signal bg-signal/10 px-3 py-2 text-sm font-medium text-signal">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={SUBMIT_BUTTON}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
